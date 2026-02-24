import {
  BarlineTypeEnum,
  ClefTypeEnum,
  KeySignatureTypeEnum,
  BeamTypeEnum,
  NoteSymbolTypeEnum,
  TimeSignatureTypeEnum,
} from 'deciphony-renderer'
import type { Chronaxie } from 'deciphony-renderer'
import type { GrandStaff, Measure, NoteSymbol, SingleStaff } from 'deciphony-renderer'

const frame = { relativeH: 0, relativeY: 0, relativeW: 0, relativeX: 0 }

/** 全音符=256, 二分=128, 四分=64... 六十四分=4 */
export const CHRONAXIES: Chronaxie[] = [256, 128, 64, 32, 16, 8, 4, 2, 1]

export const CHRONAXIE_LABELS: Record<number, string> = {
  256: '全',
  128: '二分',
  64: '四分',
  32: '八分',
  16: '十六',
  8: '三十二',
  4: '六十四',
  2: '128',
  1: '256',
}

function createGrandStaff(): GrandStaff {
  const measure: Measure = {
    ...frame,
    id: crypto.randomUUID(),
    notes: [],
    affiliatedSymbols: [],
    widthRatioForMeasure: 100,
    clef_f: {
      ...frame,
      id: crypto.randomUUID(),
      clefType: ClefTypeEnum.Treble,
      widthRatio: 10,
      widthRatioForMeasure: 18,
    },
    timeSignature_f: {
      ...frame,
      id: crypto.randomUUID(),
      type: TimeSignatureTypeEnum['4_4'],
      widthRatio: 14,
      widthRatioForMeasure: 14,
    },
    barline: {
      ...frame,
      id: crypto.randomUUID(),
      barlineType: BarlineTypeEnum.Final_barline,
      widthRatio: 6,
      widthRatioForMeasure: 6,
    },
  }

  const staff: SingleStaff = {
    ...frame,
    id: crypto.randomUUID(),
    measures: [measure],
    uSpaceI: 20,
    dSpaceI: 20,
    uSpaceO: 20,
    dSpaceO: 20,
  }

  return {
    ...frame,
    id: crypto.randomUUID(),
    staves: [staff],
    uSpace: 40,
    dSpace: 40,
  }
}

function createSingleStaff(): SingleStaff {
  const measure: Measure = {
    ...frame,
    id: crypto.randomUUID(),
    notes: [],
    affiliatedSymbols: [],
    widthRatioForMeasure: 100,
    clef_f: {
      ...frame,
      id: crypto.randomUUID(),
      clefType: ClefTypeEnum.Treble,
      widthRatio: 10,
      widthRatioForMeasure: 18,
    },
    timeSignature_f: {
      ...frame,
      id: crypto.randomUUID(),
      type: TimeSignatureTypeEnum['4_4'],
      widthRatio: 14,
      widthRatioForMeasure: 14,
    },
    barline: {
      ...frame,
      id: crypto.randomUUID(),
      barlineType: BarlineTypeEnum.Final_barline,
      widthRatio: 6,
      widthRatioForMeasure: 6,
    },
  }

  return {
    ...frame,
    id: crypto.randomUUID(),
    measures: [measure],
    uSpaceI: 20,
    dSpaceI: 20,
    uSpaceO: 20,
    dSpaceO: 20,
  }
}

function createRest(chronaxie: Chronaxie, widthRatio = 6): NoteSymbol {
  return {
    ...frame,
    type: NoteSymbolTypeEnum.Rest,
    direction: 'up',
    voicePart1: { chronaxie, notesInfo: [], affiliatedSymbols: [], beamType: BeamTypeEnum.None },
    widthRatio,
    widthRatioForMeasure: widthRatio,
    id: crypto.randomUUID(),
  } as NoteSymbol
}

function createNote(region: number, chronaxie: Chronaxie, widthRatio = 6, direction: 'up' | 'down' = 'up'): NoteSymbol {
  return {
    ...frame,
    type: NoteSymbolTypeEnum.Note,
    direction,
    voicePart1: {
      chronaxie,
      notesInfo: [{ ...frame, id: crypto.randomUUID(), region }],
      affiliatedSymbols: [],
      beamType: BeamTypeEnum.None,
    },
    widthRatio,
    widthRatioForMeasure: widthRatio,
    id: crypto.randomUUID(),
  } as NoteSymbol
}

function createClef(clefType: ClefTypeEnum) {
  return { ...frame, id: crypto.randomUUID(), clefType, widthRatio: 10, widthRatioForMeasure: 18 }
}

function createBarline(barlineType: BarlineTypeEnum) {
  return { ...frame, id: crypto.randomUUID(), barlineType, widthRatio: 4, widthRatioForMeasure: 4 }
}

function createTimeSignature(type: TimeSignatureTypeEnum) {
  return { ...frame, id: crypto.randomUUID(), type, widthRatio: 14, widthRatioForMeasure: 14 }
}

function createKeySignature(type: KeySignatureTypeEnum) {
  return { ...frame, id: crypto.randomUUID(), type, widthRatio: 10, widthRatioForMeasure: 10 }
}

/** 创建空小节，可选从前一小节继承 clef、timeSignature、keySignature */
function createEmptyMeasure(prevMeasure?: Measure): Measure {
  const m: Measure = {
    ...frame,
    id: crypto.randomUUID(),
    notes: [],
    affiliatedSymbols: [],
    widthRatioForMeasure: 100,
    clef_f: prevMeasure?.clef_f ? createClef(prevMeasure.clef_f.clefType) : createClef(ClefTypeEnum.Treble),
    timeSignature_f: prevMeasure?.timeSignature_f ? createTimeSignature(prevMeasure.timeSignature_f.type) : createTimeSignature(TimeSignatureTypeEnum['4_4']),
    barline: createBarline(BarlineTypeEnum.Single_barline),
  }
  if (prevMeasure?.keySignature_f) {
    m.keySignature_f = createKeySignature(prevMeasure.keySignature_f.type)
  }
  return m
}

export {
  createGrandStaff,
  createSingleStaff,
  createRest,
  createNote,
  createClef,
  createBarline,
  createTimeSignature,
  createKeySignature,
  createEmptyMeasure,
}
