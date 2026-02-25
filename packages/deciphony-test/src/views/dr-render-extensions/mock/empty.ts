import {MusicScore, MusicScoreTypeEnum} from "deciphony-renderer";

const data: MusicScore = {
  id: '111',
  type: MusicScoreTypeEnum.NumberNotation,
  grandStaffs: [],
  affiliatedSymbols: [], // 包含双音符附属型，双小节附属型
  width: 800,
  height: 1200,
  topSpaceHeight: 0, // 顶部高度
  title: '', // 标题
  bpm: 120 // 拍速
}

export default data