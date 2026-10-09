import {
  getMeasureVoices,
  NoteSymbolTypeEnum,
  SingleNoteAffiliatedSymbolNameEnum,
  slotSymbol,
  TimeSignatureTypeEnum,
} from '@deciphony/renderer'
import type {DrumNote, DrumNotesInfo, DrumRest, Measure, MeasureNoteSlot, MusicScore} from '@deciphony/renderer'
import {getMeasurePositions, getPlayMeasureIndexes} from '../../scoreUtil'
import {applySlurTieRealDuration, GRACE_PLAY_DURATION, pushPitchItem} from '../playCommon'
import type {DR_playSequence, Unit256} from '../types'
import {getDuration} from '../types'
import {
  DEFAULT_DRUM_PLAY_MAP,
  DRUM_ACCENT_VOLUME,
  DRUM_GHOST_VOLUME,
  drumPlayMapKey,
  type DrumPlayMap,
} from './drumPlayMap'

export type DrumPlaySequenceOptions = {
  /** 线位 + 音符头 → 音频 key；不传用 DEFAULT_DRUM_PLAY_MAP。整表替换，不与内置表合并 */
  drumMap?: DrumPlayMap
}

const ACCENT_NAMES = new Set<string>([
  SingleNoteAffiliatedSymbolNameEnum.Accent_above,
  SingleNoteAffiliatedSymbolNameEnum.Marcato_above,
  SingleNoteAffiliatedSymbolNameEnum.Accent_staccato_above,
  SingleNoteAffiliatedSymbolNameEnum.Marcato_staccato_above,
  SingleNoteAffiliatedSymbolNameEnum.Marcato_tenuto_above,
  SingleNoteAffiliatedSymbolNameEnum.Tenuto_accent_above,
])

const TIME_SIGNATURE_FRACTION: Record<TimeSignatureTypeEnum, [number, number]> = {
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
  [TimeSignatureTypeEnum.Common]: [4, 4],
  [TimeSignatureTypeEnum.Cut]: [2, 2],
  [TimeSignatureTypeEnum['2_2']]: [2, 2],
  [TimeSignatureTypeEnum['3_2']]: [3, 2],
  [TimeSignatureTypeEnum['4_2']]: [4, 2],
}

function timeSignatureDuration(type: TimeSignatureTypeEnum): Unit256 {
  const [beats, unit] = TIME_SIGNATURE_FRACTION[type] ?? [4, 4]
  return beats * (256 / unit)
}

function isDrumNote(body: MeasureNoteSlot['symbol']): body is DrumNote {
  return (body as DrumNote).type === NoteSymbolTypeEnum.Note && Array.isArray((body as DrumNote).notesInfo)
}

function isDrumRest(body: MeasureNoteSlot['symbol']): body is DrumRest {
  return (body as DrumRest).type === NoteSymbolTypeEnum.Rest
}

function notesInfoVolume(info: DrumNotesInfo, base: number): number {
  let volume = base
  if (info.ghost) volume *= DRUM_GHOST_VOLUME
  if (info.affiliatedSymbols?.some((s) => ACCENT_NAMES.has(s.name))) volume *= DRUM_ACCENT_VOLUME
  return volume
}

function appendVoice(
  seq: DR_playSequence,
  slots: MeasureNoteSlot[],
  measureStart: Unit256,
  drumMap: DrumPlayMap,
  staveIndex: number,
  noteStaveIndex: Map<string, number>,
): Unit256 {
  let playTime = measureStart
  for (const measureSlot of slots) {
    const body = slotSymbol(measureSlot)
    if (isDrumRest(body)) {
      const duration = getDuration(body.chronaxie, body.augmentationDot?.count ?? 0)
      seq.push({note_id: body.id, midi: 0, duration, playTime})
      playTime += duration
      continue
    }
    if (!isDrumNote(body)) continue
    const lead = body.notesInfo[0]
    if (!lead) continue
    const duration = getDuration(lead.chronaxie, lead.augmentationDot?.count ?? 0)
    const push = (info: DrumNotesInfo, at: Unit256, itemDuration: Unit256) => {
      const entry = drumMap[drumPlayMapKey(info.region, info.headType)]
      pushPitchItem(seq, noteStaveIndex, staveIndex, {
        note_id: info.id,
        midi: entry?.midi ?? 0,
        duration: itemDuration,
        playTime: at,
        volume: notesInfoVolume(info, entry?.volume ?? 1),
      })
    }
    // 前倚音 index0 最靠主音：按视觉左→右（倒序）依次占用主音之前的时间
    const before = [...(body.graceNotes ?? [])].reverse()
    before.forEach((g, i) => push(g, playTime - (before.length - i) * GRACE_PLAY_DURATION, GRACE_PLAY_DURATION))
    for (const info of body.notesInfo) push(info, playTime, duration)
    const after = body.graceNotesAfter ?? []
    const steal = Math.min(duration, after.length * GRACE_PLAY_DURATION)
    after.forEach((g, i) => push(g, playTime + duration - steal + i * GRACE_PLAY_DURATION, GRACE_PLAY_DURATION))
    playTime += duration
  }
  return playTime - measureStart
}

/** 上下声部各自从小节起点累计；小节时长取两声部较长者；长休止符按拍号，空小节与其它谱种一致计 0 */
function appendMeasureSequence(
  seq: DR_playSequence,
  measure: Measure,
  measureStart: Unit256,
  timeSignature: TimeSignatureTypeEnum,
  drumMap: DrumPlayMap,
  staveIndex: number,
  noteStaveIndex: Map<string, number>,
): Unit256 {
  if (measure.longRest) {
    const duration = timeSignatureDuration(timeSignature)
    // 静音占位：保证末尾长休止符也计入总时长
    seq.push({note_id: measure.id, midi: 0, duration, playTime: measureStart})
    return duration
  }
  const voices = getMeasureVoices(measure)
  const up = appendVoice(seq, voices.up, measureStart, drumMap, staveIndex, noteStaveIndex)
  const down = appendVoice(seq, voices.down, measureStart, drumMap, staveIndex, noteStaveIndex)
  return Math.max(up, down)
}

/**
 * 鼓谱 → 可播放序列
 * - 每个音符头按 `${region}-${headType}` 查映射表得到音频 key 与音量倍数；查不到时 midi = 0（静音占位）
 * - ghost 音量 × DRUM_GHOST_VOLUME，重音 × DRUM_ACCENT_VOLUME，结果写入 item.volume
 * - 反复、volta、延音线与其它谱种一致
 */
export function getDrumPlaySequence(
  musicScoreData: MusicScore,
  options: DrumPlaySequenceOptions = {},
): DR_playSequence {
  const drumMap = options.drumMap ?? DEFAULT_DRUM_PLAY_MAP
  const measurePositions = getMeasurePositions(musicScoreData)
  const playMeasureIndexes = getPlayMeasureIndexes(musicScoreData)

  const seq: DR_playSequence = []
  const noteStaveIndex = new Map<string, number>()
  const maxStaves = Math.max(0, ...musicScoreData.grandStaffs.map((gs) => gs.staves.length))
  const staffTimeSignatures: TimeSignatureTypeEnum[] = Array.from(
    {length: maxStaves},
    () => musicScoreData.timeSignature ?? TimeSignatureTypeEnum['4_4'],
  )
  let globalPlayTime: Unit256 = 0

  for (const measureIndex of playMeasureIndexes) {
    const {grandStaffIndex, measureIndex: measureInGrandStaffIndex} = measurePositions[measureIndex]
    const grandStaff = musicScoreData.grandStaffs[grandStaffIndex]
    let measureDuration: Unit256 = 0
    for (let staveIndex = 0; staveIndex < grandStaff.staves.length; staveIndex++) {
      const measure = grandStaff.staves[staveIndex].measures[measureInGrandStaffIndex]
      if (!measure) continue
      if (measure.timeSignature_f) staffTimeSignatures[staveIndex] = measure.timeSignature_f.type
      const staveDuration = appendMeasureSequence(
        seq,
        measure,
        globalPlayTime,
        staffTimeSignatures[staveIndex]!,
        drumMap,
        staveIndex,
        noteStaveIndex,
      )
      if (measure.timeSignature_b) staffTimeSignatures[staveIndex] = measure.timeSignature_b.type
      measureDuration = Math.max(measureDuration, staveDuration)
    }
    globalPlayTime += measureDuration
  }

  applySlurTieRealDuration(seq, musicScoreData, noteStaveIndex)
  return seq.sort((a, b) => a.playTime - b.playTime)
}
