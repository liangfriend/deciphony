import {MusicScoreTypeEnum} from 'deciphony-renderer'
import type {MusicScore} from 'deciphony-renderer'
import {getNumberNotationPlaySequence} from './numberNotation/playSequence'
import {getStandardStaffPlaySequence} from './standardStaff/playSequence'
import type {DR_playSequence, DR_playSequence_item, Unit256} from './types'

export type {DR_playSequence, DR_playSequence_item, Unit256}
export {getDuration} from './types'
export {getStandardStaffPlaySequence} from './standardStaff/playSequence'
export {getNumberNotationPlaySequence} from './numberNotation/playSequence'

/** 按曲谱类型分发到五线谱或简谱播放序列生成器 */
export function getDrPlaySequence(musicScoreData: MusicScore): DR_playSequence {
  if (musicScoreData.type === MusicScoreTypeEnum.NumberNotation) {
    return getNumberNotationPlaySequence(musicScoreData)
  }
  return getStandardStaffPlaySequence(musicScoreData)
}
