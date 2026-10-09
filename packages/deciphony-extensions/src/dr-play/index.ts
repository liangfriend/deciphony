import {isFretboardScoreType, MusicScoreTypeEnum} from '@deciphony/renderer'
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
import {applyStaffToneColor, DEFAULT_TONE_COLOR} from './toneColor'
import {cropDrPlaySequence, type DrPlayRange} from './range'
import type {DR_playSequence, DR_playSequence_item, Unit256} from './types'

export type {DR_playSequence, DR_playSequence_item, Unit256}
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

export {cropDrPlaySequence, type DrPlayRange} from './range'

export type DrPlaySequenceOptions = DrumPlaySequenceOptions & TabPlaySequenceOptions & {
  /** 单谱表未设置 data.instrumentValue 时的音色名，默认 'piano' */
  defaultToneColor?: string
  /** 选段播放：按起止音符裁剪并把起点平移到 0，规则见 cropDrPlaySequence */
  range?: DrPlayRange
}

function getSequenceByType(musicScoreData: MusicScore, options: DrPlaySequenceOptions): DR_playSequence {
  if (musicScoreData.type === MusicScoreTypeEnum.NumberNotation) {
    return getNumberNotationPlaySequence(musicScoreData)
  }
  if (isFretboardScoreType(musicScoreData.type)) {
    return getFretInstrumentPlaySequence(musicScoreData, options)
  }
  if (musicScoreData.type === MusicScoreTypeEnum.DrumNotation) {
    return getDrumPlaySequence(musicScoreData, options)
  }
  return getStandardStaffPlaySequence(musicScoreData)
}

/**
 * 按曲谱类型分发：五线 / 简谱 / 吉他·尤克里里·贝斯 / 鼓谱。
 * 指板类空弦表由 MusicScore.type（Guitar / Ukulele / Bass4|5|6）决定；
 * openMidi / instrument 可覆盖。drumMap 只对鼓谱生效。
 * toneColor：普通用 staff/score.data.instrumentValue；泛音等有 toneVariant 时优先
 * data.instrumentValue_${variant}（曲谱 data 优先），再降级 instrumentValue。
 */
export function getDrPlaySequence(musicScoreData: MusicScore, options: DrPlaySequenceOptions = {}): DR_playSequence {
  const seq = applyStaffToneColor(
    getSequenceByType(musicScoreData, options),
    musicScoreData,
    options.defaultToneColor?.trim() || DEFAULT_TONE_COLOR,
  )
  return options.range ? cropDrPlaySequence(seq, options.range) : seq
}
