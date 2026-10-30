import {isFretboardScoreType, MusicScoreTypeEnum, primaryStaffType, resolveStaffType} from '@deciphony/renderer'
import type {MusicScore} from '@deciphony/renderer'
import {getDrumPlaySequence, type DrumPlaySequenceOptions} from './drumNotation/playSequence'
import {getNumberNotationPlaySequence} from './numberNotation/playSequence'
import {getStandardStaffPlaySequence} from './standardStaff/playSequence'
import {
  getBassPlaySequence,
  getFretInstrumentPlaySequence,
  getGuitarPlaySequence,
  getTabPlaySequence,
  getUkulelePlaySequence,
  type FretInstrumentPlayOptions,
  type TabPlaySequenceOptions,
} from './tab/playSequence'
import {applyStaffToneColor, buildIdToStaffMap, DEFAULT_TONE_COLOR} from './toneColor'
import {applyStaffVolume} from './staffVolume'
import {cropDrPlaySequence, type DrPlayRange} from './range'
import {applyPlayLyrics} from './lyrics'
import {fretInstrumentFromScoreType} from './tab/pitch'
import type {DR_playLyric, DR_playSequence, DR_playSequence_item, Unit256} from './types'

export type {DR_playLyric, DR_playSequence, DR_playSequence_item, Unit256}
export {applyPlayLyrics, createPlayLyricResolver} from './lyrics'
export {getDuration} from './types'
export {getStandardStaffPlaySequence} from './standardStaff/playSequence'
export {getNumberNotationPlaySequence} from './numberNotation/playSequence'
export {
  getBassPlaySequence,
  getFretInstrumentPlaySequence,
  getGuitarPlaySequence,
  getTabPlaySequence,
  getUkulelePlaySequence,
  type FretInstrumentPlayOptions,
  type TabPlaySequenceOptions,
} from './tab/playSequence'
export {
  BASS4_OPEN_MIDI,
  BASS5_OPEN_MIDI,
  BASS6_OPEN_MIDI,
  GUITAR_OPEN_MIDI,
  UKULELE_OPEN_MIDI,
  fretInstrumentFromScoreType,
  isBassInstrumentHint,
  openMidiForFretInstrument,
  openMidiForTabInstrument,
  resolveOpenMidiForScoreType,
  resolveStringMidi,
  resolveTabInstrumentKind,
  resolveTabOpenMidi,
  resolveTabStringMidi,
  type FretInstrument,
  type TabInstrumentKind,
} from './tab/pitch'
export {getDrumPlaySequence, type DrumPlaySequenceOptions} from './drumNotation/playSequence'
export {
  DEFAULT_DRUM_PLAY_MAP,
  DRUM_ACCENT_VOLUME,
  DRUM_GHOST_VOLUME,
  drumPlayMapKey,
  type DrumPlayMap,
  type DrumPlayMapEntry,
  type DrumPlayMapKey,
} from './drumNotation/drumPlayMap'

export {
  applyStaffToneColor,
  DEFAULT_TONE_COLOR,
  TONE_VARIANT_HARMONIC,
  baseNoteIdForToneLookup,
  instrumentValueKey,
  readInstrumentValueField,
  readStaffInstrumentValue,
  resolveInstrumentToneColorName,
  writeInstrumentValueVariant,
  writeStaffInstrumentValue,
} from './toneColor'
export {
  applyStaffVolume,
  DEFAULT_STAFF_VOLUME,
  readStaffVolume,
  writeStaffVolume,
} from './staffVolume'

export {cropDrPlaySequence, type DrPlayRange} from './range'

export type DrPlaySequenceOptions = DrumPlaySequenceOptions & TabPlaySequenceOptions & {
  /** 单谱表未设置 data.instrumentValue 时的音色名，默认 'piano' */
  defaultToneColor?: string
  /** 选段播放：按起止音符裁剪并把起点平移到 0，规则见 cropDrPlaySequence */
  range?: DrPlayRange
}

function getSequenceByType(
  musicScoreData: MusicScore,
  type: MusicScoreTypeEnum,
  options: DrPlaySequenceOptions,
): DR_playSequence {
  if (type === MusicScoreTypeEnum.NumberNotation) {
    return getNumberNotationPlaySequence(musicScoreData)
  }
  if (isFretboardScoreType(type)) {
    return getFretInstrumentPlaySequence(musicScoreData, {
      ...options,
      instrument: options.instrument ?? fretInstrumentFromScoreType(type),
    })
  }
  if (type === MusicScoreTypeEnum.DrumNotation) {
    return getDrumPlaySequence(musicScoreData, options)
  }
  return getStandardStaffPlaySequence(musicScoreData)
}

function typesInScore(score: MusicScore): MusicScoreTypeEnum[] {
  const types = new Set<MusicScoreTypeEnum>()
  for (const grandStaff of score.grandStaffs ?? []) {
    for (const staff of grandStaff.staves ?? []) types.add(resolveStaffType(staff, score))
  }
  if (types.size === 0) types.add(primaryStaffType(score))
  return [...types]
}

/** 其它谱种的小节清空音符，时间轴仍按同一套小节走，方便不同谱种的播放时间对齐 */
function isolateStaffType(score: MusicScore, type: MusicScoreTypeEnum): MusicScore {
  return {
    ...score,
    grandStaffs: score.grandStaffs.map((grandStaff) => ({
      ...grandStaff,
      staves: grandStaff.staves.map((staff) => {
        if (resolveStaffType(staff, score) === type) return staff
        return {
          ...staff,
          measures: staff.measures.map((measure) => ({
            ...measure,
            notes: Array.isArray(measure.notes) ? [] : {up: [], down: []},
          })),
        }
      }),
    })),
  }
}

/**
 * 按单谱表谱种分发：五线 / 简谱 / 吉他·尤克里里·贝斯 / 鼓谱。
 * 总谱里谱种不同就各走各的序列，再按 playTime 合在一起。
 * 指板类空弦表由单谱表 type（Guitar / Ukulele / Bass4|5|6）决定；
 * openMidi / instrument 可覆盖。drumMap 只对鼓谱生效。
 */
export function getDrPlaySequence(musicScoreData: MusicScore, options: DrPlaySequenceOptions = {}): DR_playSequence {
  const idToStaff = buildIdToStaffMap(musicScoreData)
  const types = typesInScore(musicScoreData)
  const seq = types.flatMap((type) =>
    getSequenceByType(types.length === 1 ? musicScoreData : isolateStaffType(musicScoreData, type), type, options),
  )
  seq.sort((a, b) => a.playTime - b.playTime)
  applyStaffToneColor(seq, musicScoreData, options.defaultToneColor?.trim() || DEFAULT_TONE_COLOR, idToStaff)
  applyStaffVolume(seq, musicScoreData, idToStaff)
  applyPlayLyrics(seq, musicScoreData)
  return options.range ? cropDrPlaySequence(seq, options.range) : seq
}
