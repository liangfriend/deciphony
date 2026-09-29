import {BarlineTypeEnum} from '@deciphony/renderer'
import {
  QUICK_BARLINE_TYPES,
  QUICK_MAX_ADD_LINES,
  QUICK_MAX_DOTS,
  QUICK_MAX_OCTAVE_DOT,
  QUICK_MAX_REDUCE_LINES,
  QUICK_MIN_OCTAVE_DOT,
} from './constants'
import type {
  QuickDocument,
  QuickGrace,
  QuickGrandStaff,
  QuickMeasure,
  QuickNote,
  QuickParseResult,
  QuickPitch,
  QuickStaff,
} from './types'

type Segment =
  | {kind: 'note'; text: string}
  /** glued：与前一个 `|N` 紧贴（中间无空格、无音符），覆盖前者 */
  | {kind: 'barline'; type: BarlineTypeEnum; glued: boolean}

type Warn = (message: string) => void

const BRACKET_PAIRS: Record<string, string> = {'(': ')', '[': ']', '{': '}'}
const CLOSERS = new Set(Object.values(BRACKET_PAIRS))

function isSyllableChar(ch: string): boolean {
  return /^[0-7Xx]$/.test(ch)
}

function toSyllable(ch: string): QuickPitch['syllable'] {
  if (ch === 'X' || ch === 'x') return 'X'
  return Number(ch) as QuickPitch['syllable']
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function countRun(text: string, start: number, ch: string): number {
  let end = start
  while (text[end] === ch) end++
  return end - start
}

function resolveBarline(code: string, warn: Warn): BarlineTypeEnum {
  if (!code) return BarlineTypeEnum.Single_barline
  const type = QUICK_BARLINE_TYPES[Number(code)]
  if (type) return type
  warn(`小节线 |${code} 未定义（可用 |0 ~ |${QUICK_BARLINE_TYPES.length - 1}），按单小节线处理`)
  return BarlineTypeEnum.Single_barline
}

/** 空格切组后，再把组内的 `|N` 拆成小节线段 */
function splitSegments(line: string, warn: Warn): Segment[] {
  const segments: Segment[] = []
  for (const group of line.trim().split(/\s+/)) {
    let buffer = ''
    let prevIsBarline = false
    let i = 0
    while (i < group.length) {
      if (group[i] !== '|') {
        buffer += group[i]
        i++
        continue
      }
      if (buffer) {
        segments.push({kind: 'note', text: buffer})
        prevIsBarline = false
      }
      buffer = ''
      let end = i + 1
      while (end < group.length && /\d/.test(group[end]!)) end++
      segments.push({
        kind: 'barline',
        type: resolveBarline(group.slice(i + 1, end), warn),
        glued: prevIsBarline,
      })
      prevIsBarline = true
      i = end
    }
    if (buffer) segments.push({kind: 'note', text: buffer})
  }
  return segments
}

type BracketScan = {
  valid: boolean
  /** 开括号下标 → 闭括号下标 */
  pairs: Map<number, number>
  /** 未配对的括号字符下标 */
  strays: Set<number>
}

/** 三种括号须成对且不嵌套才合法 */
function scanBrackets(text: string): BracketScan {
  const pairs = new Map<number, number>()
  const strays = new Set<number>()
  const stack: number[] = []
  let nested = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!
    if (BRACKET_PAIRS[ch]) {
      if (stack.length) nested = true
      stack.push(i)
    } else if (CLOSERS.has(ch)) {
      const top = stack[stack.length - 1]
      if (top != null && BRACKET_PAIRS[text[top]!] === ch) {
        pairs.set(top, i)
        stack.pop()
      } else {
        strays.add(i)
      }
    }
  }
  for (const i of stack) strays.add(i)
  return {valid: !nested && strays.size === 0, pairs, strays}
}

/** 括号不合法时整组括号不起作用：去掉括号及其内容、落单的括号字符 */
function stripBrackets(text: string, scan: BracketScan): string {
  const dropped = new Set(scan.strays)
  for (const [open, close] of scan.pairs) {
    for (let i = open; i <= close; i++) dropped.add(i)
  }
  let out = ''
  for (let i = 0; i < text.length; i++) {
    if (!dropped.has(i)) out += text[i]
  }
  return out
}

/**
 * 括号内的一串小音符：点在首个数字前为高八度，数字后（直到下一个数字）为该数字的低八度；
 * `/` 为前一个数字的减时线（仅倚音）
 */
function parseMiniNotes(inner: string, allowReduce: boolean, warn: Warn): QuickGrace[] {
  const out: QuickGrace[] = []
  let current: QuickGrace | null = null
  let pendingUp = 0
  let i = 0
  while (i < inner.length) {
    const ch = inner[i]!
    if (ch === '.') {
      const run = countRun(inner, i, '.')
      if (current) current.octaveDot = -run
      else pendingUp = run
      i += run
      continue
    }
    if (isSyllableChar(ch)) {
      current = {syllable: toSyllable(ch), octaveDot: pendingUp, reduceLines: 0}
      pendingUp = 0
      out.push(current)
    } else if (ch === '/' && allowReduce && current) {
      current.reduceLines++
    } else {
      warn(`括号内的 \`${ch}\` 无法识别，已忽略`)
    }
    i++
  }
  for (const note of out) {
    note.octaveDot = note.syllable === 0 ? 0 : clamp(note.octaveDot, QUICK_MIN_OCTAVE_DOT, QUICK_MAX_OCTAVE_DOT)
    note.reduceLines = clamp(note.reduceLines, 0, QUICK_MAX_REDUCE_LINES)
  }
  return out
}

function parseNoteGroup(source: string, warnFor: (source: string) => Warn): QuickNote | null {
  const warn = warnFor(source)
  const scan = scanBrackets(source)
  let text = source
  let pairs = scan.pairs
  if (!scan.valid) {
    warn('括号不配套（或嵌套），括号不起作用')
    text = stripBrackets(source, scan)
    pairs = new Map()
  }

  const note: QuickNote = {
    pitch: {syllable: 0, octaveDot: 0},
    chord: [],
    reduceLines: 0,
    addLines: 0,
    dots: 0,
    graceBefore: [],
    graceAfter: [],
    slurStart: false,
    slurEnd: false,
    source,
  }
  let mainFound = false
  let octave = 0

  let i = 0
  while (i < text.length) {
    const ch = text[i]!
    const close = pairs.get(i)
    if (close != null) {
      const inner = text.slice(i + 1, close)
      i = close + 1
      if (ch === '[') {
        const graces = parseMiniNotes(inner, true, warn)
        if (!graces.length) warn('`[]` 内没有倚音')
        ;(mainFound ? note.graceAfter : note.graceBefore).push(...graces)
      } else if (ch === '(') {
        if (!mainFound) {
          warn('`(…)` 须紧贴在音符后，已忽略')
          continue
        }
        const chord = parseMiniNotes(inner, false, warn)
        if (!chord.length) warn('`()` 内没有音符')
        note.chord.push(...chord.map(({syllable, octaveDot}) => ({syllable, octaveDot})))
      } else {
        warn('`{…}` 暂无含义，已忽略')
      }
      continue
    }
    if (ch === '.') {
      const run = countRun(text, i, '.')
      octave = mainFound ? -run : run
      i += run
      continue
    }
    if (isSyllableChar(ch)) {
      if (mainFound) warn(`一组只能有一个主音，多余的 \`${ch}\` 已忽略`)
      else {
        note.pitch.syllable = toSyllable(ch)
        mainFound = true
      }
    } else if (ch === ',' || ch === '/' || ch === '-') {
      if (!mainFound) warn(`\`${ch}\` 须写在音符后，已忽略`)
      else if (ch === ',') note.dots++
      else if (ch === '/') note.reduceLines++
      else note.addLines++
    } else if (ch === '<' || ch === '>') {
      if (mainFound) warn(`\`${ch}\` 须写在音符前，已忽略`)
      else if (ch === '<') note.slurStart = true
      else note.slurEnd = true
    } else {
      warn(`\`${ch}\` 无法识别，已忽略`)
    }
    i++
  }

  if (!mainFound) {
    warn('没有音符（0-7），整组已忽略')
    return null
  }

  note.pitch.octaveDot = note.pitch.syllable === 0 ? 0 : clamp(octave, QUICK_MIN_OCTAVE_DOT, QUICK_MAX_OCTAVE_DOT)
  if (note.pitch.syllable === 0 && note.chord.length) {
    warn('休止符不能叠音，`(…)` 已忽略')
    note.chord = []
  }
  if (note.addLines && note.reduceLines) {
    warn('`-` 与 `/` 不能同时使用，已忽略 `/`')
    note.reduceLines = 0
  }
  if (note.addLines > QUICK_MAX_ADD_LINES) warn(`最多 ${QUICK_MAX_ADD_LINES} 条加时线`)
  if (note.reduceLines > QUICK_MAX_REDUCE_LINES) warn(`最多 ${QUICK_MAX_REDUCE_LINES} 条减时线`)
  if (note.dots > QUICK_MAX_DOTS) warn(`最多 ${QUICK_MAX_DOTS} 个附点`)
  note.addLines = Math.min(note.addLines, QUICK_MAX_ADD_LINES)
  note.reduceLines = Math.min(note.reduceLines, QUICK_MAX_REDUCE_LINES)
  note.dots = Math.min(note.dots, QUICK_MAX_DOTS)
  return note
}

/**
 * 一行 → 单谱表：每个 `|` 结束一个小节（后置小节线），前面没有音符就是空小节；
 * 紧贴连写的 `|1|2` 后者覆盖前者
 */
function parseStaffLine(raw: string, line: number, warnings: string[]): QuickStaff {
  const lineWarn: Warn = (message) => warnings.push(`第 ${line} 行：${message}`)
  const warnFor = (source: string): Warn => (message) => warnings.push(`第 ${line} 行 \`${source}\`：${message}`)

  const measures: QuickMeasure[] = []
  let current: QuickMeasure = {notes: []}
  let lastClosed: QuickMeasure | null = null

  for (const segment of splitSegments(raw, lineWarn)) {
    if (segment.kind === 'note') {
      const note = parseNoteGroup(segment.text, warnFor)
      if (note) current.notes.push(note)
      continue
    }
    if (segment.glued && lastClosed) {
      lastClosed.barlineBack = segment.type
      continue
    }
    current.barlineBack = segment.type
    measures.push(current)
    lastClosed = current
    current = {notes: []}
  }
  if (current.notes.length || !measures.length) measures.push(current)
  return {line, measures}
}

/**
 * 快速打谱文本 → 中间结构。
 * - 一行 = 一个单谱表；连续的非空行同属一个复谱表，空行开启新的复谱表
 * - 不生成 MusicScore，连音线配对也留给构建阶段
 */
export function parseQuickNumberNotation(text: string): QuickParseResult {
  const warnings: string[] = []
  const grandStaffs: QuickGrandStaff[] = []
  let current: QuickGrandStaff | null = null

  text.replace(/\r\n?/g, '\n').split('\n').forEach((raw, index) => {
    if (!raw.trim()) {
      current = null
      return
    }
    if (!current) {
      current = {staves: []}
      grandStaffs.push(current)
    }
    current.staves.push(parseStaffLine(raw, index + 1, warnings))
  })

  const document: QuickDocument = {grandStaffs}
  return {document, warnings}
}
