import {
  AccidentalTypeEnum,
  BarlineTypeEnum,
  ClefTypeEnum,
  DoubleAffiliatedSymbolNameEnum,
  MusicScoreTypeEnum,
  NoteSymbolTypeEnum,
  TimeSignatureTypeEnum,
} from "@/enums/musicScoreEnum";
import {BeamTypeEnum} from "@/standardStaff/enums/standardStaffEnum";
import type {Clef, Measure, MusicScore, NoteSymbol, TimeSignature} from "@/types/MusicScoreType";
import {Chronaxie, Frame} from "@/types/common";

const frame: Frame = {
  relativeH: 0,
  relativeY: 0,
  relativeW: 0,
  relativeX: 0
};

const clef: Clef = {
  ...frame,
  clefType: ClefTypeEnum.Bass,
  widthRatioForMeasure: 18,
  id: crypto.randomUUID(),
};
const time34: TimeSignature = {
  ...frame,
  barlineType: TimeSignatureTypeEnum['3_4'],
  widthRatioForMeasure: 14,
  id: crypto.randomUUID(),
};

function note(
    region: number,
    chronaxie: Chronaxie = 32,
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
    accidental: {
      ...frame,
      id: crypto.randomUUID(),
      type: AccidentalTypeEnum.Natural,
      widthRatioForMeasure: 10
    },
    affiliatedSymbols: [],
    beamType,
  };
}

function rest(chronaxie: Chronaxie = 64, widthRatio = 6): NoteSymbol {
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

/** 256→1 的时值序列（用于休止符展示） */
const REST_CHRONAXIES: Chronaxie[] = [256, 128, 64, 32, 16, 8, 4, 2, 1];

// 高音谱表位置（与 NoteSymbol.region 一致：0 第一线，1 第一间，region 越大越高）：0 第一线(E)，1 第一间(F)，2 第二线(G)，3 第二间(A)，4 第三线(B)，5 第三间(C5)，6 第四线(D5)，7 第四间(E5)
// 祝你生日快乐 旋律 C 大调 3/4
// 第一句：祝你生日快乐（前四个八分音符连成符杠便于查看效果）
const phrase1Measure1: Measure = {
  ...frame,
  notes: [
    note(8, 32, 6, 'up', BeamTypeEnum.Combined), // G4 祝
    note(0, 16, 6, 'down', BeamTypeEnum.None), // G4 你
    note(-2, 8, 6, 'down', BeamTypeEnum.OnlyRight), // A4 生
    note(6, 4, 6, 'up', BeamTypeEnum.None), // G4 日
    note(4, 2, 6, 'up', BeamTypeEnum.None), // C5 快
    note(0, 1, 6, 'up', BeamTypeEnum.None), // B4 乐
  ],
  clef_f: clef,
  timeSignature_f: time34,
  barline: {
    barlineType: BarlineTypeEnum.Start_end_repeat_barline, widthRatioForMeasure: 4,
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

// 第二行：256→1 时值的所有休止符
const phrase2Measure1: Measure = {
  ...frame,
  notes: REST_CHRONAXIES.map((c) => rest(c)),
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

// 第三行：多个小节分别展示所有小节线类型（无音符）
const BARLINE_TYPES: BarlineTypeEnum[] = [
  BarlineTypeEnum.Single_barline,
  BarlineTypeEnum.Double_barline,
  BarlineTypeEnum.StartRepeat_barline,
  BarlineTypeEnum.EndRepeat_barline,
  BarlineTypeEnum.Dashed_barline,
  BarlineTypeEnum.Final_barline,
  BarlineTypeEnum.Start_end_repeat_barline,
  BarlineTypeEnum.Dotted_barline,
  BarlineTypeEnum.Reverse_barline,
  BarlineTypeEnum.Heavy_barline,
  BarlineTypeEnum.Heavy_double_barline,
];

function barlineMeasure(barlineType: BarlineTypeEnum, isFirst: boolean): Measure {
  return {
    ...frame,
    notes: [],
    widthRatioForMeasure: 20,
    id: crypto.randomUUID(),
    affiliatedSymbols: [],
    ...(isFirst ? {clef_f: clef, timeSignature_f: time34} : {}),
    barline: {
      ...frame,
      barlineType,
      widthRatioForMeasure: 4,
      id: crypto.randomUUID(),
    },
  };
}

const phrase3Measures: Measure[] = BARLINE_TYPES.map((t, i) => barlineMeasure(t, i === 0));

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
  clef_b: clef,
  timeSignature_f: time34,
  barline: {
    barlineType: BarlineTypeEnum.Heavy_double_barline, widthRatioForMeasure: 4,
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
          measures: phrase3Measures,
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
