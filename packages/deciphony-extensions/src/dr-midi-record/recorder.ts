import {KeySignatureTypeEnum, timeSignatureTypeToBeats} from '@deciphony/renderer'
import type {MusicScore, TimeSignatureTypeEnum} from '@deciphony/renderer'
import {assignHands, createHandTracker, DEFAULT_HAND_SPAN, type HandTracker} from './handSplit'
import {createPianoScoreWriter, type PianoScoreWriter, type WriteResult} from './scoreWriter'
import type {
  MidiRecordAppendEvent,
  MidiRecorder,
  MidiRecorderOptions,
  MidiRecordHand,
  MidiRecordPosition,
} from './types'

const DEFAULT_CHORD_WINDOW_MS = 60
const DEFAULT_BEAT_SNAP = 0.2
/** 无 noteOn/noteOff 时，定时检查是否可以落笔 / 补休止 */
const PUMP_INTERVAL_MS = 25
const HANDS: MidiRecordHand[] = ['right', 'left']
const STAFF_OF: Record<MidiRecordHand, 0 | 1> = {right: 0, left: 1}

type RecNote = {midi: number; onMs: number; offMs: number | null}
/** 一次触键：窗口内按下的音 */
type Cluster = {startMs: number; notes: RecNote[]}
/** 某只手尚未落笔的音符组；结束位置要等松键或下一组出现才能确定 */
type OpenGroup = {onset: number; notes: RecNote[]}

/** 一拍的长度（unit256）：复拍子（6/8、9/8、12/8）按附点四分，其余按拍号分母 */
function beatUnits(time: TimeSignatureTypeEnum): number {
  const {beats, beatType} = timeSignatureTypeToBeats(time)
  return beatType === 8 && beats % 3 === 0 && beats > 3 ? 96 : 256 / beatType
}

function defaultNow(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now()
}

/**
 * MIDI 实时录制 → 钢琴大谱表（高音 + 低音）。
 * - 窗口（chordWindowMs）内按下的音算同一次触键，再按 handSplit 规则分给左右手
 * - 起点按 quantize 网格量化；同一只手量化后起点相同的音并成和弦
 * - 一组音在「全部松开且时间已越过其量化结束点」或「这只手下一组音出现」时落笔，回调 onAppend
 * - 每个谱表单声部：下一组按下时，上一组未松开的音在此截断
 */
export function createMidiRecorder(options: MidiRecorderOptions): MidiRecorder {
  const now = options.now ?? defaultNow
  const grid = 256 / (options.quantize ?? 16)
  const msPerUnit = 60000 / Math.max(1, options.bpm) / 64
  const gridMs = grid * msPerUnit
  const beat = beatUnits(options.timeSignature)
  const beatSnap = Math.max(0, Math.min(0.5, options.beatSnap ?? DEFAULT_BEAT_SNAP)) * beat
  const minRest = Math.max(0, options.minRest ?? grid * 2)
  const latencyMs = options.latencyMs ?? 0
  const startDelayMs = Math.max(0, options.startDelayMs ?? 0)
  const earlyMs = Math.max(0, options.earlyToleranceMs ?? beat * msPerUnit / 2)
  /** 量化最多可能把触键往前挪多少（ms）；空闲手补休止要留出这段 */
  const snapBackMs = Math.max(gridMs / 2, beatSnap * msPerUnit)
  const chordWindowMs = Math.max(0, options.chordWindowMs ?? DEFAULT_CHORD_WINDOW_MS)
  const handSpan = options.handSpan ?? DEFAULT_HAND_SPAN

  let writer: PianoScoreWriter | null = null
  let recording = false
  let startMs: number | null = null
  let cluster: Cluster | null = null
  let tracker: HandTracker = createHandTracker()
  let open: Record<MidiRecordHand, OpenGroup | null> = {right: null, left: null}
  let pressed = new Map<number, {note: RecNote; hand: MidiRecordHand | null}>()
  let timer: ReturnType<typeof setInterval> | null = null

  function unitsAt(ms: number): number {
    return startMs == null ? 0 : (ms - startMs) / msPerUnit
  }

  /** 松键 / 结束位置：就近网格 */
  function quantize(ms: number): number {
    return Math.max(0, Math.round(unitsAt(ms) / grid) * grid)
  }

  /** 起音：离拍点 beatSnap 以内吸到拍点，其余就近网格 */
  function quantizeOnset(ms: number): number {
    const u = unitsAt(ms)
    const nearestBeat = Math.round(u / beat) * beat
    if (Math.abs(u - nearestBeat) <= beatSnap) return Math.max(0, nearestBeat)
    return Math.max(0, Math.round(u / grid) * grid)
  }

  function msAt(units: number): number {
    return (startMs ?? 0) + units * msPerUnit
  }

  function emit(kind: 'note' | 'rest', hand: MidiRecordHand, midis: number[], onset: number, result: WriteResult) {
    if (!result.pieces.length || !writer) return
    const duration = result.pieces.reduce((s, p) => s + p.duration, 0)
    const event: MidiRecordAppendEvent = {
      kind,
      hand,
      staffIndex: STAFF_OF[hand],
      midis,
      onset,
      duration,
      pieces: result.pieces,
      tieIds: result.tieIds,
      layoutChanged: result.layoutChanged,
      musicScore: writer.score,
    }
    options.onAppend?.(event)
  }

  function writeRest(hand: MidiRecordHand, to: number) {
    if (!writer) return
    const from = writer.cursor(STAFF_OF[hand])
    if (to <= from) return
    emit('rest', hand, [], from, writer.writeRest(STAFF_OF[hand], to))
  }

  function groupEnd(group: OpenGroup, time: number): number {
    const endMs = Math.max(...group.notes.map((n) => n.offMs ?? time))
    return Math.max(group.onset + grid, quantize(endMs))
  }

  function commit(hand: MidiRecordHand, end: number) {
    const group = open[hand]
    open[hand] = null
    if (!group || !writer) return
    writeRest(hand, group.onset)
    const midis = [...new Set(group.notes.map((n) => n.midi))].sort((a, b) => a - b)
    const to = Math.max(group.onset + grid, end)
    emit('note', hand, midis, group.onset, writer.writeNote(STAFF_OF[hand], midis, to))
  }

  function place(hand: MidiRecordHand, notes: RecNote[], onsetUnits: number, time: number) {
    if (!writer) return
    const cur = open[hand]
    let onset = Math.max(onsetUnits, writer.cursor(STAFF_OF[hand]))
    if (cur && onset <= cur.onset) {
      cur.notes.push(...notes)
      return
    }
    if (cur) {
      const end = Math.min(groupEnd(cur, time), onset)
      commit(hand, onset - end < minRest ? onset : end)
    }
    onset = Math.max(onset, writer.cursor(STAFF_OF[hand]))
    open[hand] = {onset, notes: [...notes]}
  }

  function closeCluster(time: number) {
    const c = cluster
    cluster = null
    if (!c || !c.notes.length) return
    const hands = assignHands(tracker, c.notes.map((n) => n.midi), c.startMs, handSpan)
    const onset = quantizeOnset(c.startMs)
    for (const hand of HANDS) {
      const midis = new Set(hands[hand])
      const notes = c.notes.filter((n) => midis.has(n.midi))
      if (!notes.length) continue
      for (const n of notes) {
        const entry = pressed.get(n.midi)
        if (entry?.note === n) {
          entry.hand = hand
          tracker[hand].held.add(n.midi)
        }
      }
      place(hand, notes, onset, time)
    }
  }

  /** 处理到期的触键窗口、可落笔的音、空闲手的整小节休止 */
  function pump(time: number) {
    if (!recording || !writer) return
    if (cluster && time - cluster.startMs >= chordWindowMs) closeCluster(time)
    if (startMs == null) return
    for (const hand of HANDS) {
      const group = open[hand]
      if (!group || group.notes.some((n) => n.offMs == null)) continue
      // 等过 minRest：这段内下一组到来，空档会被并进本组时值
      const end = groupEnd(group, time)
      if (time >= msAt(end + minRest) + snapBackMs) commit(hand, end)
    }
    // 之后的触键至少量化到 safe 之后，空闲的手可以补到 safe 所在小节的起点
    const safe = unitsAt(time - chordWindowMs - snapBackMs - gridMs / 2)
    if (safe <= 0 || cluster) return
    const measureStart = Math.floor(safe / writer.capacity) * writer.capacity
    for (const hand of HANDS) {
      if (!open[hand]) writeRest(hand, measureStart)
    }
  }

  function handleOn(midi: number, time: number) {
    if (!Number.isFinite(midi) || midi < 0 || midi > 127) return
    if (pressed.has(midi)) handleOff(midi, time)
    if (startMs == null) startMs = time
    // 预备拍内：起点前 earlyMs 以内算第一拍（量化到 0），更早的忽略
    if (time < startMs - earlyMs) return
    if (cluster && time - cluster.startMs > chordWindowMs) closeCluster(time)
    const note: RecNote = {midi, onMs: time, offMs: null}
    pressed.set(midi, {note, hand: null})
    if (!cluster) cluster = {startMs: time, notes: []}
    cluster.notes.push(note)
    pump(time)
  }

  function handleOff(midi: number, time: number) {
    const entry = pressed.get(midi)
    if (!entry) return
    pressed.delete(midi)
    entry.note.offMs = Math.max(time, entry.note.onMs)
    if (entry.hand) tracker[entry.hand].held.delete(midi)
    pump(time)
  }

  function stopTimer() {
    if (timer != null) clearInterval(timer)
    timer = null
  }

  function reset() {
    stopTimer()
    cluster = null
    tracker = createHandTracker()
    open = {right: null, left: null}
    pressed = new Map()
    startMs = null
  }

  return {
    start(time = now()) {
      reset()
      writer = createPianoScoreWriter({
        bpm: options.bpm,
        timeSignature: options.timeSignature,
        keySignature: options.keySignature ?? KeySignatureTypeEnum.C,
        measuresPerLine: options.measuresPerLine,
        ...(options.title != null ? {title: options.title} : {}),
        ...(options.width != null ? {width: options.width} : {}),
      })
      startMs = options.startOnFirstNote ? null : time + startDelayMs
      recording = true
      timer = setInterval(() => pump(now() - latencyMs), PUMP_INTERVAL_MS)
      return writer.score
    },

    noteOn(midi, velocity = 100, time = now()) {
      if (!recording) return
      if (velocity <= 0) handleOff(midi, time - latencyMs)
      else handleOn(midi, time - latencyMs)
    },

    noteOff(midi, time = now()) {
      if (recording) handleOff(midi, time - latencyMs)
    },

    stop(stopTime = now()) {
      if (!writer) throw new Error('MidiRecorder: 尚未 start()')
      const time = stopTime - latencyMs
      if (recording) {
        closeCluster(time)
        for (const {note} of pressed.values()) note.offMs = time
        for (const hand of HANDS) {
          const group = open[hand]
          if (group) commit(hand, groupEnd(group, time))
        }
        recording = false
        stopTimer()
        const cap = writer.capacity
        const end = Math.max(cap, Math.ceil(Math.max(writer.cursor(0), writer.cursor(1)) / cap) * cap)
        for (const hand of HANDS) writeRest(hand, end)
        const layoutChanged = writer.finish()
        if (layoutChanged) {
          options.onAppend?.({
            kind: 'rest',
            hand: 'right',
            staffIndex: 0,
            midis: [],
            onset: writer.cursor(0),
            duration: 0,
            pieces: [],
            tieIds: [],
            layoutChanged: true,
            musicScore: writer.score,
          })
        }
        pressed = new Map()
      }
      return writer.score
    },

    getMusicScore(): MusicScore | null {
      return writer?.score ?? null
    },

    isRecording() {
      return recording
    },

    getPosition(time = now()): MidiRecordPosition {
      if (startMs == null || !writer) return {units: null, measureNo: null}
      const units = Math.max(0, unitsAt(time - latencyMs))
      return {units, measureNo: Math.floor(units / writer.capacity)}
    },

    dispose() {
      recording = false
      reset()
      writer = null
    },
  }
}
