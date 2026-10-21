import type {ClChord, ClLyric, ClLyricLine, ClSheetData} from './types'

let idSeq = 0

export function createLyricId(): string {
  idSeq = (idSeq + 1) % 1679616
  return 'cl' + Date.now().toString(36) + idSeq.toString(36).padStart(4, '0')
}

export function createClSheet(partial: Partial<ClSheetData> = {}): ClSheetData {
  return {
    title: '',
    author: '',
    width: 600,
    height: 400,
    lyrics: [],
    data: {},
    ...partial,
  }
}

/** 新建歌词单位的选项 */
export type ClLyricCreateOptions = {
  /** 新字的歌词颜色 */
  color?: string
}

/** 一行文字拆成歌词单位（一个字一个） */
export function textToLyricLine(text: string, options: ClLyricCreateOptions = {}): ClLyricLine {
  return Array.from(text).map((ch) => ({id: createLyricId(), text: ch, ...(options.color ? {color: options.color} : {})}))
}

export function lyricLineText(line: ClLyricLine): string {
  return line.map((l) => l.text).join('')
}

/** 一行的字数（按 Unicode 码点） */
export function lyricLineCharCount(line: ClLyricLine): number {
  return line.reduce((n, l) => n + Array.from(l.text).length, 0)
}

/** 按字数切分一行：返回 [前 count 个字, 其余] */
export function splitLyricLine(line: ClLyricLine, count: number): [ClLyricLine, ClLyricLine] {
  let n = 0
  let k = 0
  while (k < line.length && n < count) {
    n += Array.from(line[k]!.text).length
    k++
  }
  return [line.slice(0, k), line.slice(k)]
}

/**
 * 改写一行文字并尽量保留原有和弦 / 颜色 / id：
 * 按字做最长公共子序列，未改动的字原样保留；被删掉的字上的和弦移到紧随其后的新字上
 * （没有就落到行尾）；新插入的字沿用前一个字的下划线，颜色用 options.color，没给就沿用前一个字的颜色。
 */
export function retextLyricLine(line: ClLyricLine, text: string, options: ClLyricCreateOptions = {}): ClLyricLine {
  const next = Array.from(text)
  const n = line.length
  const m = next.length
  const lcs: number[][] = Array.from({length: n + 1}, () => new Array<number>(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i]![j] = line[i]!.text === next[j]
          ? lcs[i + 1]![j + 1]! + 1
          : Math.max(lcs[i + 1]![j]!, lcs[i]![j + 1]!)
    }
  }

  const result: ClLyricLine = []
  let pending: ClChord | undefined
  const push = (lyric: ClLyric) => {
    if (pending && !lyric.chord) {
      lyric.chord = pending
      pending = undefined
    }
    result.push(lyric)
  }
  let i = 0
  let j = 0
  while (i < n || j < m) {
    if (i < n && j < m && line[i]!.text === next[j]) {
      push({...line[i]!})
      i++
      j++
    } else if (i < n && (j >= m || lcs[i + 1]![j]! >= lcs[i]![j + 1]!)) {
      if (line[i]!.chord && !pending) pending = line[i]!.chord
      i++
    } else {
      const prev = result[result.length - 1]
      const color = options.color ?? prev?.color
      push({
        id: createLyricId(),
        text: next[j]!,
        ...(color ? {color} : {}),
        ...(prev?.underline ? {underline: true} : {}),
      })
      j++
    }
  }
  if (pending) {
    const last = result[result.length - 1]
    if (last && !last.chord) last.chord = pending
    else result.push({id: createLyricId(), text: ' ', chord: pending})
  }
  return result
}

export function isSameLyricLine(a: ClLyricLine, b: ClLyricLine): boolean {
  return a.length === b.length && a.every((l, k) => {
    const o = b[k]!
    return l.id === o.id && l.text === o.text && l.color === o.color && !!l.underline === !!o.underline
        && l.chord?.text === o.chord?.text && l.chord?.color === o.chord?.color
  })
}

type TextAttrs = {color?: string; underline?: boolean}

const COLOR_RE = /^(#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})|[a-z]+|(?:rgb|rgba|hsl|hsla)\([^)]*\))$/i

function isColor(value: string): boolean {
  if (!COLOR_RE.test(value)) return false
  return typeof CSS === 'undefined' || !CSS.supports || CSS.supports('color', value)
}

/** `{red}` / `{#fff,u}` / `{u}` 的花括号内容；没有可识别的属性返回 null（当普通文字） */
function parseAttrs(content: string): TextAttrs | null {
  const attrs: TextAttrs = {}
  for (const part of content.match(/[a-z]+\([^)]*\)|[^,\s]+/gi) ?? []) {
    if (part === 'u') attrs.underline = true
    else if (isColor(part)) attrs.color = part
    else return null
  }
  return attrs.color || attrs.underline ? attrs : null
}

function attrsText(attrs: TextAttrs): string {
  const parts = [attrs.color, attrs.underline ? 'u' : ''].filter(Boolean)
  return parts.length ? `{${parts.join(',')}}` : ''
}

/**
 * 方括号写法 → 歌词行：`[C]好一朵美丽的[Am]茉莉花`，和弦挂到紧随其后的字上；
 * 行尾或连续的和弦挂在空格上。
 * `{颜色}` 只作用于紧随其后的一个元素：后面是 `[和弦]` 就是和弦颜色，是字就是歌词颜色；
 * 歌词还可以加 `u` 表示下划线，如 `{red}[C]{#1d6fd8,u}好`。
 */
export function parseChordLyrics(text: string): ClLyricLine[] {
  return text.replace(/\r\n?/g, '\n').split('\n').map((row) => {
    const line: ClLyricLine = []
    let pendingChord: ClChord | undefined
    let pendingAttrs: TextAttrs | undefined
    const flushChord = () => {
      if (pendingChord) line.push({id: createLyricId(), text: ' ', chord: pendingChord})
      pendingChord = undefined
    }
    const chars = Array.from(row)
    for (let k = 0; k < chars.length; k++) {
      const ch = chars[k]!
      if (ch === '{') {
        const end = chars.indexOf('}', k + 1)
        const attrs = end > k ? parseAttrs(chars.slice(k + 1, end).join('')) : null
        if (attrs) {
          pendingAttrs = attrs
          k = end
          continue
        }
      }
      if (ch === '[') {
        const end = chars.indexOf(']', k + 1)
        if (end > k) {
          flushChord()
          const name = chars.slice(k + 1, end).join('').trim()
          if (name) pendingChord = {text: name, ...(pendingAttrs?.color ? {color: pendingAttrs.color} : {})}
          pendingAttrs = undefined
          k = end
          continue
        }
      }
      line.push({
        id: createLyricId(),
        text: ch,
        ...(pendingAttrs?.color ? {color: pendingAttrs.color} : {}),
        ...(pendingAttrs?.underline ? {underline: true} : {}),
        ...(pendingChord ? {chord: pendingChord} : {}),
      })
      pendingChord = undefined
      pendingAttrs = undefined
    }
    flushChord()
    return line
  })
}

/** 歌词行 → 方括号写法（颜色、下划线用 `{}` 保留） */
export function stringifyChordLyrics(lines: ClLyricLine[]): string {
  return lines.map((line) => line.map((l) => {
    const chord = l.chord ? attrsText({color: l.chord.color}) + `[${l.chord.text}]` : ''
    return chord + attrsText(l) + l.text
  }).join('')).join('\n')
}