import {MusicScoreTypeEnum} from '@deciphony/renderer'
import type {MusicScore} from '@deciphony/renderer'
import {getDrumPlaySequence, type DrumPlaySequenceOptions} from './drumNotation/playSequence'
import {getNumberNotationPlaySequence} from './numberNotation/playSequence'
import {getStandardStaffPlaySequence} from './standardStaff/playSequence'
import {getTabPlaySequence} from './tab/playSequence'
import {applyStaffToneColor, DEFAULT_TONE_COLOR} from './toneColor'
import type {DR_playSequence, DR_playSequence_item, Unit256} from './types'

export type {DR_playSequence, DR_playSequence_item, Unit256}
export {getDuration} from './types'
export {getStandardStaffPlaySequence} from './standardStaff/playSequence'
export {getNumberNotationPlaySequence} from './numberNotation/playSequence'
export {getTabPlaySequence} from './tab/playSequence'
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
  readStaffInstrumentValue,
  writeStaffInstrumentValue,
} from './toneColor'

export type DrPlaySequenceOptions = DrumPlaySequenceOptions & {
  /** 单谱表未设置 data.instrumentValue 时的音色名，默认 'piano' */
  defaultToneColor?: string
}

function getSequenceByType(musicScoreData: MusicScore, options: DrPlaySequenceOptions): DR_playSequence {
  if (musicScoreData.type === MusicScoreTypeEnum.NumberNotation) {
    return getNumberNotationPlaySequence(musicScoreData)
  }
  if (musicScoreData.type === MusicScoreTypeEnum.Tab6 || musicScoreData.type === MusicScoreTypeEnum.Tab4) {
    return getTabPlaySequence(musicScoreData)
  }
  if (musicScoreData.type === MusicScoreTypeEnum.DrumNotation) {
    return getDrumPlaySequence(musicScoreData, options)
  }
  return getStandardStaffPlaySequence(musicScoreData)
}

/**
 * 按曲谱类型分发到五线谱、简谱、吉他/尤克里里或鼓谱播放序列生成器；drumMap 只对鼓谱生效。
 * 每项 toneColor = 所在单谱表 data.instrumentValue，缺省为 options.defaultToneColor（默认 'piano'）。
 */
export function getDrPlaySequence(musicScoreData: MusicScore, options: DrPlaySequenceOptions = {}): DR_playSequence {
  return applyStaffToneColor(
    getSequenceByType(musicScoreData, options),
    musicScoreData,
    options.defaultToneColor?.trim() || DEFAULT_TONE_COLOR,
  )
}
