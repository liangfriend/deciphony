import {BeamTypeEnum, MusicScore, NoteSymbolTypeEnum, MusicScoreTypeEnum} from "deciphony-renderer";
import {
  createEmptyMeasure,
  createGrandStaff,
  createMusicScore,
  createNoteSymbol,
  createSingleStaff
} from "./scoreBuilder";

const data: MusicScore = createMusicScore()
const grandStaff1 = createGrandStaff()
const noteSymbol1111 = createNoteSymbol({region: 1, chronaxie: 64, direction: 'up', beamType: BeamTypeEnum.None,})
grandStaff1.staves[0].measures[0].notes.push(noteSymbol1111)
data.grandStaffs.push(grandStaff1)
// const measure112 = createEmptyMeasure()
// const measure113 = createEmptyMeasure()
// const measure114 = createEmptyMeasure()
// const singleStaff12 = createSingleStaff()
// const measure121 = createEmptyMeasure()
// const measure122 = createEmptyMeasure()
// const measure123 = createEmptyMeasure()
// const measure124 = createEmptyMeasure()


export default data