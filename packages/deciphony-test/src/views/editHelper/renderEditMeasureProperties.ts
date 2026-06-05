import type {
  DoubleMeasureAffiliatedSymbol,
  Measure,
  MusicScore,
  SingleStaff,
  SlotData,
} from 'deciphony-renderer'
import {
  BarlineTypeEnum,
  ClefTypeEnum,
  DoubleMeasureAffiliatedSymbolNameEnum,
  KeySignatureTypeEnum,
  MeasureEndRepeatEnum,
  MeasureStartRepeatEnum,
  TimeSignatureTypeEnum,
} from 'deciphony-renderer'
import {insertMeasure} from '../dr-extensions/dr-edit/edit-util'
import {
  createBarline,
  createClef,
  createKeySignature,
  createMeasureEndRepeat,
  createMeasureStartRepeat,
  createTimeSignature,
  createVolta,
} from '../dr-extensions/dr-edit/score-builder'

export type MeasureEditSlot = SlotData & {measure: Measure; singleStaff: SingleStaff}

export const BARLINE_OPTIONS: {value: BarlineTypeEnum; label: string}[] = [
  {value: BarlineTypeEnum.Single_barline, label: '单小节线'},
  {value: BarlineTypeEnum.Double_barline, label: '双小节线'},
  {value: BarlineTypeEnum.StartRepeat_barline, label: '反复开始'},
  {value: BarlineTypeEnum.EndRepeat_barline, label: '反复结束'},
  {value: BarlineTypeEnum.Dashed_barline, label: '虚线'},
  {value: BarlineTypeEnum.Final_barline, label: '终止线'},
  {value: BarlineTypeEnum.Start_end_repeat_barline, label: '反复起止'},
  {value: BarlineTypeEnum.Dotted_barline, label: '点线'},
  {value: BarlineTypeEnum.Reverse_barline, label: '反小节线'},
  {value: BarlineTypeEnum.Heavy_barline, label: '粗线'},
  {value: BarlineTypeEnum.Heavy_double_barline, label: '粗双线'},
]

export const CLEF_OPTIONS: {value: ClefTypeEnum; label: string}[] = [
  {value: ClefTypeEnum.Treble, label: '高音谱号'},
  {value: ClefTypeEnum.Bass, label: '低音谱号'},
  {value: ClefTypeEnum.Alto, label: '中音谱号'},
  {value: ClefTypeEnum.Tenor, label: '次中音谱号'},
]

export const KEY_SIGNATURE_OPTIONS: {value: KeySignatureTypeEnum; label: string}[] = [
  {value: KeySignatureTypeEnum.C, label: 'C 大调'},
  {value: KeySignatureTypeEnum.G, label: 'G 大调'},
  {value: KeySignatureTypeEnum.D, label: 'D 大调'},
  {value: KeySignatureTypeEnum.A, label: 'A 大调'},
  {value: KeySignatureTypeEnum.E, label: 'E 大调'},
  {value: KeySignatureTypeEnum.B, label: 'B 大调'},
  {value: KeySignatureTypeEnum.F_sharp, label: 'F♯ 大调'},
  {value: KeySignatureTypeEnum.C_sharp, label: 'C♯ 大调'},
  {value: KeySignatureTypeEnum.F, label: 'F 大调'},
  {value: KeySignatureTypeEnum.B_flat, label: 'B♭ 大调'},
  {value: KeySignatureTypeEnum.E_flat, label: 'E♭ 大调'},
  {value: KeySignatureTypeEnum.A_flat, label: 'A♭ 大调'},
  {value: KeySignatureTypeEnum.D_flat, label: 'D♭ 大调'},
  {value: KeySignatureTypeEnum.G_flat, label: 'G♭ 大调'},
  {value: KeySignatureTypeEnum.C_flat, label: 'C♭ 大调'},
]

export const TIME_SIGNATURE_OPTIONS: {value: TimeSignatureTypeEnum; label: string}[] = [
  {value: TimeSignatureTypeEnum['4_4'], label: '4/4'},
  {value: TimeSignatureTypeEnum['3_4'], label: '3/4'},
  {value: TimeSignatureTypeEnum['2_4'], label: '2/4'},
  {value: TimeSignatureTypeEnum['1_4'], label: '1/4'},
  {value: TimeSignatureTypeEnum['3_8'], label: '3/8'},
  {value: TimeSignatureTypeEnum['6_8'], label: '6/8'},
  {value: TimeSignatureTypeEnum['1_1'], label: '1/1'},
]

export const START_REPEAT_OPTIONS: {value: MeasureStartRepeatEnum; label: string}[] = [
  {value: MeasureStartRepeatEnum.Segno, label: 'Segno'},
  {value: MeasureStartRepeatEnum.Coda, label: 'Coda'},
]

export const END_REPEAT_OPTIONS: {value: MeasureEndRepeatEnum; label: string}[] = [
  {value: MeasureEndRepeatEnum.Fine, label: 'Fine'},
  {value: MeasureEndRepeatEnum.DC, label: 'D.C.'},
  {value: MeasureEndRepeatEnum.DS, label: 'D.S.'},
  {value: MeasureEndRepeatEnum.To_coda, label: 'To Coda'},
  {value: MeasureEndRepeatEnum.DC_al_fine, label: 'D.C. al Fine'},
  {value: MeasureEndRepeatEnum.DC_al_coda, label: 'D.C. al Coda'},
  {value: MeasureEndRepeatEnum.DS_al_fine, label: 'D.S. al Fine'},
  {value: MeasureEndRepeatEnum.DS_al_coda, label: 'D.S. al Coda'},
]

export function insertMeasureBefore(slot: MeasureEditSlot): Measure {
  return insertMeasure(slot.singleStaff, slot.measure, 'before')
}

export function insertMeasureAfter(slot: MeasureEditSlot): Measure {
  return insertMeasure(slot.singleStaff, slot.measure, 'after')
}

export function setMeasureBarlineB(measure: Measure, type: BarlineTypeEnum): void {
  if (measure.barline_b) {
    measure.barline_b.type = type
  } else {
    measure.barline_b = createBarline(type)
  }
}

export function setMeasureBarlineF(measure: Measure, type: BarlineTypeEnum | null): void {
  if (type == null) {
    delete measure.barline_f
    return
  }
  if (measure.barline_f) {
    measure.barline_f.type = type
  } else {
    measure.barline_f = createBarline(type)
  }
}

export function setMeasureClefF(measure: Measure, type: ClefTypeEnum | null): void {
  if (type == null) {
    delete measure.clef_f
    return
  }
  if (measure.clef_f) {
    measure.clef_f.type = type
  } else {
    measure.clef_f = createClef(type)
  }
}

export function setMeasureKeySignatureF(measure: Measure, type: KeySignatureTypeEnum | null): void {
  if (type == null) {
    delete measure.keySignature_f
    return
  }
  if (measure.keySignature_f) {
    measure.keySignature_f.type = type
  } else {
    measure.keySignature_f = createKeySignature(type)
  }
}

export function setMeasureTimeSignatureF(measure: Measure, type: TimeSignatureTypeEnum | null): void {
  if (type == null) {
    delete measure.timeSignature_f
    return
  }
  if (measure.timeSignature_f) {
    measure.timeSignature_f.type = type
  } else {
    measure.timeSignature_f = createTimeSignature(type)
  }
}

export function setMeasureStartRepeat(measure: Measure, type: MeasureStartRepeatEnum | null): void {
  if (type == null) {
    delete measure.startRepeat
    return
  }
  if (measure.startRepeat) {
    measure.startRepeat.type = type
  } else {
    measure.startRepeat = createMeasureStartRepeat(type)
  }
}

export function setMeasureEndRepeat(measure: Measure, type: MeasureEndRepeatEnum | null): void {
  if (type == null) {
    delete measure.endRepeat
    return
  }
  if (measure.endRepeat) {
    measure.endRepeat.type = type
  } else {
    measure.endRepeat = createMeasureEndRepeat(type)
  }
}

/** 以当前小节为终点查找 volta（endId 匹配） */
export function findVoltaEndingAt(
  musicScore: MusicScore,
  measureId: string,
): DoubleMeasureAffiliatedSymbol | undefined {
  return musicScore.affiliatedSymbols.find(
    (sym) =>
      sym.name === DoubleMeasureAffiliatedSymbolNameEnum.Volta
      && sym.endId === measureId
      && sym.data?.volta,
  ) as DoubleMeasureAffiliatedSymbol | undefined
}

export function addVoltaEndingAtMeasure(musicScore: MusicScore, measure: Measure): DoubleMeasureAffiliatedSymbol {
  const existing = findVoltaEndingAt(musicScore, measure.id)
  if (existing) return existing
  const volta = createVolta({
    startId: measure.id,
    endId: measure.id,
    text: '1.',
    value: [0],
  })
  musicScore.affiliatedSymbols.push(volta)
  return volta
}

export function removeVolta(musicScore: MusicScore, voltaId: string): void {
  const idx = musicScore.affiliatedSymbols.findIndex((sym) => sym.id === voltaId)
  if (idx >= 0) musicScore.affiliatedSymbols.splice(idx, 1)
}

/** 内部存储（0 起）→ 用户展示（1 起） */
export function voltaValueToDisplay(values: number[]): number[] {
  return values.map((v) => v + 1)
}

/** 用户输入（1 起）→ 内部存储（0 起） */
export function voltaValueFromDisplay(values: number[]): number[] {
  const nums = values
    .map((v) => Math.trunc(v) - 1)
    .filter((n) => Number.isFinite(n) && n >= 0)
  const unique = [...new Set(nums)].sort((a, b) => a - b)
  return unique.length > 0 ? unique : [0]
}

export function parseVoltaValueText(text: string): number[] {
  const parts = text.split(/[,，\s]+/).map((s) => s.trim()).filter(Boolean)
  const displayNums = parts
    .map((p) => Number.parseInt(p, 10))
    .filter((n) => Number.isFinite(n) && n >= 1)
  return voltaValueFromDisplay(displayNums)
}

export function formatVoltaValue(value: number[]): string {
  return voltaValueToDisplay(value).join(', ')
}
