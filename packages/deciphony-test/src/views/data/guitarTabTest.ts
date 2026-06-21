import {MusicScore, MusicScoreTypeEnum} from "deciphony-renderer";
import {createGrandStaff, createMusicScore,} from "./scoreBuilder";
// 曲谱结构

const data: MusicScore = createMusicScore({height: 800, width: 800, type: MusicScoreTypeEnum.GuitarTab})
// 复谱表1-单谱表1
const grandStaff1 = createGrandStaff()

data.grandStaffs.push(grandStaff1)

export default data
