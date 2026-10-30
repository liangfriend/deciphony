import {
  BarlineTypeEnum,
  DoubleNoteAffiliatedSymbolNameEnum,
  MusicScoreTypeEnum,
  getMeasureSlots,
  isNoteNumberSymbol,
  resolveStaffType,
  slotSymbol,
} from '@deciphony/renderer'
import type {Barline, Measure, MusicScore, NoteNumber, NotesNumberInfo, SingleStaff} from '@deciphony/renderer'
import {QUICK_BARLINE_TYPES} from './constants'
import type {MusicScoreToQuickTextResult} from './types'

type Context = {
  slurStartIds: Set<string>
  slurEndIds: Set<string>
  /** 无法表达的内容 → 次数 */
  dropped: Map<string, number>
}

function drop(ctx: Context, reason: string, count = 1): void {
  ctx.dropped.set(reason, (ctx.dropped.get(reason) ?? 0) + count)
}

function barlineText(barline: Barline | undefined): string {
  if (!barline || barline.type === BarlineTypeEnum.Single_barline) return '|'
  const index = QUICK_BARLINE_TYPES.indexOf(barline.type)
  return index < 0 ? '|' : `|${index}`
}

function pitchText(info: Pick<NotesNumberInfo, 'syllable' | 'octaveDot'>): string {
  const octave = info.syllable === 0 ? 0 : info.octaveDot ?? 0
  return '.'.repeat(Math.max(0, octave)) + String(info.syllable) + '.'.repeat(Math.max(0, -octave))
}

function reduceLineCount(chronaxie: number): number {
  let count = 0
  for (let c = chronaxie; c < 64 && count < 6; c *= 2) count++
  return count
}

function durationText(chronaxie: number, dots: number): string {
  if (chronaxie >= 256) return '---' + ','.repeat(dots)
  if (chronaxie >= 128) return dots > 0 ? '--' + ','.repeat(dots - 1) : '-'
  return '/'.repeat(reduceLineCount(chronaxie)) + ','.repeat(dots)
}

/** 括号内点在数字之间会归前一个数字（低八度），所以带高八度点的非首个倚音另起一对 `[]` */
function graceText(list: NotesNumberInfo[] | undefined, ctx: Context): string {
  if (!list?.length) return ''
  let out = ''
  list.forEach((grace, index) => {
    if (grace.accidental) drop(ctx, '变音记号')
    if (index === 0) out += '['
    else if ((grace.octaveDot ?? 0) > 0 && grace.syllable !== 0) out += ']['
    out += pitchText(grace) + '/'.repeat(reduceLineCount(grace.chronaxie ?? 64))
  })
  return out + ']'
}

function slotText(note: NoteNumber, ctx: Context): string {
  const [main, ...chord] = note.notesInfo
  if (!main) return '0'

  const ids = note.notesInfo.map((info) => info.id)
  const starts = ids.filter((id) => ctx.slurStartIds.has(id)).length
  const ends = ids.filter((id) => ctx.slurEndIds.has(id)).length
  if (starts > 1 || ends > 1) drop(ctx, '同一音符位上的多条连音线', Math.max(starts, ends) - 1)
  for (const info of note.notesInfo) if (info.accidental) drop(ctx, '变音记号')

  const prefix = (ends ? '>' : '') + (starts ? '<' : '')
  const chordText = chord.map((info) => `(${pitchText(info)})`).join('')
  return prefix
    + graceText(note.graceNotes, ctx)
    + pitchText(main)
    + chordText
    + graceText(note.graceNotesAfter, ctx)
    + durationText(main.chronaxie ?? 64, main.augmentationDot?.count ?? 0)
}

function measureTokens(measure: Measure, ctx: Context): string[] {
  const tokens: string[] = []
  for (const slot of getMeasureSlots(measure)) {
    const symbol = slotSymbol(slot)
    if (isNoteNumberSymbol(symbol)) tokens.push(slotText(symbol, ctx))
    else drop(ctx, '非简谱音符')
  }
  return tokens
}

function staffLine(staff: SingleStaff, ctx: Context): string {
  const tokens: string[] = []
  staff.measures.forEach((measure) => {
    if (measure.barline_f) drop(ctx, '前置小节线')
    tokens.push(...measureTokens(measure, ctx), barlineText(measure.barline_b))
  })
  return tokens.join(' ')
}

/**
 * 简谱 MusicScore → 快速打谱文本（每个单谱表一行，复谱表之间空一行）。
 * 文本规则表达不了的内容（变音记号、前置小节线等）不转换，汇总在 warnings。
 */
export function musicScoreToQuickNumberNotation(score: MusicScore): MusicScoreToQuickTextResult {
  if (score.grandStaffs.some((grandStaff) => grandStaff.staves.some((staff) => resolveStaffType(staff, score) !== MusicScoreTypeEnum.NumberNotation))) {
    throw new Error('非简谱曲谱，无法转换为快速打谱文本')
  }

  const ctx: Context = {slurStartIds: new Set(), slurEndIds: new Set(), dropped: new Map()}
  for (const symbol of score.affiliatedSymbols) {
    if (symbol.name !== DoubleNoteAffiliatedSymbolNameEnum.Slur) continue
    ctx.slurStartIds.add(symbol.startId)
    ctx.slurEndIds.add(symbol.endId)
  }

  const text = score.grandStaffs
    .map((grandStaff) => grandStaff.staves.map((staff) => staffLine(staff, ctx)).join('\n'))
    .join('\n\n')

  const warnings = [...ctx.dropped].map(([reason, count]) => `${count} 处${reason}无法用文本表示，已忽略`)
  return {text, warnings}
}
