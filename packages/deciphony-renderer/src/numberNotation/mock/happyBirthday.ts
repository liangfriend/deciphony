import {
  AccidentalTypeEnum,
  BarlineTypeEnum,
  ClefTypeEnum,
  DoubleAffiliatedSymbolNameEnum,
  KeySignatureTypeEnum,
  MusicScoreTypeEnum,
  NoteSymbolTypeEnum,
  TimeSignatureTypeEnum,
} from "@/enums/musicScoreEnum";
import {BeamTypeEnum} from "@/numberNotation/enums/numberNotationEnum";
import type {
  Accidental,
  AugmentationDot,
  Clef,
  Measure,
  MusicScore,
  NotesInfo,
  NoteSymbol,
  TimeSignature
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
const trebleClef: Clef = {
  ...frame,
  clefType: ClefTypeEnum.Treble,
  widthRatio: 10,
  widthRatioForMeasure: 18,
  id: crypto.randomUUID(),
};
const time34: TimeSignature = {
  ...frame,
  type: TimeSignatureTypeEnum['3_4'],
  widthRatio: 14,
  widthRatioForMeasure: 14,
  id: crypto.randomUUID(),
};

const defaultAccidental: Accidental = {
  ...frame,
  id: crypto.randomUUID(),
  type: AccidentalTypeEnum.Sharp,
  widthRatio: 2,
  widthRatioForMeasure: 10,
};

/** 单声部单音或和弦：region 可单数或数组；多声部用 noteSlot。仅需展示音符前谱号时传 noteClef */
function note(
    region: number | number[],
    chronaxie: Chronaxie = 32,
    widthRatio = 6,
    direction: 'up' | 'down' = 'up',
    beamType: BeamTypeEnum = BeamTypeEnum.None,
    accidental?: Accidental[],
    noteClef?: Clef,
): NoteSymbol {
  const regions = Array.isArray(region) ? region : [region];
  const notesInfo = regions.map((r, i) => ({
    ...frame,
    id: crypto.randomUUID(),
    region: r,
    accidental: accidental?.[i] ?? (regions.length === 1 ? defaultAccidental : undefined),
  }));
  const out: NoteSymbol = {
    ...frame,
    type: NoteSymbolTypeEnum.Note,
    direction,
    voicePart1: [{chronaxie, notesInfo, affiliatedSymbols: [], beamType}],
    voicePart2: [],
    widthRatio,
    widthRatioForMeasure: widthRatio,
    id: crypto.randomUUID(),
  };
  if (noteClef) out.clef = noteClef;
  return out;
}

function rest(chronaxie: Chronaxie = 64, widthRatio = 6): NoteSymbol {
  return {
    ...frame,
    type: NoteSymbolTypeEnum.Rest,
    direction: 'up',
    voicePart1: [{chronaxie, notesInfo: [], affiliatedSymbols: [], beamType: BeamTypeEnum.None}],
    voicePart2: [],
    widthRatio,
    widthRatioForMeasure: widthRatio,
    id: crypto.randomUUID(),
  };
}

/** 双声部一音符位：声部1 + 声部2（符干反向） */
function noteSlot(
    v1: { chronaxie: Chronaxie; notesInfo: NotesInfo[]; beamType: BeamTypeEnum, augmentationDot: AugmentationDot },
    v2: {
      chronaxie: Chronaxie;
      notesInfo: NotesInfo[];
      beamType: BeamTypeEnum,
      augmentationDot: AugmentationDot
    } | null,
    widthRatio = 6,
    direction: 'up' | 'down' = 'up',
): NoteSymbol {
  return {
    ...frame,
    type: NoteSymbolTypeEnum.Note,
    direction,
    voicePart1: [{...v1, affiliatedSymbols: []}],
    voicePart2: v2 ? [{...v2, affiliatedSymbols: []}] : [],
    widthRatio,
    widthRatioForMeasure: widthRatio,
    id: crypto.randomUUID(),
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
    note(7, 128, 6, 'down', BeamTypeEnum.Combined), // G4 祝
    note(0, 16, 6, 'down', BeamTypeEnum.None), // G4 你
    note(-2, 8, 6, 'down', BeamTypeEnum.OnlyRight), // A4 生
    note(6, 4, 6, 'up', BeamTypeEnum.None), // G4 日
    note(4, 2, 6, 'up', BeamTypeEnum.None), // C5 快
    note(0, 1, 6, 'up', BeamTypeEnum.None), // B4 乐
  ],
  keySignature_f: {
    id: crypto.randomUUID(),
    type: KeySignatureTypeEnum.D,
    widthRatio: 10,
    widthRatioForMeasure: 10,
    relativeH: 0,
    relativeY: 0,
    relativeW: 0,
    relativeX: 0
  },
  clef_f: clef,
  clef_b: clef,
  timeSignature_f: time34,
  barline: {
    barlineType: BarlineTypeEnum.Start_end_repeat_barline, widthRatio: 4, widthRatioForMeasure: 4,
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
    barlineType: BarlineTypeEnum.Single_barline, widthRatio: 4, widthRatioForMeasure: 4,
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
    barlineType: BarlineTypeEnum.Single_barline, widthRatio: 4, widthRatioForMeasure: 4,
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
    widthRatio: 4,
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
      widthRatio: 4,
      widthRatioForMeasure: 4,
      id: crypto.randomUUID(),
    },
  };
}

const phrase3Measures: Measure[] = BARLINE_TYPES.map((t, i) => barlineMeasure(t, i === 0));

// 附点辅助：count 1/2/3 对应 1/2/3 个附点
function augmentationDot(count: 1 | 2 | 3): AugmentationDot {
  return {
    ...frame,
    id: crypto.randomUUID(),
    count,
    widthRatio: count === 1 ? 2 : count === 2 ? 3 : 4,
    widthRatioForMeasure: count === 1 ? 4 : count === 2 ? 6.5 : 9,
  };
}

/** 给音符位第一个声部第一拍加附点（新类型附点在 beat 上） */
function withAugmentationDot(n: NoteSymbol, dot: AugmentationDot): NoteSymbol {
  if (!n.voicePart1.length) return n;
  return {
    ...n,
    voicePart1: [{...n.voicePart1[0], augmentationDot: dot}, ...n.voicePart1.slice(1)],
  };
}

// 第四句：祝你生日快乐（前三个音分别带 1、2、3 个附点；首个音带音符前谱号展示）
const phrase4Measure1: Measure = {
  ...frame,
  notes: [
    withAugmentationDot(note(20, 32, 6, 'down', BeamTypeEnum.None, undefined, trebleClef), augmentationDot(1)), // 祝，1 附点 + 音符前谱号
    withAugmentationDot(note(5), augmentationDot(2)), // F5 你，2 附点
    withAugmentationDot(note(6), augmentationDot(3)), // E5 生，3 附点
    note(4), // C5 日
    note(5), // D5 快
    note(4), // C5 乐
  ],
  clef_b: clef,
  timeSignature_f: time34,
  barline: {
    barlineType: BarlineTypeEnum.Heavy_double_barline, widthRatio: 4, widthRatioForMeasure: 4,
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
    barlineType: BarlineTypeEnum.Final_barline, widthRatio: 6, widthRatioForMeasure: 6,
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

// 第五行：和弦 + 双声部展示；首个音符带音符前谱号（高音谱号）展示
const phrase5Measure1: Measure = {
  ...frame,
  notes: [
    // 单声部三音和弦，前加高音谱号（音符前谱号）
    note([6, 4, 2], 64, 6, 'down', BeamTypeEnum.None, undefined, trebleClef),
    rest(64),
    // 单声部双音和弦
    note([5, 3], 32, 6, 'up', BeamTypeEnum.None),
    // 双声部同一音符位：声部1 高音，声部2 低音，符干反向合并
    noteSlot(
        {
          chronaxie: 32,
          notesInfo: [{...frame, id: crypto.randomUUID(), region: 6, accidental: defaultAccidental} as NotesInfo],
          beamType: BeamTypeEnum.Combined,
          augmentationDot: augmentationDot(2)
        },
        {
          chronaxie: 32,
          notesInfo: [{...frame, id: crypto.randomUUID(), region: 0, accidental: defaultAccidental} as NotesInfo],
          beamType: BeamTypeEnum.Combined
        },
        6,
        'up',
    ),
    // 双声部 + 其中一声部为和弦
    noteSlot(
        {
          chronaxie: 32,
          notesInfo: [{...frame, id: crypto.randomUUID(), region: 5, accidental: defaultAccidental} as NotesInfo, {
            ...frame,
            id: crypto.randomUUID(),
            region: 3
          } as NotesInfo],
          beamType: BeamTypeEnum.Combined,
          augmentationDot: augmentationDot(2)
        },
        {
          chronaxie: 32,
          notesInfo: [{...frame, id: crypto.randomUUID(), region: 2} as NotesInfo],
          beamType: BeamTypeEnum.Combined
        },
        6,
        'up',
    ),
    note(4, 64, 6, 'up', BeamTypeEnum.None),
  ],
  clef_f: clef,
  timeSignature_f: time34,
  barline: {
    barlineType: BarlineTypeEnum.Heavy_double_barline,
    widthRatio: 4,
    widthRatioForMeasure: 4,
    id: crypto.randomUUID(),
    relativeH: 0,
    relativeY: 0,
    relativeW: 0,
    relativeX: 0,
  },
  widthRatioForMeasure: 100,
  id: crypto.randomUUID(),
  affiliatedSymbols: [],
  relativeH: 0,
  relativeY: 0,
  relativeW: 0,
  relativeX: 0,
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
    relativeH: 0,
    relativeY: 0,
    relativeW: 0,
    relativeX: 0,
  },
  widthRatioForMeasure: 100,
  id: crypto.randomUUID(),
  relativeH: 0,
  relativeY: 0,
  relativeW: 0,
  relativeX: 0,
};

const data: MusicScore = {
  id: crypto.randomUUID(),
  type: MusicScoreTypeEnum.NumberNotation,
  topSpaceHeight: 0,
  bpm: 120,
  title: '哈哈哈',
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
