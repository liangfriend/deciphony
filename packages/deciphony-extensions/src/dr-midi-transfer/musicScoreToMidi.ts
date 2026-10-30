import {getMeasureNoteList, KeySignatureTypeEnum, MusicScoreTypeEnum, TimeSignatureTypeEnum, resolveStaffType, timeSignatureTypeToBeats} from '@deciphony/renderer'
import type {Measure, MusicScore} from '@deciphony/renderer'
import {getDrPlaySequence} from '../dr-play'
import {computeMeasureOnsetBefore} from '../dr-edit/score-builder'
import {getMeasurePositions, getPlayMeasureIndexes} from '../scoreUtil'
import {
  DEFAULT_BPM,
  DEFAULT_PPQ,
  DEFAULT_PROGRAM,
  DEFAULT_VELOCITY,
  DRUM_CHANNEL,
  KEY_TO_FIFTHS,
  UNITS_PER_QUARTER,
} from './constants'
import {writeMidi} from './smf/writer'
import type {MidiFileData, MidiNoteEvent, MidiTrack} from './smf/types'
import type {MusicScoreToMidiOptions, StaffMidiData} from './types'

/** 深度遍历对象，收集所有 `id` 字段 */
function collectIds(node: unknown, out: (id: string) => void): void {
  if (!node || typeof node !== 'object') return
  if (Array.isArray(node)) {
    for (const item of node) collectIds(item, out)
    return
  }
  const obj = node as Record<string, unknown>
  if (typeof obj.id === 'string') out(obj.id)
  for (const [key, value] of Object.entries(obj)) {
    if (key === 'id' || key === 'data') continue
    if (value && typeof value === 'object') collectIds(value, out)
  }
}

/** note_id → 谱表下标（grandStaff 内第几行）；tab 的 `${id}:${region}` 取冒号前 */
function buildNoteStaffIndex(score: MusicScore): Map<string, number> {
  const map = new Map<string, number>()
  for (const grandStaff of score.grandStaffs) {
    grandStaff.staves.forEach((staff, staffIndex) => {
      for (const measure of staff.measures) {
        collectIds(measure.notes, (id) => map.set(id, staffIndex))
      }
    })
  }
  return map
}

function staffIndexOf(map: Map<string, number>, noteId: string): number {
  const direct = map.get(noteId)
  if (direct != null) return direct
  const colon = noteId.indexOf(':')
  return colon > 0 ? map.get(noteId.slice(0, colon)) ?? 0 : 0
}

function channelForTrack(index: number): number {
  const ch = index % 15
  return ch >= DRUM_CHANNEL ? ch + 1 : ch
}

function resolveProgram(
  score: MusicScore,
  staffIndex: number,
  options: MusicScoreToMidiOptions,
): number {
  const {program} = options
  if (typeof program === 'number') return program
  if (Array.isArray(program) && program[staffIndex] != null) return program[staffIndex]!
  for (const gs of score.grandStaffs) {
    const data = gs.staves[staffIndex]?.data as {midi?: StaffMidiData} | undefined
    if (data?.midi?.program != null) return data.midi.program
  }
  let type = MusicScoreTypeEnum.StandardStaff
  for (const gs of score.grandStaffs) {
    const staff = gs.staves[staffIndex]
    if (staff) {
      type = resolveStaffType(staff, score)
      break
    }
  }
  return DEFAULT_PROGRAM[type] ?? 0
}

function measureDuration(measures: (Measure | undefined)[]): number {
  let max = 0
  for (const m of measures) {
    if (m) max = Math.max(max, computeMeasureOnsetBefore(m, getMeasureNoteList(m).length))
  }
  return max
}

type MeasureMeta = {
  unit: number
  timeSignature: TimeSignatureTypeEnum | undefined
  keySignature: KeySignatureTypeEnum | undefined
}

/** 按播放顺序（含反复展开）收集每小节起点与拍号/调号变化 */
function collectMeasureMeta(score: MusicScore): MeasureMeta[] {
  const positions = getMeasurePositions(score)
  const out: MeasureMeta[] = []
  let unit = 0
  for (const index of getPlayMeasureIndexes(score)) {
    const pos = positions[index]
    if (!pos) continue
    const staves = score.grandStaffs[pos.grandStaffIndex]?.staves ?? []
    const measures = staves.map((s) => s.measures[pos.measureIndex])
    out.push({
      unit,
      timeSignature: measures.find((m) => m?.timeSignature_f)?.timeSignature_f?.type,
      keySignature: measures.find((m) => m?.keySignature_f)?.keySignature_f?.type,
    })
    unit += measureDuration(measures)
  }
  return out
}

/**
 * MusicScore → Standard MIDI File 数据结构。
 * 音符取自 dr-play 播放序列（反复、倚音、延音线、八度记号、tab 音高与播放一致），
 * 每个谱表下标一条音轨；全局 tempo / 拍号 / 调号写入指挥轨。
 */
export function musicScoreToMidiData(
  score: MusicScore,
  options: MusicScoreToMidiOptions = {},
): MidiFileData {
  const ppq = options.ppq ?? DEFAULT_PPQ
  const velocity = options.velocity ?? DEFAULT_VELOCITY
  const ticksPerUnit = ppq / UNITS_PER_QUARTER
  const seq = getDrPlaySequence(score)
  const staffIndexMap = buildNoteStaffIndex(score)

  const minTime = Math.min(0, ...seq.map((it) => it.playTime))
  const toTick = (unit: number) => Math.round((unit - minTime) * ticksPerUnit)

  const staffCount = Math.max(1, ...score.grandStaffs.map((gs) => gs.staves.length))
  const notesByStaff: MidiNoteEvent[][] = Array.from({length: staffCount}, () => [])
  for (const item of seq) {
    if (!(item.midi > 0) || item.real_duration === 0) continue
    const duration = item.real_duration ?? item.duration
    if (duration <= 0) continue
    const staffIndex = Math.min(staffCount - 1, staffIndexOf(staffIndexMap, item.note_id))
    const tick = toTick(item.playTime)
    notesByStaff[staffIndex]!.push({
      tick,
      durationTicks: Math.max(1, toTick(item.playTime + duration) - tick),
      midi: Math.max(0, Math.min(127, Math.round(item.midi))),
      velocity,
      channel: 0,
    })
  }

  const tracks: MidiTrack[] = [{...(score.title ? {name: score.title} : {}), notes: [], programs: []}]
  notesByStaff.forEach((notes, staffIndex) => {
    const channel = channelForTrack(staffIndex)
    tracks.push({
      name: (score.grandStaffs[0]?.staves[staffIndex]?.data as {midi?: StaffMidiData} | undefined)
        ?.midi?.trackName ?? `Staff ${staffIndex + 1}`,
      notes: trimOverlaps(notes.map((n) => ({...n, channel}))),
      programs: [{tick: 0, channel, program: resolveProgram(score, staffIndex, options)}],
    })
  })

  const bpm = options.bpm ?? (score.bpm || DEFAULT_BPM)
  const beatUnit = score.beatUnit || 4
  const quarterPerMinute = (bpm * 4) / beatUnit
  const data: MidiFileData = {
    format: 1,
    ppq,
    tracks,
    tempos: [{tick: 0, microsecondsPerQuarter: 60_000_000 / quarterPerMinute}],
    timeSignatures: [],
    keySignatures: [],
  }

  let curTime = score.timeSignature
  let curKey = score.keySignature
  const meta = collectMeasureMeta(score)
  meta.forEach((m, i) => {
    const tick = i === 0 ? 0 : toTick(m.unit)
    const time = m.timeSignature ?? (i === 0 ? curTime ?? TimeSignatureTypeEnum['4_4'] : undefined)
    if (time && (i === 0 || time !== curTime)) {
      const {beats, beatType} = timeSignatureTypeToBeats(time)
      data.timeSignatures.push({tick, numerator: beats, denominator: beatType})
      curTime = time
    }
    const key = m.keySignature ?? (i === 0 ? curKey : undefined)
    if (key && (i === 0 || key !== curKey)) {
      data.keySignatures.push({tick, sf: KEY_TO_FIFTHS[key] ?? 0, mi: 0})
      curKey = key
    }
  })
  if (!data.timeSignatures.length) data.timeSignatures.push({tick: 0, numerator: 4, denominator: 4})

  return data
}

/** 同通道同音高重叠时，截短前一个音到后一个音的起点 */
function trimOverlaps(notes: MidiNoteEvent[]): MidiNoteEvent[] {
  notes.sort((a, b) => a.tick - b.tick || a.midi - b.midi)
  const last = new Map<number, MidiNoteEvent>()
  const out: MidiNoteEvent[] = []
  for (const n of notes) {
    const key = n.channel * 128 + n.midi
    const prev = last.get(key)
    if (prev && n.tick < prev.tick + prev.durationTicks) {
      if (n.tick === prev.tick) {
        prev.durationTicks = Math.max(prev.durationTicks, n.durationTicks)
        continue
      }
      prev.durationTicks = n.tick - prev.tick
    }
    out.push(n)
    last.set(key, n)
  }
  return out
}

/** MusicScore → .mid 字节 */
export function musicScoreToMidi(score: MusicScore, options: MusicScoreToMidiOptions = {}): Uint8Array {
  return writeMidi(musicScoreToMidiData(score, options))
}

/** MusicScore → .mid File（文件名默认取标题） */
export function musicScoreToMidiFile(
  score: MusicScore,
  options: MusicScoreToMidiOptions & {fileName?: string} = {},
): File {
  const bytes = musicScoreToMidi(score, options)
  const name = options.fileName ?? `${score.title || 'score'}.mid`
  return new File([bytes as BlobPart], name, {type: 'audio/midi'})
}
