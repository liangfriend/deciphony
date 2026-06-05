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
/*
* 其多列曲谱
* 复谱表1 高低音谱号F调2/4拍
* |32:5 32:3 64:3|32:5 32:3 32:3| 32:-1 32:-1 32:1 32:3| 32:2 32:1 32:2|
* |64:8 64:10|64:8 64:10|64:rest 32:8 32:6|128:10|
* 复谱表2 高低音谱号F调2/4拍
* |32:3 32:5 32:3 32:2| 32:1 32:2 64：-1|32:1 32：-1 32：-1|32:1 32：-1 64:-1|
* |32:rest 32:8 64:10|64:8 (64:9 64:7)| 64:rest (32:8 32:7) 32:4|64:rest (32:8 32:6) 32:4
*
* */

// 小节1-符号 高音谱号 F调 2/4拍
const measure1 = data.grandStaffs[0].staves[0].measures[0]
const noteSymbol11 = createNoteSymbol({region: 5, chronaxie: 32, direction: 'down', beamType: BeamTypeEnum.Combined,})
noteSymbol11.notesInfo.push(createNotesInfo({region: 6}))
noteSymbol11.relativeX = 0
noteSymbol11.notesInfo[0].relativeX = 30
measure1.notes.push(noteSymbol11)


export default data
