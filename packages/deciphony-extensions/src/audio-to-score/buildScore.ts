import {
  AccidentalTypeEnum,
  ClefTypeEnum,
  KeySignatureTypeEnum,
  MusicScoreTypeEnum,
  TimeSignatureTypeEnum,
  getMeasureNoteList,
} from '@deciphony/renderer'
import type {
  Chronaxie,
  Measure,
  MeasureNoteSlot,
  MusicScore,
  SingleStaff,
} from '@deciphony/renderer'
import {
  createAugmentationDot,
  createGrandStaff,
  createMeasure,
  createMusicScore,
  createNoteRest,
  createNoteSymbol,
  createSingleStaff,
} from '../dr-edit/score-builder'
import {getNoteRegionAndAccidental} from '../scoreUtil'
import type {
  AudioPitchNote,
  AudioToScoreOptions,
  QuantizedAudioNote,
} from './types'

type DurationGlyph = {
  total: number
  base: Chronaxie
  dots?: 1
}

const DURATION_GLYPHS: DurationGlyph[] = [
  {total: 256, base: 256},
  {total: 192, base: 128, dots: 1},
  {total: 128, base: 128},
  {total: 96, base: 64, dots: 1},
  {total: 64, base: 64},
  {total: 48, base: 32, dots: 1},
  {total: 32, base: 32},
  {total: 24, base: 16, dots: 1},
  {total: 16, base: 16},
  {total: 12, base: 8, dots: 1},
  {total: 8, base: 8},
  {total: 6, base: 4, dots: 1},
  {total: 4, base: 4},
  {total: 3, base: 2, dots: 1},
  {total: 2, base: 2},
  {total: 1, base: 1},
]

const TIME_SIGNATURE_PARTS: Record<string, [number, number]> = {
  [TimeSignatureTypeEnum.Common]: [4, 4],
  [TimeSignatureTypeEnum.Cut]: [2, 2],
  [TimeSignatureTypeEnum['2_2']]: [2, 2],
  [TimeSignatureTypeEnum['3_2']]: [3, 2],
  [TimeSignatureTypeEnum['4_2']]: [4, 2],
  [TimeSignatureTypeEnum['2_4']]: [2, 4],
  [TimeSignatureTypeEnum['3_4']]: [3, 4],
  [TimeSignatureTypeEnum['4_4']]: [4, 4],
  [TimeSignatureTypeEnum['5_4']]: [5, 4],
  [TimeSignatureTypeEnum['6_4']]: [6, 4],
  [TimeSignatureTypeEnum['3_8']]: [3, 8],
  [TimeSignatureTypeEnum['4_8']]: [4, 8],
  [TimeSignatureTypeEnum['5_8']]: [5, 8],
  [TimeSignatureTypeEnum['6_8']]: [6, 8],
  [TimeSignatureTypeEnum['7_8']]: [7, 8],
  [TimeSignatureTypeEnum['9_8']]: [9, 8],
  [TimeSignatureTypeEnum['12_8']]: [12, 8],
}

function quantizeChronaxie(quantize: 8 | 16 | 32): number {
  return quantize === 8 ? 32 : quantize === 32 ? 8 : 16
}

function measureCapacity(timeSignature: TimeSignatureTypeEnum): number {
  const [beats, denominator] = TIME_SIGNATURE_PARTS[timeSignature] ?? [4, 4]
  return beats * (256 / denominator)
}

function durationGlyph(units: number, room: number, minimum: number): DurationGlyph {
  return DURATION_GLYPHS.find(
    (glyph) => glyph.total <= units
      && glyph.total <= room
      && glyph.total >= minimum,
  ) ?? {total: Math.min(units, room), base: 1}
}

function quantizeNotes(
  notes: AudioPitchNote[],
  bpm: number,
  options: AudioToScoreOptions,
): QuantizedAudioNote[] {
  const minimum = quantizeChronaxie(options.quantize ?? 16)
  const unitsPerSecond = 64 * bpm / 60
  const clef = options.clef ?? ClefTypeEnum.Treble
  const keySignature = options.keySignature ?? KeySignatureTypeEnum.C
  let previousEnd = 0

  return notes.map((note) => {
    const rawStart = Math.round(note.startTime * unitsPerSecond / minimum) * minimum
    const startChronaxie = Math.max(previousEnd, rawStart)
    const durationChronaxie = Math.max(
      minimum,
      Math.round(note.duration * unitsPerSecond / minimum) * minimum,
    )
    previousEnd = startChronaxie + durationChronaxie
    const {region, accidental} = getNoteRegionAndAccidental(
      clef,
      note.midi,
      keySignature,
      AccidentalTypeEnum.Sharp,
    )
    return {
      ...note,
      startChronaxie,
      durationChronaxie,
      region,
      accidental,
    }
  })
}

type ScoreWriter = {
  staff: SingleStaff
  measure: Measure
  measureIndex: number
  onset: number
  capacity: number
  minimum: number
}

function nextMeasure(writer: ScoreWriter): void {
  writer.measure = createMeasure()
  writer.staff.measures.push(writer.measure)
  writer.measureIndex++
  writer.onset = 0
}

function writeDuration(
  writer: ScoreWriter,
  total: number,
  makeSlot: (glyph: DurationGlyph, onset: number) => MeasureNoteSlot,
): void {
  let remaining = total
  while (remaining > 0) {
    if (writer.onset >= writer.capacity) nextMeasure(writer)
    const room = writer.capacity - writer.onset
    const glyph = durationGlyph(remaining, room, writer.minimum)
    getMeasureNoteList(writer.measure).push(makeSlot(glyph, writer.onset))
    writer.onset += glyph.total
    remaining -= glyph.total
  }
}

export function buildStandardStaffScore(
  detectedNotes: AudioPitchNote[],
  bpm: number,
  options: AudioToScoreOptions = {},
): {musicScore: MusicScore; notes: QuantizedAudioNote[]; warnings: string[]} {
  const timeSignature = options.timeSignature ?? TimeSignatureTypeEnum['4_4']
  const keySignature = options.keySignature ?? KeySignatureTypeEnum.C
  const clef = options.clef ?? ClefTypeEnum.Treble
  const minimum = quantizeChronaxie(options.quantize ?? 16)
  const quantized = quantizeNotes(detectedNotes, bpm, options)
  const score = createMusicScore({
    type: MusicScoreTypeEnum.StandardStaff,
    title: options.title ?? '音频转谱',
    description: '由 @deciphony/extensions/audio-to-score 自动生成',
    bpm,
    beatUnit: TIME_SIGNATURE_PARTS[timeSignature]?.[1] ?? 4,
    timeSignature,
    keySignature,
    width: options.width ?? 1000,
    height: options.height ?? 300,
    topSpaceHeight: 16,
    data: {audioToScore: {mode: 'monophonic', quantize: options.quantize ?? 16}},
  })
  const grandStaff = createGrandStaff({withDefaultStaff: false})
  const staff = createSingleStaff({withDefaultMeasure: false})
  grandStaff.staves.push(staff)
  score.grandStaffs.push(grandStaff)
  const firstMeasure = createMeasure({
    clef,
    timeSignature,
    keySignature,
  })
  staff.measures.push(firstMeasure)
  const writer: ScoreWriter = {
    staff,
    measure: firstMeasure,
    measureIndex: 0,
    onset: 0,
    capacity: measureCapacity(timeSignature),
    minimum,
  }
  let timeline = 0
  let splitNotes = 0

  for (const note of quantized) {
    const gap = Math.max(0, note.startChronaxie - timeline)
    if (gap > 0) {
      writeDuration(writer, gap, (glyph) =>
        createNoteRest({
          chronaxie: glyph.base,
          ...(glyph.dots
            ? {augmentationDot: createAugmentationDot(glyph.dots)}
            : {}),
          data: {audioToScore: {silence: true}},
        }),
      )
      timeline += gap
    }

    let fragments = 0
    writeDuration(writer, note.durationChronaxie, (glyph, onset) => {
      fragments++
      return createNoteSymbol({
        notesInfo: [{
          region: note.region,
          chronaxie: glyph.base,
          beamOnset: onset,
          ...(note.accidental != null ? {accidental: note.accidental} : {}),
          ...(glyph.dots
            ? {augmentationDot: createAugmentationDot(glyph.dots)}
            : {}),
        }],
        data: {
          audioToScore: {
            startTime: note.startTime,
            endTime: note.endTime,
            midi: note.midi,
            frequency: note.frequency,
            confidence: note.confidence,
          },
        },
      })
    })
    if (fragments > 1) splitNotes++
    timeline = note.startChronaxie + note.durationChronaxie
  }

  if (!staff.measures.length) staff.measures.push(firstMeasure)
  const warnings: string[] = []
  if (!quantized.length) warnings.push('没有检测到稳定的单声部音高')
  if (splitNotes > 0) {
    warnings.push(`${splitNotes} 个音因跨小节或时值拆分为多个相邻音符，当前未自动添加延音线`)
  }
  return {musicScore: score, notes: quantized, warnings}
}
