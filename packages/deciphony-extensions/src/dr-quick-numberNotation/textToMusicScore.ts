import {
  BarlineTypeEnum,
  BeamTypeEnum,
  MusicScoreTypeEnum,
  TimeSignatureTypeEnum,
  slotSymbol,
  timeSignatureTypeToBeats,
} from '@deciphony/renderer'
import type {Chronaxie, Measure, MeasureNoteSlot, MusicScore, NoteNumber, NotesNumberInfo} from '@deciphony/renderer'
import {
  DEFAULT_MEASURE_HEIGHT,
  DEFAULT_SPACING,
  chronaxieWithDots,
  createGrandStaff,
  createMeasure,
  createMusicScore,
  createNoteNumber,
  createNotesNumberInfo,
  createSingleStaff,
  createSlur,
} from '../dr-edit/score-builder'
import {parseQuickNumberNotation} from './parser'
import type {
  QuickDocument,
  QuickGrace,
  QuickMeasure,
  QuickNote,
  QuickStaff,
  QuickTextToMusicScoreOptions,
  QuickTextToMusicScoreResult,
} from './types'

const TOP_SPACE_HEIGHT = 16
const NUMBER_NOTATION = MusicScoreTypeEnum.NumberNotation

type OctaveDot = NotesNumberInfo['octaveDot']

/** 一行（复谱表）高度估算：上下留白 + 每个谱表（小节高 + 内外留白） */
function estimateLineHeight(staffCount: number): number {
  const {uSpace, dSpace} = DEFAULT_SPACING.grandStaff
  const {uSpaceI, dSpaceI, uSpaceO, dSpaceO} = DEFAULT_SPACING.singleStaff
  return uSpace + dSpace + staffCount * (DEFAULT_MEASURE_HEIGHT + uSpaceI + dSpaceI + uSpaceO + dSpaceO)
}

/** 小节容量（chronaxie，256 = 全音符） */
function measureCapacity(timeSignature: TimeSignatureTypeEnum): number {
  const {beats, beatType} = timeSignatureTypeToBeats(timeSignature)
  return (beats * 256) / beatType
}

/**
 * 加时线：1 条 = 二分；2 条 = 二分 + 附点（三拍）；3 条 = 全音符。`,` 在此基础上再加附点。
 * 无加时线时按减时线减半。
 */
export function resolveQuickDuration(note: Pick<QuickNote, 'addLines' | 'reduceLines' | 'dots'>): {
  chronaxie: Chronaxie
  dots: number
} {
  if (note.addLines === 1) return {chronaxie: 128, dots: note.dots}
  if (note.addLines === 2) return {chronaxie: 128, dots: Math.min(3, note.dots + 1)}
  if (note.addLines >= 3) return {chronaxie: 256, dots: note.dots}
  return {chronaxie: (64 >> note.reduceLines) as Chronaxie, dots: note.dots}
}

function dotOption(dots: number): {augmentationDot?: 1 | 2 | 3} {
  return dots > 0 ? {augmentationDot: dots as 1 | 2 | 3} : {}
}

/** 倚音：连续的带减时线倚音首个右连、其余全连 */
function buildGraces(list: QuickGrace[]): NotesNumberInfo[] | undefined {
  if (!list.length) return undefined
  return list.map((grace, index) => {
    const chronaxie = (64 >> grace.reduceLines) as Chronaxie
    const prev = list[index - 1]
    const beamType = chronaxie > 32
      ? BeamTypeEnum.None
      : prev && prev.reduceLines > 0 ? BeamTypeEnum.Combined : BeamTypeEnum.OnlyRight
    return createNotesNumberInfo(grace.syllable, {
      octaveDot: grace.octaveDot as OctaveDot,
      chronaxie,
      beamType,
    })
  })
}

type SlurContext = {
  score: MusicScore
  /** 复谱表内单谱表下标 → 未闭合的 `<` 起点 */
  stacks: Map<number, {info: NotesNumberInfo; source: string; line: number}[]>
  warnings: string[]
}

function applySlur(ctx: SlurContext, staffIndex: number, note: QuickNote, info: NotesNumberInfo, line: number): void {
  let stack = ctx.stacks.get(staffIndex)
  if (!stack) {
    stack = []
    ctx.stacks.set(staffIndex, stack)
  }
  if (note.slurEnd) {
    const start = stack.pop()
    if (start) ctx.score.affiliatedSymbols.push(createSlur({startId: start.info.id, endId: info.id}))
    else ctx.warnings.push(`第 ${line} 行 \`${note.source}\`：\`>\` 前面没有对应的 \`<\`，已忽略`)
  }
  if (note.slurStart) stack.push({info, source: note.source, line})
}

function buildMeasure(
  quick: QuickMeasure,
  staff: QuickStaff,
  measureIndex: number,
  staffIndex: number,
  capacity: number,
  slur: SlurContext,
): Measure {
  const measure = createMeasure({barline: quick.barlineBack ?? BarlineTypeEnum.Single_barline})
  let onset = 0
  const slots: MeasureNoteSlot[] = []
  for (const note of quick.notes) {
    const {chronaxie, dots} = resolveQuickDuration(note)
    const slot = createNoteNumber({
      syllable: note.pitch.syllable,
      chronaxie,
      beamOnset: onset,
      notesInfo: [note.pitch, ...note.chord].map((pitch) => ({
        syllable: pitch.syllable,
        octaveDot: pitch.octaveDot as OctaveDot,
        ...dotOption(dots),
      })),
    })
    const symbol = slotSymbol(slot) as NoteNumber
    const graceNotes = buildGraces(note.graceBefore)
    const graceNotesAfter = buildGraces(note.graceAfter)
    if (graceNotes) symbol.graceNotes = graceNotes
    if (graceNotesAfter) symbol.graceNotesAfter = graceNotesAfter
    slots.push(slot)
    applySlur(slur, staffIndex, note, symbol.notesInfo[0]!, staff.line)
    onset += chronaxieWithDots(chronaxie, dots)
  }
  measure.notes = slots

  if (quick.notes.length && onset !== capacity) {
    slur.warnings.push(
      `第 ${staff.line} 行第 ${measureIndex + 1} 小节：时值 ${onset / 64} 拍，与拍号 ${capacity / 64} 拍不符`,
    )
  }
  return measure
}

/** 中间结构 → 简谱 MusicScore（顶层调号 / 拍号；小节只带小节线） */
export function quickDocumentToMusicScore(
  document: QuickDocument,
  options: QuickTextToMusicScoreOptions = {},
  warnings: string[] = [],
): QuickTextToMusicScoreResult {
  const timeSignature = options.timeSignature ?? TimeSignatureTypeEnum['4_4']
  const capacity = measureCapacity(timeSignature)
  const grandStaffs = document.grandStaffs.length
    ? document.grandStaffs
    : [{staves: [{line: 0, measures: [{notes: []}]}]}]
  const contentHeight = grandStaffs.reduce((sum, g) => sum + estimateLineHeight(g.staves.length), 0)

  const score = createMusicScore({
    ...options,
    type: NUMBER_NOTATION,
    timeSignature,
    width: options.width ?? 1000,
    height: options.height ?? (options.topSpaceHeight ?? TOP_SPACE_HEIGHT) + contentHeight,
    topSpaceHeight: options.topSpaceHeight ?? TOP_SPACE_HEIGHT,
  })
  const slur: SlurContext = {score, stacks: new Map(), warnings}

  for (const quickGrandStaff of grandStaffs) {
    const grandStaff = createGrandStaff({notationType: NUMBER_NOTATION, withDefaultStaff: false})
    quickGrandStaff.staves.forEach((quickStaff, staffIndex) => {
      const staff = createSingleStaff({notationType: NUMBER_NOTATION, withDefaultMeasure: false})
      staff.measures = quickStaff.measures.map((measure, measureIndex) =>
        buildMeasure(measure, quickStaff, measureIndex, staffIndex, capacity, slur),
      )
      grandStaff.staves.push(staff)
    })
    score.grandStaffs.push(grandStaff)
  }

  for (const stack of slur.stacks.values()) {
    for (const open of stack) {
      warnings.push(`第 ${open.line} 行 \`${open.source}\`：\`<\` 没有对应的 \`>\`，已忽略`)
    }
  }
  return {musicScore: score, warnings}
}

/**
 * 快速打谱文本 → 简谱 MusicScore。
 * options 透传曲谱元信息（标题、调号、拍号、bpm、宽高…）；拍号缺省 4/4，高度缺省按行数估算。
 */
export function quickNumberNotationToMusicScore(
  text: string,
  options: QuickTextToMusicScoreOptions = {},
): QuickTextToMusicScoreResult {
  const {document, warnings} = parseQuickNumberNotation(text)
  return quickDocumentToMusicScore(document, options, warnings)
}
