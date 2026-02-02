import {MusicScoreTypeEnum} from "@/enums/musicScoreEnum";
import {MusicScore} from "@/types/MusicScoreType";

const data: MusicScore = {
  type: MusicScoreTypeEnum.StandardStaff,
  grandStaffs: [{
    staves: [{
      measures: [
        {notes: [], relativeX: 0, relativeY: 0, relativeW: 100, relativeH: 45},
        {notes: [], relativeX: 0, relativeY: 0, relativeW: 100, relativeH: 45},
        {notes: [], relativeX: 0, relativeY: 0, relativeW: 100, relativeH: 45},
      ],
      uSpaceI: 30,
      dSpaceI: 30,
      uSpaceO: 30,
      dSpaceO: 30,
      relativeX: 0,
      relativeY: 0,
      relativeW: 0,
      relativeH: 0,
    }],
    uSpace: 70,
    dSpace: 70,
    relativeX: 0,
    relativeY: 0,
    relativeW: 0,
    relativeH: 0,
  }],
  spanSymbols: [],
  width: 800,
  height: 1200,
}
export default data;
