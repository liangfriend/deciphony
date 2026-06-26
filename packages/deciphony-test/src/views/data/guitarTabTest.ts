import {
  AugmentationDot,
  BeamTypeEnum, Chronaxie,
  Frame,
  MusicScore,
  MusicScoreTypeEnum,
  NoteSymbolTypeEnum, SingleNoteAffiliatedSymbol, TabNote,
  TabNoteInfo,
  TabNoteInfoTypeEnum,
} from "deciphony-renderer";
import {createGrandStaff, createMusicScore,} from "./scoreBuilder";
// 曲谱结构

const data: MusicScore = createMusicScore({height: 800, width: 800, type: MusicScoreTypeEnum.GuitarTab})
// 复谱表1-单谱表1
const grandStaff1 = createGrandStaff()

data.grandStaffs.push(grandStaff1)
const note: TabNote = {

  id: Date.now(),

  type: NoteSymbolTypeEnum.Note,

  notesInfo: [{
    id: Date.now() + 5,
    type: TabNoteInfoTypeEnum.Normal,
    chronaxie: 8,
    region: 0, // 这个含义是第几条线， 0是第一线，1是第二线...

    value: 21, // 品，-1代表x

    beamType: BeamTypeEnum.Combined,
    augmentationDot: {
      id: Date.now(),
      count: 3
    },
    affiliatedSymbols: []
  }, {
    id: Date.now() + 7,
    type: TabNoteInfoTypeEnum.Normal,
    chronaxie: 128,
    region: 2, // 这个含义是第几条线， 0是第一线，1是第二线...

    value: 6, // 品，-1代表x

    beamType: BeamTypeEnum.None,

    affiliatedSymbols: []
  }]

}
const note2: TabNote = {

  id: Date.now(),

  type: NoteSymbolTypeEnum.Note,
  notesInfo: [{
    id: Date.now() + 10,
    type: TabNoteInfoTypeEnum.Arpeggio,
    chronaxie: 8,
    regionRange: {
      start: 2,
      end: 5
    }, // 这个含义是第几条线， 0是第一线，1是第二线...

    value: 21, // 品，-1代表x
    beamType: BeamTypeEnum.Combined,
    augmentationDot: {
      id: Date.now(),
      count: 3
    },
    affiliatedSymbols: []
  }, {
    id: Date.now() + 7,
    type: TabNoteInfoTypeEnum.Normal,
    chronaxie: 128,
    region: 2, // 这个含义是第几条线， 0是第一线，1是第二线...

    value: 6, // 品，-1代表x

    beamType: BeamTypeEnum.None,

    affiliatedSymbols: []
  }]


}

grandStaff1.staves[0].measures[0].notes.push(note)
grandStaff1.staves[0].measures[0].notes.push(note2)
export default data
