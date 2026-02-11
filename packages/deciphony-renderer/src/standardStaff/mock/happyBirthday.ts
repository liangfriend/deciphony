import {
  BarlineTypeEnum,
  DoubleAffiliatedSymbolNameEnum,
  MusicScoreTypeEnum,
  NoteSymbolTypeEnum,
} from "@/enums/musicScoreEnum";
import {BeamTypeEnum} from "@/standardStaff/enums/standardStaffEnum";
import type {Clef, Measure, MusicScore, NoteSymbol, TimeSignature} from "@/types/MusicScoreType";
import {Frame} from "@/types/common";

const frame: Frame = {
  relativeH: 0,
  relativeY: 0,
  relativeW: 0,
  relativeX: 0
};

const clef: Clef = {
  ...frame,
  barlineType: undefined!,
  widthRatioForMeasure: 18,
  id: crypto.randomUUID(),
};
const time34: TimeSignature = {
  ...frame,
  barlineType: undefined!,
  widthRatioForMeasure: 14,
  id: crypto.randomUUID(),
};

function note(
    region: number,
    chronaxie: 64 | 32 = 32,
    widthRatio = 6,
    direction: 'up' | 'down' = 'up',
    beamType: BeamTypeEnum = BeamTypeEnum.None,
): NoteSymbol {
  return {
    ...frame,
    type: NoteSymbolTypeEnum.Note,
    chronaxie,
    direction,
    region,
    widthRatio,
    widthRatioForMeasure: widthRatio,
    id: crypto.randomUUID(),
    affiliatedSymbols: [],
    beamType,
  };
}

function rest(chronaxie: 64 | 32 = 64, widthRatio = 6): NoteSymbol {
  return {
    ...frame,
    type: NoteSymbolTypeEnum.Rest,
    chronaxie,
    direction: 'up',
    region: 0,
    widthRatio,
    widthRatioForMeasure: widthRatio,
    id: crypto.randomUUID(),
    affiliatedSymbols: [],
    beamType: BeamTypeEnum.None,
  };
}

// 高音谱表位置（与 NoteSymbol.region 一致：0 第一线，1 第一间，region 越大越高）：0 第一线(E)，1 第一间(F)，2 第二线(G)，3 第二间(A)，4 第三线(B)，5 第三间(C5)，6 第四线(D5)，7 第四间(E5)
// 祝你生日快乐 旋律 C 大调 3/4
// 第一句：祝你生日快乐（前四个八分音符连成符杠便于查看效果）
const phrase1Measure1: Measure = {
  ...frame,
  notes: [
    note(6, 32, 6, 'up', BeamTypeEnum.Combined), // G4 祝
    note(1, 32, 6, 'up', BeamTypeEnum.Combined), // G4 你
    note(2, 32, 6, 'up', BeamTypeEnum.Combined), // A4 生
    note(1, 32, 6, 'up', BeamTypeEnum.Combined), // G4 日
    note(4), // C5 快
    note(3), // B4 乐
  ],
  clef_f: clef,
  timeSignature_f: time34,
  barline: {
    barlineType: BarlineTypeEnum.Single_barline, widthRatioForMeasure: 4,
    id: crypto.randomUUID(),
    relativeH: 0,
    relativeY: 0,
    relativeW: 0,
    relativeX: 0
  },
  widthRatioForMeasure: 100,
  id: crypto.randomUUID(),
  affiliatedSymbols: [],
  relativeH: 0,
  relativeY: 0,
  relativeW: 0,
  relativeX: 0
};
const phrase1Measure2: Measure = {
  ...frame,
  notes: [],
  affiliatedSymbols: [],
  barline: {
    barlineType: BarlineTypeEnum.Single_barline, widthRatioForMeasure: 4,
    id: crypto.randomUUID(),
    relativeH: 0,
    relativeY: 0,
    relativeW: 0,
    relativeX: 0
  },
  widthRatioForMeasure: 100,
  id: crypto.randomUUID(),
  relativeH: 0,
  relativeY: 0,
  relativeW: 0,
  relativeX: 0
};

// 第二句：祝你生日快乐
const phrase2Measure1: Measure = {
  ...frame,
  notes: [
    note(1), // G4 祝
    note(1), // G4 你
    note(2), // A4 生
    note(1), // G4 日
    note(5), // D5 快
    note(4), // C5 乐
  ],
  clef_f: clef,
  timeSignature_f: time34,
  barline: {
    barlineType: BarlineTypeEnum.Single_barline, widthRatioForMeasure: 4,
    id: crypto.randomUUID(),
    relativeH: 0,
    relativeY: 0,
    relativeW: 0,
    relativeX: 0
  },
  widthRatioForMeasure: 100,
  id: crypto.randomUUID(),
  affiliatedSymbols: [],
  relativeH: 0,
  relativeY: 0,
  relativeW: 0,
  relativeX: 0
};
const phrase2Measure2: Measure = {
  ...frame,
  notes: [],
  affiliatedSymbols: [],
  barline: {
    ...frame,
    barlineType: BarlineTypeEnum.Single_barline,
    widthRatioForMeasure: 4,
    id: crypto.randomUUID(),
  },
  widthRatioForMeasure: 100,
  id: crypto.randomUUID(),
  relativeH: 0,
  relativeY: 0,
  relativeW: 0,
  relativeX: 0
};

// 第三句：祝你生日（亲爱的）快乐
const phrase3Measure1: Measure = {
  ...frame,
  notes: [
    note(1), // G4 祝
    note(1), // G4 你
    note(1), // G4 生
    note(6), // E5 日
    note(4), // C5 （亲）
    note(3), // B4 爱
    note(2), // A4 的
  ],
  clef_f: clef,
  timeSignature_f: time34,
  barline: {
    barlineType: BarlineTypeEnum.Single_barline, widthRatioForMeasure: 4,
    id: crypto.randomUUID(),
    relativeH: 0,
    relativeY: 0,
    relativeW: 0,
    relativeX: 0
  },
  widthRatioForMeasure: 100,
  id: crypto.randomUUID(),
  affiliatedSymbols: [],
  relativeH: 0,
  relativeY: 0,
  relativeW: 0,
  relativeX: 0
};
const phrase3Measure2: Measure = {
  ...frame,
  notes: [],
  affiliatedSymbols: [],
  barline: {
    barlineType: BarlineTypeEnum.Single_barline, widthRatioForMeasure: 4,
    id: crypto.randomUUID(),
    relativeH: 0,
    relativeY: 0,
    relativeW: 0,
    relativeX: 0
  },
  widthRatioForMeasure: 100,
  id: crypto.randomUUID(),
  relativeH: 0,
  relativeY: 0,
  relativeW: 0,
  relativeX: 0
};

// 第四句：祝你生日快乐
const phrase4Measure1: Measure = {
  ...frame,
  notes: [
    note(6), // F5 祝
    note(6), // F5 你
    note(6), // E5 生
    note(4), // C5 日
    note(5), // D5 快
    note(4), // C5 乐
  ],
  clef_f: clef,
  timeSignature_f: time34,
  barline: {
    barlineType: BarlineTypeEnum.Single_barline, widthRatioForMeasure: 4,
    id: crypto.randomUUID(),
    relativeH: 0,
    relativeY: 0,
    relativeW: 0,
    relativeX: 0
  },
  widthRatioForMeasure: 100,
  id: crypto.randomUUID(),
  affiliatedSymbols: [],
  relativeH: 0,
  relativeY: 0,
  relativeW: 0,
  relativeX: 0
};
const phrase4Measure2: Measure = {
  ...frame,
  notes: [],
  affiliatedSymbols: [],
  barline: {
    barlineType: BarlineTypeEnum.Final_barline, widthRatioForMeasure: 6,
    id: crypto.randomUUID(),
    relativeH: 0,
    relativeY: 0,
    relativeW: 0,
    relativeX: 0
  },
  widthRatioForMeasure: 100,
  id: crypto.randomUUID(),
  relativeH: 0,
  relativeY: 0,
  relativeW: 0,
  relativeX: 0
};

const data: MusicScore = {
  id: crypto.randomUUID(),
  type: MusicScoreTypeEnum.StandardStaff,
  grandStaffs: [
    {
      id: crypto.randomUUID(),
      ...frame,
      staves: [
        {
          id: crypto.randomUUID(),
          ...frame,
          measures: [phrase1Measure1, phrase1Measure2],
          uSpaceI: 20,
          dSpaceI: 20,
          uSpaceO: 20,
          dSpaceO: 20,
        },
      ],
      uSpace: 40,
      dSpace: 40,
    },
    {
      id: crypto.randomUUID(),
      ...frame,
      staves: [
        {
          id: crypto.randomUUID(),
          ...frame,
          measures: [phrase2Measure1, phrase2Measure2],
          uSpaceI: 20,
          dSpaceI: 20,
          uSpaceO: 20,
          dSpaceO: 20,
        },
      ],
      uSpace: 40,
      dSpace: 40,
    },
    {
      id: crypto.randomUUID(),
      ...frame,
      staves: [
        {
          id: crypto.randomUUID(),
          ...frame,
          measures: [phrase3Measure1, phrase3Measure2],
          uSpaceI: 20,
          dSpaceI: 20,
          uSpaceO: 20,
          dSpaceO: 20,
        },
      ],
      uSpace: 40,
      dSpace: 40,
    },
    {
      id: crypto.randomUUID(),
      ...frame,
      staves: [
        {
          id: crypto.randomUUID(),
          ...frame,
          measures: [phrase4Measure1, phrase4Measure2],
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
  affiliatedSymbols: [{
    id: crypto.randomUUID(),
    name: DoubleAffiliatedSymbolNameEnum.slur,
    startId: phrase1Measure1.notes[0].id,
    endId: phrase1Measure1.notes[1].id,
    relativeH: 0,
    relativeY: 0,
    relativeW: 0,
    relativeX: 0,
    data: {
      slur: {
        thickness: 5,
        relativeStartPoint: {x: 0, y: 0},
        relativeEndPoint: {x: 0, y: 0},
        relativeControlPoint: {x: 0, y: 0}
      }
    }
  }, {
    id: crypto.randomUUID(),
    name: DoubleAffiliatedSymbolNameEnum.volta,
    startId: phrase1Measure1.id,
    endId: phrase1Measure1.id,
    relativeH: 10,
    relativeY: 0,
    relativeW: 0,
    relativeX: 0,
    data: {}
  }],
  width: 800,
  height: 1400,
};

export default data;
