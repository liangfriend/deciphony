/**
 * 简谱 mock：祝你生日快乐
 * NoteNumber 格式，syllable 1-7 = do re mi fa sol la si，0 = 休止符，'X' = 节奏音符
 */
import {
  AccidentalTypeEnum,
  BarlineTypeEnum,
  ClefTypeEnum,
  DoubleAffiliatedSymbolNameEnum,
  KeySignatureTypeEnum,
  MusicScoreTypeEnum,
  TimeSignatureTypeEnum,
} from "@/enums/musicScoreEnum";
import {BeamTypeEnum} from "@/numberNotation/enums/numberNotationEnum";
import type {
  Accidental,
  AugmentationDot,
  Clef,
  Measure,
  MusicScore,
  NoteNumber,
  NotesNumberInfo,
  TimeSignature,
} from "@/types/MusicScoreType";
import {Chronaxie, Frame} from "@/types/common";

const frame: Frame = {
  relativeH: 0,
  relativeY: 0,
  relativeW: 0,
  relativeX: 0,
};

const clef: Clef = {
  ...frame,
  clefType: ClefTypeEnum.Treble,
  widthRatio: 5,
  widthRatioForMeasure: 18,
  id: crypto.randomUUID(),
};
const time34: TimeSignature = {
  ...frame,
  type: TimeSignatureTypeEnum["3_4"],
  widthRatio: 14,
  widthRatioForMeasure: 14,
  id: crypto.randomUUID(),
};

const accidentalNatural: Accidental = {
  ...frame,
  id: crypto.randomUUID(),
  type: AccidentalTypeEnum.Natural,
  widthRatio: 2,
  widthRatioForMeasure: 10,
};
const accidentalSharp: Accidental = {
  ...frame,
  id: crypto.randomUUID(),
  type: AccidentalTypeEnum.Sharp,
  widthRatio: 2,
  widthRatioForMeasure: 10,
};
const accidentalFlat: Accidental = {
  ...frame,
  id: crypto.randomUUID(),
  type: AccidentalTypeEnum.Flat,
  widthRatio: 2,
  widthRatioForMeasure: 10,
};

function notesInfo(syllables: (0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | "X")[], accidental: Accidental = accidentalNatural): NotesNumberInfo[] {
  return syllables.map((s) => ({
    id: crypto.randomUUID(),
    syllable: s,
    accidental,
  }));
}

/** 简谱音符：syllable 1-7 = do~si，0 = 休止符，'X' = 节奏音符 */
function note(
    syllable: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | "X",
    chronaxie: Chronaxie = 64,
    widthRatio = 6,
    beamType: BeamTypeEnum = BeamTypeEnum.None,
    accidental: Accidental = accidentalNatural,
    augmentationDot?: AugmentationDot,
): NoteNumber {
  const notes = syllable === "X" ? notesInfo(["X"], accidental) : notesInfo([syllable as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7], accidental);
  return {
    ...frame,
    id: crypto.randomUUID(),
    voicePart: [
      {
        chronaxie,
        notesInfo: notes,
        affiliatedSymbols: [],
        beamType,
        ...(augmentationDot ? {augmentationDot} : {}),
      },
    ],
    widthRatio,
    widthRatioForMeasure: widthRatio,
  };
}

/** 简谱和弦（多音堆叠） */
function chord(
    syllables: (1 | 2 | 3 | 4 | 5 | 6 | 7)[],
    chronaxie: Chronaxie = 64,
    widthRatio = 6,
    beamType: BeamTypeEnum = BeamTypeEnum.None,
    accidental: Accidental = accidentalNatural,
): NoteNumber {
  const notes = syllables.map((s) => ({
    id: crypto.randomUUID(),
    syllable: s as 1 | 2 | 3 | 4 | 5 | 6 | 7,
    accidental,
  }));
  return {
    ...frame,
    id: crypto.randomUUID(),
    voicePart: [
      {
        chronaxie,
        notesInfo: notes,
        affiliatedSymbols: [],
        beamType,
      },
    ],
    widthRatio,
    widthRatioForMeasure: widthRatio,
  };
}

/** 休止符（syllable 0） */
function rest(chronaxie: Chronaxie = 64, widthRatio = 6): NoteNumber {
  return note(0, chronaxie, widthRatio);
}

/** 256→1 的时值序列（用于休止符展示） */
const REST_CHRONAXIES: Chronaxie[] = [256, 128, 64, 32, 16, 8, 4, 2, 1];

function augmentationDot(count: 1 | 2 | 3): AugmentationDot {
  return {
    ...frame,
    id: crypto.randomUUID(),
    count,
    widthRatio: count === 1 ? 2 : count === 2 ? 3 : 4,
    widthRatioForMeasure: count === 1 ? 4 : count === 2 ? 6.5 : 9,
  };
}

// 第一行：祝你生日快乐 旋律 C 大调 3/4  (5 5 6 5 1 7 | 5 - -)
const phrase1Measure1: Measure = {
  ...frame,
  notes: [
    note(1, 32, 6, BeamTypeEnum.Combined), // 5 祝
    note(1, 16, 6, BeamTypeEnum.Combined), // 5 你
    note(2, 8, 6, BeamTypeEnum.OnlyRight), // 6 生
    note(3, 4, 6, BeamTypeEnum.None), // 5 日
    note(4, 2, 6, BeamTypeEnum.None), // 1 快
    note(5, 1, 6, BeamTypeEnum.None), // 7 乐
  ] as NoteNumber[],
  keySignature_f: {
    id: crypto.randomUUID(),
    type: KeySignatureTypeEnum.D,
    widthRatio: 10,
    widthRatioForMeasure: 10,
    ...frame,
  },
  clef_f: clef,
  clef_b: clef,
  timeSignature_f: time34,
  barline: {
    barlineType: BarlineTypeEnum.Start_end_repeat_barline,
    widthRatio: 4,
    widthRatioForMeasure: 4,
    id: crypto.randomUUID(),
    ...frame,
  },
  widthRatioForMeasure: 100,
  id: crypto.randomUUID(),
  affiliatedSymbols: [],
  ...frame,
};
const phrase1Measure2: Measure = {
  ...frame,
  notes: [],
  affiliatedSymbols: [],
  barline: {
    barlineType: BarlineTypeEnum.Single_barline,
    widthRatio: 4,
    widthRatioForMeasure: 4,
    id: crypto.randomUUID(),
    ...frame,
  },
  widthRatioForMeasure: 100,
  id: crypto.randomUUID(),
  ...frame,
};

// 第二行：256→1 时值的所有休止符
const phrase2Measure1: Measure = {
  ...frame,
  notes: REST_CHRONAXIES.map((c) => rest(c)) as NoteNumber[],
  clef_f: clef,
  timeSignature_f: time34,
  barline: {
    barlineType: BarlineTypeEnum.Single_barline,
    widthRatio: 4,
    widthRatioForMeasure: 4,
    id: crypto.randomUUID(),
    ...frame,
  },
  widthRatioForMeasure: 100,
  id: crypto.randomUUID(),
  affiliatedSymbols: [],
  ...frame,
};
const phrase2Measure2: Measure = {
  ...frame,
  notes: [],
  affiliatedSymbols: [],
  barline: {
    barlineType: BarlineTypeEnum.Single_barline,
    widthRatio: 4,
    widthRatioForMeasure: 4,
    id: crypto.randomUUID(),
    ...frame,
  },
  widthRatioForMeasure: 100,
  id: crypto.randomUUID(),
  ...frame,
};

// 第三行：多种小节线类型（无音符）
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
      widthRatio: 4,
      widthRatioForMeasure: 4,
      id: crypto.randomUUID(),
    },
  };
}

const phrase3Measures: Measure[] = BARLINE_TYPES.map((t, i) => barlineMeasure(t, i === 0));

// 第四行：附点音符  (5. 5.. 6... 4 5 4)
const phrase4Measure1: Measure = {
  ...frame,
  notes: [
    note(5, 32, 6, BeamTypeEnum.None, accidentalNatural, augmentationDot(1)), // 5. 一附点
    note(5, 32, 6, BeamTypeEnum.None, accidentalNatural, augmentationDot(2)), // 5.. 二附点
    note(6, 32, 6, BeamTypeEnum.None, accidentalNatural, augmentationDot(3)), // 6... 三附点
    note(4, 64, 6), // 4
    note(5, 64, 6), // 5
    note(4, 64, 6), // 4
  ] as NoteNumber[],
  clef_b: clef,
  timeSignature_f: time34,
  barline: {
    barlineType: BarlineTypeEnum.Heavy_double_barline,
    widthRatio: 4,
    widthRatioForMeasure: 4,
    id: crypto.randomUUID(),
    ...frame,
  },
  widthRatioForMeasure: 100,
  id: crypto.randomUUID(),
  affiliatedSymbols: [],
  ...frame,
};
const phrase4Measure2: Measure = {
  ...frame,
  notes: [],
  affiliatedSymbols: [],
  barline: {
    barlineType: BarlineTypeEnum.Final_barline,
    widthRatio: 6,
    widthRatioForMeasure: 6,
    id: crypto.randomUUID(),
    ...frame,
  },
  widthRatioForMeasure: 100,
  id: crypto.randomUUID(),
  ...frame,
};

// 第五行：和弦、变音记号
const phrase5Measure1: Measure = {
  ...frame,
  notes: [
    chord([1, 3, 5], 64, 6), // 135 和弦
    rest(64),
    chord([2, 4], 32, 6), // 24 双音
    note(5, 32, 6, BeamTypeEnum.None, accidentalSharp), // #5
    note(6, 32, 6, BeamTypeEnum.None, accidentalFlat), // b6
    note(4, 64, 6), // 4
  ] as NoteNumber[],
  clef_f: clef,
  timeSignature_f: time34,
  barline: {
    barlineType: BarlineTypeEnum.Heavy_double_barline,
    widthRatio: 4,
    widthRatioForMeasure: 4,
    id: crypto.randomUUID(),
    ...frame,
  },
  widthRatioForMeasure: 100,
  id: crypto.randomUUID(),
  affiliatedSymbols: [],
  ...frame,
};
const phrase5Measure2: Measure = {
  ...frame,
  notes: [],
  affiliatedSymbols: [],
  barline: {
    barlineType: BarlineTypeEnum.Final_barline,
    widthRatio: 6,
    widthRatioForMeasure: 6,
    id: crypto.randomUUID(),
    ...frame,
  },
  widthRatioForMeasure: 100,
  id: crypto.randomUUID(),
  ...frame,
};

const data: MusicScore = {
  id: crypto.randomUUID(),
  type: MusicScoreTypeEnum.NumberNotation,
  topSpaceHeight: 0,
  bpm: 120,
  title: "祝你生日快乐",
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
    {
      id: crypto.randomUUID(),
      ...frame,
      staves: [
        {
          id: crypto.randomUUID(),
          ...frame,
          measures: [phrase5Measure1, phrase5Measure2],
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
  affiliatedSymbols: [
    {
      id: crypto.randomUUID(),
      name: DoubleAffiliatedSymbolNameEnum.slur,
      startId: phrase1Measure1.notes[0].id,
      endId: phrase1Measure1.notes[1].id,
      ...frame,
      data: {
        slur: {
          thickness: 5,
          relativeStartPoint: {x: 0, y: 0},
          relativeEndPoint: {x: 0, y: 0},
          relativeControlPoint: {x: 0, y: 0},
        },
      },
    },
    {
      id: crypto.randomUUID(),
      name: DoubleAffiliatedSymbolNameEnum.volta,
      startId: phrase1Measure1.id,
      endId: phrase1Measure1.id,
      relativeH: 10,
      relativeY: 0,
      relativeW: 0,
      relativeX: 0,
      data: {},
    },
  ],
  width: 800,
  height: 1400,
};

export default data;
