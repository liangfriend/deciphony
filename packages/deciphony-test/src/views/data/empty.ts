import {
  BarlineTypeEnum,
  BeamTypeEnum,
  BracketTypeEnum,
  ClefTypeEnum,
  KeySignatureTypeEnum,
  MeasureEndRepeatEnum,
  MeasureStartRepeatEnum,
  MusicScore,
  TimeSignatureTypeEnum
} from "deciphony-renderer";
import {
  createBarline,
  createClef,
  createEmptyMeasure,
  createGrandStaff,
  createKeySignature,
  createMusicScore,
  createNoteRest, createNotesInfo,
  createNoteSymbol,
  createSingleStaff,
  createTimeSignature,
} from "./scoreBuilder";
// 曲谱结构

const data: MusicScore = createMusicScore({height: 800, width: 800})
// 复谱表1-单谱表1
const grandStaff1 = createGrandStaff()

data.grandStaffs.push(grandStaff1)

export default data
