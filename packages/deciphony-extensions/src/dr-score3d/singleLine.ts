import {getMeasureSlots, isMeasureNoteVoices} from '@deciphony/renderer'
import type {GrandStaff, Measure, MusicScore, SingleStaff} from '@deciphony/renderer'
import {createMeasure} from '../dr-edit/score-builder'
import type {SingleLineOptions} from './types'

type MeasureCell = {measure: Measure; lineStart: boolean}

function sameType(a?: {type: unknown}, b?: {type: unknown}): boolean {
  return !!a && !!b && a.type === b.type
}

function emptyMeasureLike(sample: Measure | undefined): Measure {
  return createMeasure({voices: !!sample && isMeasureNoteVoices(sample.notes)})
}

/**
 * 换行处的提示符号在单行里多余：
 * - 行末 clef_b + 下一行首同类 clef_f：保留行内的 clef_b（谱号变化写在小节线前），去掉 clef_f
 * - 行末 keySignature_b / timeSignature_b + 下一行首同类 _f：去掉行末提示，保留下一小节开头
 * - 行首 clef_f / keySignature_f / timeSignature_f 与当前生效值相同：去掉
 */
function dropLineBreakCourtesy(cells: MeasureCell[]): void {
  for (let i = 1; i < cells.length; i++) {
    if (!cells[i]!.lineStart) continue
    const prev = cells[i - 1]!.measure
    const cur = cells[i]!.measure
    if (sameType(prev.clef_b, cur.clef_f)) delete cur.clef_f
    if (sameType(prev.keySignature_b, cur.keySignature_f)) delete prev.keySignature_b
    if (sameType(prev.timeSignature_b, cur.timeSignature_f)) delete prev.timeSignature_b
  }

  let clef: {type: unknown} | undefined
  let key: {type: unknown} | undefined
  let time: {type: unknown} | undefined
  for (const {measure, lineStart} of cells) {
    if (lineStart) {
      if (sameType(measure.clef_f, clef)) delete measure.clef_f
      if (sameType(measure.keySignature_f, key)) delete measure.keySignature_f
      if (sameType(measure.timeSignature_f, time)) delete measure.timeSignature_f
    }
    clef = measure.clef_f ?? clef
    key = measure.keySignature_f ?? key
    time = measure.timeSignature_f ?? time
    for (const slot of getMeasureSlots(measure)) {
      const sym = slot.symbol as {clef?: {type: unknown}} | undefined
      if (sym?.clef) clef = sym.clef
    }
    clef = measure.clef_b ?? clef
    key = measure.keySignature_b ?? key
    time = measure.timeSignature_b ?? time
  }
}

/**
 * 把多行曲谱（多个复谱表）合并成一个复谱表的单行曲谱，返回新对象，不改原谱。
 * - 第 i 个单谱表依次拼接各行第 i 个单谱表的小节；某行缺谱表 / 小节数不齐时补空小节，保证后续小节列对齐
 * - 复谱表 / 单谱表的间距、连谱号、自定义 data 取第一次出现的那一行
 * - 换行处重复的谱号 / 调号 / 拍号提示会去掉（见 dropLineBreakCourtesy）
 * - 所有 id 不变，曲谱级附属（连音线、跳房子等）照常挂接
 */
export function toSingleLineMusicScore(musicScore: MusicScore, options: SingleLineOptions = {}): MusicScore {
  const score = JSON.parse(JSON.stringify(musicScore)) as MusicScore
  const lines = score.grandStaffs
  const lineCount = Math.max(1, lines.length)
  const width = options.width ?? score.width * lineCount
  const height = options.height
    ?? Math.max(score.topSpaceHeight + 1, score.topSpaceHeight + (score.height - score.topSpaceHeight) / lineCount)
  if (lines.length <= 1) return {...score, width, height}

  const staffCount = Math.max(...lines.map((gs) => gs.staves.length))
  const columns: MeasureCell[][] = Array.from({length: staffCount}, () => [])
  const staffTemplates: (SingleStaff | undefined)[] = new Array(staffCount).fill(undefined)

  for (const gs of lines) {
    const lineMeasures = Math.max(0, ...gs.staves.map((s) => s.measures.length))
    for (let si = 0; si < staffCount; si++) {
      const staff = gs.staves[si]
      if (staff && !staffTemplates[si]) staffTemplates[si] = staff
      const measures = staff?.measures ?? []
      for (let mi = 0; mi < lineMeasures; mi++) {
        const measure = measures[mi] ?? emptyMeasureLike(measures[0] ?? gs.staves[0]?.measures[0])
        columns[si]!.push({measure, lineStart: mi === 0})
      }
    }
  }

  const staves: SingleStaff[] = columns.map((cells, si) => {
    dropLineBreakCourtesy(cells)
    return {...staffTemplates[si]!, measures: cells.map((c) => c.measure)}
  })

  const first = lines[0]!
  const grandStaff: GrandStaff = {...first, staves}
  return {...score, grandStaffs: [grandStaff], width, height}
}
