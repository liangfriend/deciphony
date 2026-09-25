import {MusicScoreTypeEnum} from '@deciphony/renderer'
import type {MusicScore} from '@deciphony/renderer'
import {getNumberNotationPlaySequence} from './numberNotation/playSequence'
import {getStandardStaffPlaySequence} from './standardStaff/playSequence'
import {getTabPlaySequence} from './tab/playSequence'
import type {DR_playSequence, DR_playSequence_item, Unit256} from './types'

export type {DR_playSequence, DR_playSequence_item, Unit256}
export {getDuration} from './types'
export {getStandardStaffPlaySequence} from './standardStaff/playSequence'
export {getNumberNotationPlaySequence} from './numberNotation/playSequence'
export {getTabPlaySequence} from './tab/playSequence'

/** 按曲谱类型分发到五线谱、简谱或吉他/尤克里里播放序列生成器 */
export function getDrPlaySequence(musicScoreData: MusicScore): DR_playSequence {
  if (musicScoreData.type === MusicScoreTypeEnum.NumberNotation) {
    return getNumberNotationPlaySequence(musicScoreData)
  }
  if (musicScoreData.type === MusicScoreTypeEnum.Tab6 || musicScoreData.type === MusicScoreTypeEnum.Tab4) {
    return getTabPlaySequence(musicScoreData)
  }
  return getStandardStaffPlaySequence(musicScoreData)
}
