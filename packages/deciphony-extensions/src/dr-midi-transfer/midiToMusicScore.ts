import {
  AccidentalTypeEnum,
  BarlineTypeEnum,
  BracketTypeEnum,
  ClefTypeEnum,
  KeySignatureTypeEnum,
  MusicScoreTypeEnum,
  TimeSignatureTypeEnum,
  beatsToTimeSignatureType,
  getMeasureNoteList,
  timeSignatureTypeToBeats,
} from '@deciphony/renderer'
import type {Chronaxie, Measure, MusicScore, SingleStaff} from '@deciphony/renderer'
import {
  DEFAULT_MEASURE_HEIGHT,
  DEFAULT_SPACING,
  createAugmentationDot,
  createBarline,
  createBracket,
  createClef,
  createGrandStaff,
  createKeySignature,
  createMeasure,
  createMusicScore,
  createNoteRest,
  createNoteSymbol,
  createSingleStaff,
  createSlur,
  createTimeSignature,
} from '../dr-edit/score-builder'
import {getKeySignatureAccidental, getNoteMidi, getNoteRegionAndAccidental} from '../scoreUtil'
import type {AlteredAccidental} from '../scoreUtil'
import {DEFAULT_BPM, DRUM_CHANNEL, UNITS_PER_QUARTER, fifthsToKey} from './constants'
import {parseMidi} from './smf/reader'
import type {MidiFileData} from './smf/types'
import type {MidiToMusicScoreOptions, MidiToMusicScoreResult, StaffMidiData} from './types'

type DurationGlyph = {total: number; base: Chronaxie; dots?: 1}

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

function glyphFor(units: number): DurationGlyph {
  return DURATION_GLYPHS.find((g) => g.total <= units) ?? {total: units, base: 1}
}

/** 量化后的音符（unit256） */
type QNote = {start: number; end: number; midi: number}

type StaffSource = {
  notes: QNote[]
  clef: ClefTypeEnum
  midi: StaffMidiData
}

type MeasurePlan = {
  start: number
  capacity: number
  timeSignature: TimeSignatureTypeEnum
  keySignature: KeySignatureTypeEnum
  timeChanged: boolean
  keyChanged: boolean
}

function gridUnits(quantize: 8 | 16 | 32): number {
  return 256 / quantize
}

function capacityOf(time: TimeSignatureTypeEnum): number {
  const {beats, beatType} = timeSignatureTypeToBeats(time)
  return (beats * 256) / beatType
}

/** 按量化网格把 tick 换算为 unit256 */
function makeQuantizer(ppq: number, grid: number) {
  const unitsPerTick = UNITS_PER_QUARTER / ppq
  return (tick: number) => Math.round((tick * unitsPerTick) / grid) * grid
}

function collectStaffSources(
  data: MidiFileData,
  options: MidiToMusicScoreOptions,
  quantizeTick: (tick: number) => number,
  grid: number,
  warnings: string[],
): StaffSource[] {
  const groups: {notes: QNote[]; midi: StaffMidiData}[] = []
  let droppedDrums = 0

  data.tracks.forEach((track) => {
    const channels = [...new Set(track.notes.map((n) => n.channel))].sort((a, b) => a - b)
    for (const channel of channels) {
      if (channel === DRUM_CHANNEL && !options.includeDrums) {
        droppedDrums += track.notes.filter((n) => n.channel === channel).length
        continue
      }
      const notes: QNote[] = []
      for (const n of track.notes) {
        if (n.channel !== channel) continue
        const start = quantizeTick(n.tick)
        const end = Math.max(start + grid, quantizeTick(n.tick + n.durationTicks))
        notes.push({start, end, midi: n.midi})
      }
      const program =
        track.programs.find((p) => p.channel === channel)?.program ??
        data.tracks.flatMap((t) => t.programs).find((p) => p.channel === channel)?.program
      groups.push({
        notes,
        midi: {
          ...(track.name ? {trackName: track.name} : {}),
          channel,
          ...(program != null ? {program} : {}),
        },
      })
    }
  })
  if (droppedDrums > 0) warnings.push(`已忽略通道 10 的 ${droppedDrums} 个打击乐音符`)

  const sources: StaffSource[] = []
  for (const group of groups) {
    const splitAt = resolveSplit(group.notes, options.splitStaff ?? 'auto')
    if (splitAt == null) {
      const avg = group.notes.reduce((s, n) => s + n.midi, 0) / group.notes.length
      sources.push({
        notes: group.notes,
        clef: avg < 57 ? ClefTypeEnum.Bass : ClefTypeEnum.Treble,
        midi: group.midi,
      })
    } else {
      sources.push({
        notes: group.notes.filter((n) => n.midi >= splitAt),
        clef: ClefTypeEnum.Treble,
        midi: group.midi,
      })
      sources.push({
        notes: group.notes.filter((n) => n.midi < splitAt),
        clef: ClefTypeEnum.Bass,
        midi: group.midi,
      })
    }
  }
  return sources
}

function resolveSplit(notes: QNote[], mode: 'auto' | 'none' | number): number | null {
  if (mode === 'none' || !notes.length) return null
  if (typeof mode === 'number') return mode
  const low = notes.filter((n) => n.midi < 60).length
  const high = notes.length - low
  const min = Math.min(...notes.map((n) => n.midi))
  const max = Math.max(...notes.map((n) => n.midi))
  const threshold = notes.length * 0.15
  return low >= threshold && high >= threshold && max - min > 24 ? 60 : null
}

function planMeasures(
  data: MidiFileData,
  options: MidiToMusicScoreOptions,
  totalEnd: number,
  quantizeTick: (tick: number) => number,
  warnings: string[],
): MeasurePlan[] {
  const timeEvents = options.timeSignature
    ? [{unit: 0, type: options.timeSignature}]
    : data.timeSignatures.map((ts) => {
      const type = beatsToTimeSignatureType(ts.numerator, ts.denominator)
      if (!type) warnings.push(`不支持的拍号 ${ts.numerator}/${ts.denominator}，已按 4/4 处理`)
      return {unit: quantizeTick(ts.tick), type: type ?? TimeSignatureTypeEnum['4_4']}
    })
  const keyEvents = options.keySignature
    ? [{unit: 0, type: options.keySignature}]
    : data.keySignatures.map((ks) => ({unit: quantizeTick(ks.tick), type: fifthsToKey(ks.sf)}))

  const plans: MeasurePlan[] = []
  let time = TimeSignatureTypeEnum['4_4']
  let key = KeySignatureTypeEnum.C
  let ti = 0
  let ki = 0
  let pos = 0
  do {
    const prevTime = time
    const prevKey = key
    while (ti < timeEvents.length && timeEvents[ti]!.unit <= pos) time = timeEvents[ti++]!.type
    while (ki < keyEvents.length && keyEvents[ki]!.unit <= pos) key = keyEvents[ki++]!.type
    const capacity = capacityOf(time)
    plans.push({
      start: pos,
      capacity,
      timeSignature: time,
      keySignature: key,
      timeChanged: plans.length === 0 || time !== prevTime,
      keyChanged: plans.length === 0 || key !== prevKey,
    })
    pos += capacity
  } while (pos < totalEnd)
  return plans
}

/** 同音高重叠：截短前一个音 */
function normalizeOverlaps(notes: QNote[]): QNote[] {
  const sorted = [...notes].sort((a, b) => a.start - b.start || a.midi - b.midi)
  const last = new Map<number, QNote>()
  const out: QNote[] = []
  for (const n of sorted) {
    const prev = last.get(n.midi)
    if (prev && n.start < prev.end) {
      if (n.start === prev.start) {
        prev.end = Math.max(prev.end, n.end)
        continue
      }
      prev.end = n.start
    }
    const copy = {...n}
    out.push(copy)
    last.set(n.midi, copy)
  }
  return out
}

type Segment = {start: number; end: number; sounding: QNote[]}

/** 按所有起止点切段；每段内发声音符集合固定（和弦或休止） */
function buildSegments(notes: QNote[], totalEnd: number): Segment[] {
  const points = new Set<number>([0, totalEnd])
  for (const n of notes) {
    points.add(n.start)
    points.add(n.end)
  }
  const sortedPoints = [...points].filter((p) => p <= totalEnd).sort((a, b) => a - b)
  const segments: Segment[] = []
  for (let i = 0; i + 1 < sortedPoints.length; i++) {
    const start = sortedPoints[i]!
    const end = sortedPoints[i + 1]!
    const sounding = notes
      .filter((n) => n.start <= start && n.end > start)
      .sort((a, b) => a.midi - b.midi)
    segments.push({start, end, sounding})
  }
  return segments
}

type SpellScope = Map<number, AlteredAccidental | null>

const NEEDED_BY_OFFSET: Record<number, AlteredAccidental | null> = {
  [-2]: AccidentalTypeEnum.Double_flat,
  [-1]: AccidentalTypeEnum.Flat,
  0: null,
  1: AccidentalTypeEnum.Sharp,
  2: AccidentalTypeEnum.Double_sharp,
}

/**
 * midi → region + 谱面记号，考虑小节内变音记忆（与 dr-play resolveAccidentalInMeasure 同义：按 region 记忆）
 */
function spell(
  midi: number,
  clef: ClefTypeEnum,
  key: KeySignatureTypeEnum,
  scope: SpellScope,
): {region: number; accidental: AccidentalTypeEnum | null} {
  const {region} = getNoteRegionAndAccidental(clef, midi, key, AccidentalTypeEnum.Sharp)
  const needed = NEEDED_BY_OFFSET[midi - getNoteMidi(clef, region, null)] ?? null
  const current = scope.has(region) ? scope.get(region)! : getKeySignatureAccidental(clef, key, region)
  scope.set(region, needed)
  if (current === needed) return {region, accidental: null}
  return {region, accidental: needed ?? AccidentalTypeEnum.Natural}
}

type StaffWriteResult = {measures: Measure[]; ties: {startId: string; endId: string}[]}

function writeStaff(source: StaffSource, plans: MeasurePlan[], totalEnd: number): StaffWriteResult {
  const measures = plans.map(() => createMeasure())
  const ties: StaffWriteResult['ties'] = []
  const segments = buildSegments(normalizeOverlaps(source.notes), totalEnd)

  let measureIndex = 0
  let scope: SpellScope = new Map()
  let prevIds = new Map<QNote, string>()

  for (const segment of segments) {
    let pos = segment.start
    while (pos < segment.end) {
      while (measureIndex + 1 < plans.length && pos >= plans[measureIndex + 1]!.start) {
        measureIndex++
        scope = new Map()
      }
      const plan = plans[measureIndex]!
      const measureEnd = plan.start + plan.capacity
      const glyph = glyphFor(Math.min(segment.end, measureEnd) - pos)
      const onset = pos - plan.start
      const measureNotes = getMeasureNoteList(measures[measureIndex]!)
      const dot = glyph.dots ? {augmentationDot: createAugmentationDot(glyph.dots)} : {}

      if (!segment.sounding.length) {
        measureNotes.push(createNoteRest({chronaxie: glyph.base, ...dot}))
        prevIds = new Map()
      } else {
        const spelled = segment.sounding.map((n) => ({
          note: n,
          ...spell(n.midi, source.clef, plan.keySignature, scope),
        }))
        const regions = spelled.map((s) => s.region)
        const direction = (Math.min(...regions) + Math.max(...regions)) / 2 > 4 ? 'down' : 'up'
        const slot = createNoteSymbol({
          notesInfo: spelled.map((s) => ({
            region: s.region,
            chronaxie: glyph.base,
            direction,
            beamOnset: onset,
            ...(s.accidental != null ? {accidental: s.accidental} : {}),
            ...dot,
          })),
        })
        measureNotes.push(slot)
        const symbol = slot.symbol as {notesInfo: {id: string}[]}
        const nextIds = new Map<QNote, string>()
        spelled.forEach((s, i) => {
          const id = symbol.notesInfo[i]!.id
          const prevId = prevIds.get(s.note)
          if (prevId) ties.push({startId: prevId, endId: id})
          nextIds.set(s.note, id)
        })
        prevIds = nextIds
      }
      pos += glyph.total
    }
  }
  return {measures, ties}
}

const TOP_SPACE_HEIGHT = 16

/** 按默认间距估算一行（grandStaff）高度：上下留白 + 每个谱表（小节高 + 内外留白） */
function estimateLineHeight(staffCount: number): number {
  const {uSpace, dSpace} = DEFAULT_SPACING.grandStaff
  const {uSpaceI, dSpaceI, uSpaceO, dSpaceO} = DEFAULT_SPACING.singleStaff
  return uSpace + dSpace + staffCount * (DEFAULT_MEASURE_HEIGHT + uSpaceI + dSpaceI + uSpaceO + dSpaceO)
}

function applyMeasureHeaders(
  measures: Measure[],
  plans: MeasurePlan[],
  clef: ClefTypeEnum,
  measuresPerLine: number,
): void {
  measures.forEach((measure, i) => {
    const plan = plans[i]!
    const lineStart = i % measuresPerLine === 0
    if (lineStart) measure.clef_f = createClef(clef)
    if (lineStart || plan.keyChanged) measure.keySignature_f = createKeySignature(plan.keySignature)
    if (plan.timeChanged) measure.timeSignature_f = createTimeSignature(plan.timeSignature)
  })
  const last = measures[measures.length - 1]
  if (last) last.barline_b = createBarline(BarlineTypeEnum.Final_barline)
}

/**
 * MIDI → 五线谱 MusicScore。
 * - 每条音轨 × 通道一个谱表（音域宽的可拆成高/低音两行）；通道 10 默认忽略
 * - 起止点按 quantize 网格量化；同一谱表内同时发声的音合并为和弦，跨段/跨小节的音用延音线连接
 * - 变音号按调号 + 小节内变音记忆书写，保证 dr-play 回放音高正确
 * - 仅取第一个 tempo；拍号/调号变化落在其后第一个小节线上
 */
export function midiDataToMusicScore(
  data: MidiFileData,
  options: MidiToMusicScoreOptions = {},
): MidiToMusicScoreResult {
  const warnings: string[] = []
  const grid = gridUnits(options.quantize ?? 16)
  const quantizeTick = makeQuantizer(data.ppq, grid)
  const measuresPerLine = Math.max(1, options.measuresPerLine ?? 4)

  const sources = collectStaffSources(data, options, quantizeTick, grid, warnings).filter(
    (s) => s.notes.length > 0,
  )
  if (!sources.length) {
    warnings.push('MIDI 中没有可用的音符')
    sources.push({notes: [], clef: ClefTypeEnum.Treble, midi: {}})
  }

  const lastNoteEnd = Math.max(0, ...sources.flatMap((s) => s.notes.map((n) => n.end)))
  const plans = planMeasures(data, options, lastNoteEnd, quantizeTick, warnings)
  const lastPlan = plans[plans.length - 1]!
  const totalEnd = lastPlan.start + lastPlan.capacity

  const tempo = data.tempos[0]
  const bpm = tempo ? Math.round(60_000_000 / tempo.microsecondsPerQuarter) : DEFAULT_BPM
  if (data.tempos.length > 1 && new Set(data.tempos.map((t) => t.microsecondsPerQuarter)).size > 1) {
    warnings.push('MIDI 含变速，仅保留第一个速度')
  }

  const lineCount = Math.ceil(plans.length / measuresPerLine)
  const score = createMusicScore({
    type: MusicScoreTypeEnum.StandardStaff,
    title: options.title ?? data.tracks.find((t) => t.name)?.name ?? '',
    bpm,
    beatUnit: 4,
    keySignature: plans[0]!.keySignature,
    timeSignature: plans[0]!.timeSignature,
    width: options.width ?? 1000,
    height: options.height ?? TOP_SPACE_HEIGHT + lineCount * estimateLineHeight(sources.length),
    topSpaceHeight: TOP_SPACE_HEIGHT,
  })

  const written = sources.map((source) => {
    const result = writeStaff(source, plans, totalEnd)
    applyMeasureHeaders(result.measures, plans, source.clef, measuresPerLine)
    return result
  })

  for (let start = 0; start < plans.length; start += measuresPerLine) {
    const grandStaff = createGrandStaff({
      withDefaultStaff: false,
      ...(sources.length > 1 ? {bracket: createBracket(BracketTypeEnum.Brace, 0)} : {}),
    })
    sources.forEach((source, i) => {
      const staff: SingleStaff = createSingleStaff({
        withDefaultMeasure: false,
        data: {midi: source.midi},
      })
      staff.measures = written[i]!.measures.slice(start, start + measuresPerLine)
      grandStaff.staves.push(staff)
    })
    score.grandStaffs.push(grandStaff)
  }

  for (const {ties} of written) {
    for (const tie of ties) score.affiliatedSymbols.push(createSlur(tie))
  }

  return {musicScore: score, warnings}
}

/** .mid 字节 → 五线谱 MusicScore */
export function midiToMusicScore(
  input: ArrayBuffer | Uint8Array,
  options: MidiToMusicScoreOptions = {},
): MidiToMusicScoreResult {
  return midiDataToMusicScore(parseMidi(input), options)
}

/** .mid File / Blob → 五线谱 MusicScore */
export async function midiFileToMusicScore(
  file: Blob,
  options: MidiToMusicScoreOptions = {},
): Promise<MidiToMusicScoreResult> {
  const result = midiToMusicScore(await file.arrayBuffer(), options)
  if (!result.musicScore.title && file instanceof File) {
    result.musicScore.title = file.name.replace(/\.midi?$/i, '')
  }
  return result
}
