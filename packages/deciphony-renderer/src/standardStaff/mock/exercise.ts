import {
  BarlineTypeEnum,
  ClefTypeEnum,
  MusicScoreTypeEnum,
  NoteSymbolTypeEnum,
} from "@/enums/musicScoreEnum";
import {BeamTypeEnum} from "@/enums/musicScoreEnum";
import type {
  Clef,
  Measure,
  MusicScore,
  NoteSymbol,
} from "@/types/MusicScoreType";
import {Chronaxie, Frame} from "@/types/common";

const frame: Frame = {
  relativeH: 0,
  relativeY: 0,
  relativeW: 0,
  relativeX: 0
};

const clef: Clef = {
  ...frame,
  clefType: ClefTypeEnum.Treble,
  widthRatio: 5,
  widthRatioForMeasure: 18,
  id: crypto.randomUUID(),
};

// region: 0=E4(第一线) 1=F4 2=G4 3=A4 4=B4 5=C5 6=D5 7=E5
function note(
  region: number,
  chronaxie: Chronaxie = 64,
  widthRatio = 6,
  direction: 'up' | 'down' = 'up',
): NoteSymbol {
  return {
    ...frame,
    type: NoteSymbolTypeEnum.Note,
    direction,
    voicePart: {
      chronaxie,
      notesInfo: [{...frame, id: crypto.randomUUID(), region}],
      affiliatedSymbols: [],
      beamType: BeamTypeEnum.None,
    },
    widthRatio,
    widthRatioForMeasure: widthRatio,
    id: crypto.randomUUID(),
  };
}

function singleBarline() {
  return {
    ...frame,
    barlineType: BarlineTypeEnum.Single_barline,
    widthRatio: 4,
    widthRatioForMeasure: 4,
    id: crypto.randomUUID(),
  };
}

// 小节1：C5 A4
const measure1: Measure = {
  ...frame,
  notes: [note(5), note(3)],
  clef_f: clef,
  barline_b: singleBarline(),
  widthRatioForMeasure: 50,
  id: crypto.randomUUID(),
  affiliatedSymbols: [],
};

// 小节2：B4 C5
const measure2: Measure = {
  ...frame,
  notes: [note(4), note(5)],
  barline_b: singleBarline(),
  widthRatioForMeasure: 50,
  id: crypto.randomUUID(),
  affiliatedSymbols: [],
};

// 小节3：A4 B4
const measure3: Measure = {
  ...frame,
  notes: [note(3), note(4)],
  barline_b: singleBarline(),
  widthRatioForMeasure: 50,
  id: crypto.randomUUID(),
  affiliatedSymbols: [],
};

// 小节4：G4 A4
const measure4: Measure = {
  ...frame,
  notes: [note(2), note(3)],
  barline_b: {
    ...frame,
    barlineType: BarlineTypeEnum.Final_barline,
    widthRatio: 6,
    widthRatioForMeasure: 6,
    id: crypto.randomUUID(),
  },
  widthRatioForMeasure: 50,
  id: crypto.randomUUID(),
  affiliatedSymbols: [],
};

const data: MusicScore = {
  id: crypto.randomUUID(),
  type: MusicScoreTypeEnum.StandardStaff,
  topSpaceHeight: 0,
  bpm: 120,
  title: '练习',
  grandStaffs: [
    {
      id: crypto.randomUUID(),
      ...frame,
      staves: [
        {
          id: crypto.randomUUID(),
          ...frame,
          measures: [measure1, measure2, measure3, measure4],
          uSpaceI: 20,
          dSpaceI: 20,
          uSpaceO: 20,
          dSpaceO: 20,
        },
      ],
      uSpace: 40,
      dSpace: 40,
    },
  ],
  affiliatedSymbols: [],
  width: 800,
  height: 400,
};

export default data;
