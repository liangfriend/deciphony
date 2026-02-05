import {
  BarlineTypeEnum,
  MusicScoreTypeEnum,
  NoteSymbolTypeEnum,
} from "@/enums/musicScoreEnum";
import type {MusicScore, Measure, NoteSymbol, Clef, TimeSignature} from "@/types/MusicScoreType";

const frame = {relativeX: 0, relativeY: 0};

const clef: Clef = {barlineType: undefined!, widthRatioForMeasure: 18};
const time34: TimeSignature = {barlineType: undefined!, widthRatioForMeasure: 14};

function note(
  region: number,
  chronaxie: 4 | 8 = 8,
  widthRatio = 6,
  direction: 'up' | 'down' = 'up',
): NoteSymbol {
  return {
    ...frame,
    type: NoteSymbolTypeEnum.Note,
    affiliatedSymbols: [],
    chronaxie,
    direction,
    region,
    widthRatio,
    widthRatioForMeasure: widthRatio,
  };
}

function rest(chronaxie: 4 | 8 = 4, widthRatio = 6): NoteSymbol {
  return {
    ...frame,
    type: NoteSymbolTypeEnum.Rest,
    affiliatedSymbols: [],
    chronaxie,
    direction: 'up', // 休止符不使用
    region: 0,
    widthRatio,
    widthRatioForMeasure: widthRatio,
  };
}

// 高音谱表位置（与 NoteSymbol.region 一致：0 第一线，1 第一间，region 越大越高）：0 第一线(E)，1 第一间(F)，2 第二线(G)，3 第二间(A)，4 第三线(B)，5 第三间(C5)，6 第四线(D5)，7 第四间(E5)
// 祝你生日快乐 旋律 C 大调 3/4
// 第一句：祝你生日快乐
const phrase1Measure1: Measure = {
  ...frame,
  notes: [
    note(6), // G4 祝
    note(1), // G4 你
    note(2), // A4 生
    note(1), // G4 日
    note(4), // C5 快
    note(3), // B4 乐
  ],
  clef_f: clef,
  timeSignature_f: time34,
  barline: {barlineType: BarlineTypeEnum.Single_barline, widthRatioForMeasure: 4},
  widthRatioForMeasure: 100,
};
const phrase1Measure2: Measure = {
  ...frame,
  notes: [],
  barline: {barlineType: BarlineTypeEnum.Single_barline, widthRatioForMeasure: 4},
  widthRatioForMeasure: 100,
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
  barline: {barlineType: BarlineTypeEnum.Single_barline, widthRatioForMeasure: 4},
  widthRatioForMeasure: 100,
};
const phrase2Measure2: Measure = {
  ...frame,
  notes: [],
  barline: {barlineType: BarlineTypeEnum.Single_barline, widthRatioForMeasure: 4},
  widthRatioForMeasure: 100,
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
  barline: {barlineType: BarlineTypeEnum.Single_barline, widthRatioForMeasure: 4},
  widthRatioForMeasure: 100,
};
const phrase3Measure2: Measure = {
  ...frame,
  notes: [],
  barline: {barlineType: BarlineTypeEnum.Single_barline, widthRatioForMeasure: 4},
  widthRatioForMeasure: 100,
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
  barline: {barlineType: BarlineTypeEnum.Single_barline, widthRatioForMeasure: 4},
  widthRatioForMeasure: 100,
};
const phrase4Measure2: Measure = {
  ...frame,
  notes: [],
  barline: {barlineType: BarlineTypeEnum.Final_barline, widthRatioForMeasure: 6},
  widthRatioForMeasure: 100,
};

const data: MusicScore = {
  type: MusicScoreTypeEnum.StandardStaff,
  grandStaffs: [
    {
      ...frame,
      staves: [
        {
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
      ...frame,
      staves: [
        {
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
      ...frame,
      staves: [
        {
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
      ...frame,
      staves: [
        {
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
  spanSymbols: [],
  width: 800,
  height: 1400,
};

export default data;
