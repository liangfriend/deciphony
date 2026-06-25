import {
  AugmentationDot,
  BeamTypeEnum,
  Frame,
  MusicScore,
  MusicScoreTypeEnum,
  NoteSymbolTypeEnum, SingleNoteAffiliatedSymbol,
  TabNoteInfo
} from "deciphony-renderer";
import {createGrandStaff, createMusicScore,} from "./scoreBuilder";
// 曲谱结构

const data: MusicScore = createMusicScore({height: 800, width: 800, type: MusicScoreTypeEnum.GuitarTab})
// 复谱表1-单谱表1
const grandStaff1 = createGrandStaff()

data.grandStaffs.push(grandStaff1)
const note = {

  id: Date.now(),

  type: NoteSymbolTypeEnum.Note,

  notesInfo: [{
    id: Date.now() + 5,

    region: 0, // 这个含义是第几条线， 0是第一线，1是第二线...

    value: 0, // 品，-1代表x

    beamType: BeamTypeEnum.None,

    affiliatedSymbols: []
  }]

}
grandStaff1.staves[0].measures[0].notes.push(note)
export default data
