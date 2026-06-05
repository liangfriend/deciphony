/**
 * 曲谱数据打谱工具：向 MusicScore 树结构插入复谱表 / 单谱表 / 小节 / 音符等节点。
 *
 * @example
 * import { createMusicScore, insertGrandStaff, insertMeasure, insertNote } from './scoreBuilder'
 *
 * const score = createMusicScore({ title: '练习', type: MusicScoreTypeEnum.StandardStaff })
 * insertGrandStaff(score)
 * insertMeasure(score, { grandStaffIndex: 0, singleStaffIndex: 0 }, { clef: ClefTypeEnum.Treble, timeSignature: TimeSignatureTypeEnum['4_4'] })
 * insertNote(score, { grandStaffIndex: 0, singleStaffIndex: 0, measureIndex: 0 }, { region: 2, chronaxie: 64 })
 */
import {
  AccidentalTypeEnum,
  BarlineTypeEnum,
  BeamTypeEnum,
  BracketTypeEnum,
  ClefTypeEnum,
  KeySignatureTypeEnum,
  MusicScoreTypeEnum,
  NoteSymbolTypeEnum,
  TimeSignatureTypeEnum,
} from '@/enums/musicScoreEnum';
import type {Chronaxie, Frame} from '@/types/common';
import type {
  Accidental,
  AugmentationDot,
  Barline,
  Clef,
  GrandStaff,
  KeySignature,
  Measure,
  MusicScore,
  NoteNumber,
  NoteRest,
  NotesInfo,
  NotesNumberInfo,
  NoteSymbol,
  SingleStaff,
  StaffSlot,
  TimeSignature,
} from '@/types/MusicScoreType';
import {isNoteRest, isNoteSymbol} from '@/standardStaff/render/utils/staffSlot';

// —— 常量 ——

export const ZERO_FRAME: Frame = {
  relativeX: 0,
  relativeY: 0,
  relativeW: 0,
  relativeH: 0,
};

/** 全音符=256 … 六十四分=4 */
export const CHRONAXIES: Chronaxie[] = [256, 128, 64, 32, 16, 8, 4, 2, 1];

export const DEFAULT_SPACING = {
  grandStaff: {uSpace: 40, dSpace: 40},
  singleStaff: {uSpaceI: 20, dSpaceI: 20, uSpaceO: 20, dSpaceO: 20},
  measureWidthRatioForMeasure: 100,
  noteWidthRatio: 6,
} as const;

// —— 路径 ——

export type GrandStaffPath = {
  grandStaffIndex: number;
};

export type SingleStaffPath = GrandStaffPath & {
  singleStaffIndex: number;
};

export type MeasurePath = SingleStaffPath & {
  measureIndex: number;
};

export type NotePath = MeasurePath & {
  noteIndex: number;
};

// —— 选项 ——

export type CreateMusicScoreOptions = Partial<
  Pick<MusicScore, 'id' | 'type' | 'title' | 'bpm' | 'width' | 'height' | 'topSpaceHeight'>
>;

export type InsertGrandStaffOptions = Partial<
  Pick<GrandStaff, 'uSpace' | 'dSpace' | 'linkedStaff' | 'bracket'>
> & {
  /** 默认 true：同时创建一个带空小节的单谱表 */
  withDefaultStaff?: boolean;
  at?: number;
};

export type InsertSingleStaffOptions = Partial<
  Pick<SingleStaff, 'uSpaceI' | 'dSpaceI' | 'uSpaceO' | 'dSpaceO'>
> & {
  withDefaultMeasure?: boolean;
  at?: number;
};

export type InsertMeasureOptions = Partial<Measure> & {
  at?: number;
  /** 默认 true：从前一小节复制谱号 / 拍号 / 调号（新 id） */
  inheritFromPrev?: boolean;
  clef?: ClefTypeEnum;
  timeSignature?: TimeSignatureTypeEnum;
  keySignature?: KeySignatureTypeEnum;
  barline?: BarlineTypeEnum;
  widthRatioForMeasure?: number;
};

export type InsertNoteInfoOptions = {
  region: number;
  chronaxie?: Chronaxie;
  direction?: 'up' | 'down';
  beamType?: BeamTypeEnum;
  accidental?: AccidentalTypeEnum;
  augmentationDot?: AugmentationDot;
  affiliatedSymbols?: NotesInfo['affiliatedSymbols'];
};

export type InsertNoteOptions = {
  widthRatio?: number;
  widthRatioForMeasure?: number;
  clef?: ClefTypeEnum;
  at?: number;
  /** 单音 / 和弦：直接写入 notesInfo */
  notesInfo?: InsertNoteInfoOptions[];
  /** 简写：单声部单音 */
  region?: number;
  chronaxie?: Chronaxie;
  direction?: 'up' | 'down';
  beamType?: BeamTypeEnum;
  accidental?: AccidentalTypeEnum;
};

export type InsertRestOptions = {
  chronaxie?: Chronaxie;
  widthRatio?: number;
  widthRatioForMeasure?: number;
  clef?: ClefTypeEnum;
  augmentationDot?: AugmentationDot;
  affiliatedSymbols?: NoteRest['affiliatedSymbols'];
  at?: number;
};

export type InsertNoteNumberOptions = {
  syllable: NotesNumberInfo['syllable'];
  chronaxie?: Chronaxie;
  octaveDot?: NotesNumberInfo['octaveDot'];
  beamType?: BeamTypeEnum;
  accidental?: AccidentalTypeEnum;
  widthRatio?: number;
  widthRatioForMeasure?: number;
  at?: number;
  /** 和弦：多个音级 */
  notesInfo?: Array<{
    syllable: NotesNumberInfo['syllable'];
    octaveDot?: NotesNumberInfo['octaveDot'];
    accidental?: AccidentalTypeEnum;
  }>;
};

// —— 内部工具 ——

export function newId(): string {
  return crypto.randomUUID();
}

function assertIndex(name: string, index: number, length: number): void {
  if (index < 0 || index >= length) {
    throw new RangeError(`${name} 索引 ${index} 越界（长度 ${length}）`);
  }
}

function resolveGrandStaff(score: MusicScore, path: GrandStaffPath): GrandStaff {
  assertIndex('grandStaffIndex', path.grandStaffIndex, score.grandStaffs.length);
  return score.grandStaffs[path.grandStaffIndex]!;
}

function resolveSingleStaff(score: MusicScore, path: SingleStaffPath): SingleStaff {
  const gs = resolveGrandStaff(score, path);
  assertIndex('singleStaffIndex', path.singleStaffIndex, gs.staves.length);
  return gs.staves[path.singleStaffIndex]!;
}

function resolveMeasure(score: MusicScore, path: MeasurePath): Measure {
  const staff = resolveSingleStaff(score, path);
  assertIndex('measureIndex', path.measureIndex, staff.measures.length);
  return staff.measures[path.measureIndex]!;
}

function resolveNote(score: MusicScore, path: NotePath): NoteSymbol {
  const measure = resolveMeasure(score, path);
  assertIndex('noteIndex', path.noteIndex, measure.notes.length);
  const slot = measure.notes[path.noteIndex]!;
  if (!isNoteSymbol(slot)) {
    throw new TypeError(`notes[${path.noteIndex}] 不是 NoteSymbol（可能是 NoteRest 或 NoteNumber）`);
  }
  return slot;
}

function resolveRest(score: MusicScore, path: NotePath): NoteRest {
  const measure = resolveMeasure(score, path);
  assertIndex('noteIndex', path.noteIndex, measure.notes.length);
  const slot = measure.notes[path.noteIndex]!;
  if (!isNoteRest(slot)) {
    throw new TypeError(`notes[${path.noteIndex}] 不是 NoteRest`);
  }
  return slot;
}

export function isNoteNumber(note: StaffSlot | NoteNumber): note is NoteNumber {
  return !('type' in note);
}

function defaultDirection(region: number): 'up' | 'down' {
  return region > 4 ?'down' : 'up';
}

// —— 工厂（可单独用于 measure 字段赋值） ——

export function createClef(
  clefType: ClefTypeEnum,
  partial?: Partial<Clef>,
): Clef {
  return {
    ...ZERO_FRAME,
    id: newId(),
    type: clefType,
    widthRatio: 10,
    widthRatioForMeasure: 18,
    ...partial,
  };
}

export function createBarline(
  barlineType: BarlineTypeEnum,
  partial?: Partial<Barline>,
): Barline {
  return {
    ...ZERO_FRAME,
    id: newId(),
    type: barlineType,
    widthRatio: 4,
    widthRatioForMeasure: 4,
    ...partial,
  };
}

export function createTimeSignature(
  type: TimeSignatureTypeEnum,
  partial?: Partial<TimeSignature>,
): TimeSignature {
  return {
    ...ZERO_FRAME,
    id: newId(),
    type,
    widthRatio: 14,
    widthRatioForMeasure: 14,
    ...partial,
  };
}

export function createKeySignature(
  type: KeySignatureTypeEnum,
  partial?: Partial<KeySignature>,
): KeySignature {
  return {
    ...ZERO_FRAME,
    id: newId(),
    type,
    widthRatio: 10,
    widthRatioForMeasure: 10,
    ...partial,
  };
}

export function createAccidental(
  type: AccidentalTypeEnum,
  partial?: Partial<Accidental>,
): Accidental {
  return {
    ...ZERO_FRAME,
    id: newId(),
    type,
    widthRatio: 2,
    widthRatioForMeasure: 2,
    ...partial,
  };
}

export function createNotesInfo(opts: InsertNoteInfoOptions): NotesInfo {
  const chronaxie = opts.chronaxie ?? 64;
  return {
    ...ZERO_FRAME,
    id: newId(),
    region: opts.region,
    chronaxie,
    direction: opts.direction ?? defaultDirection(opts.region),
    beamType: opts.beamType ?? BeamTypeEnum.None,
    affiliatedSymbols: opts.affiliatedSymbols ?? [],
    ...(opts.accidental != null ? {accidental: createAccidental(opts.accidental)} : {}),
    ...(opts.augmentationDot ? {augmentationDot: opts.augmentationDot} : {}),
  };
}

export function createNoteSymbol(opts: InsertNoteOptions = {}): NoteSymbol {
  const widthRatio = opts.widthRatio ?? DEFAULT_SPACING.noteWidthRatio;
  const widthRatioForMeasure = opts.widthRatioForMeasure ?? widthRatio;

  let notesInfo: NotesInfo[];
  if (opts.notesInfo?.length) {
    notesInfo = opts.notesInfo.map((ni) => createNotesInfo(ni));
  } else if (opts.region != null) {
    notesInfo = [
      createNotesInfo({
        region: opts.region,
        chronaxie: opts.chronaxie,
        direction: opts.direction,
        beamType: opts.beamType,
        accidental: opts.accidental,
      }),
    ];
  } else {
    throw new Error('insertNote / createNoteSymbol：请提供 region 或 notesInfo');
  }

  const note: NoteSymbol = {
    ...ZERO_FRAME,
    id: newId(),
    type: NoteSymbolTypeEnum.Note,
    notesInfo,
    widthRatio,
    widthRatioForMeasure,
  };
  if (opts.clef != null) {
    note.clef = createClef(opts.clef);
  }
  return note;
}

export function createNoteRest(opts: InsertRestOptions = {}): NoteRest {
  const widthRatio = opts.widthRatio ?? DEFAULT_SPACING.noteWidthRatio;
  const rest: NoteRest = {
    ...ZERO_FRAME,
    id: newId(),
    type: NoteSymbolTypeEnum.Rest,
    chronaxie: opts.chronaxie ?? 64,
    affiliatedSymbols: opts.affiliatedSymbols ?? [],
    widthRatio,
    widthRatioForMeasure: opts.widthRatioForMeasure ?? widthRatio,
    ...(opts.augmentationDot ? {augmentationDot: opts.augmentationDot} : {}),
  };
  if (opts.clef != null) {
    rest.clef = createClef(opts.clef);
  }
  return rest;
}

export function createNotesNumberInfo(
  syllable: NotesNumberInfo['syllable'],
  partial?: Partial<Pick<NotesNumberInfo, 'octaveDot' | 'accidental'>>,
): NotesNumberInfo {
  return {
    id: newId(),
    syllable,
    octaveDot: partial?.octaveDot ?? 0,
    ...(partial?.accidental != null
      ? {accidental: typeof partial.accidental === 'object' ? partial.accidental : createAccidental(partial.accidental)}
      : {}),
  };
}

export function createNoteNumber(opts: InsertNoteNumberOptions): NoteNumber {
  const widthRatio = opts.widthRatio ?? DEFAULT_SPACING.noteWidthRatio;
  const chronaxie = opts.chronaxie ?? 64;

  let notesInfo: NotesNumberInfo[];
  if (opts.notesInfo?.length) {
    notesInfo = opts.notesInfo.map((ni) =>
      createNotesNumberInfo(ni.syllable, {
        octaveDot: ni.octaveDot,
        accidental: ni.accidental != null ? createAccidental(ni.accidental) : undefined,
      }),
    );
  } else {
    notesInfo = [
      createNotesNumberInfo(opts.syllable, {
        octaveDot: opts.octaveDot,
        accidental: opts.accidental != null ? createAccidental(opts.accidental) : undefined,
      }),
    ];
  }

  return {
    ...ZERO_FRAME,
    id: newId(),
    chronaxie,
    notesInfo,
    beamType: opts.beamType ?? BeamTypeEnum.None,
    affiliatedSymbols: [],
    widthRatio,
    widthRatioForMeasure: opts.widthRatioForMeasure ?? widthRatio,
  };
}

export function createEmptyMeasure(partial?: InsertMeasureOptions): Measure {
  const {
    inheritFromPrev: _inherit,
    clef,
    timeSignature,
    keySignature,
    barline,
    at: _at,
    ...rest
  } = partial ?? {};

  const measure: Measure = {
    ...ZERO_FRAME,
    id: newId(),
    notes: [],
    affiliatedSymbols: [],
    widthRatioForMeasure:
      partial?.widthRatioForMeasure ?? DEFAULT_SPACING.measureWidthRatioForMeasure,
    barline_b: createBarline(barline ?? BarlineTypeEnum.Single_barline),
    ...rest,
  };

  if (clef != null) {
    measure.clef_f = createClef(clef);
  }
  if (timeSignature != null) {
    measure.timeSignature_f = createTimeSignature(timeSignature);
  }
  if (keySignature != null) {
    measure.keySignature_f = createKeySignature(keySignature);
  }

  return measure;
}

function cloneMeasureHeaderFromPrev(prev: Measure): Pick<Measure, 'clef_f' | 'timeSignature_f' | 'keySignature_f'> {
  const header: Pick<Measure, 'clef_f' | 'timeSignature_f' | 'keySignature_f'> = {};
  if (prev.clef_f) {
    header.clef_f = createClef(prev.clef_f.type, {
      widthRatio: prev.clef_f.widthRatio,
      widthRatioForMeasure: prev.clef_f.widthRatioForMeasure,
    });
  }
  if (prev.timeSignature_f) {
    header.timeSignature_f = createTimeSignature(prev.timeSignature_f.type, {
      widthRatio: prev.timeSignature_f.widthRatio,
      widthRatioForMeasure: prev.timeSignature_f.widthRatioForMeasure,
    });
  }
  if (prev.keySignature_f) {
    header.keySignature_f = createKeySignature(prev.keySignature_f.type, {
      widthRatio: prev.keySignature_f.widthRatio,
      widthRatioForMeasure: prev.keySignature_f.widthRatioForMeasure,
    });
  }
  return header;
}

export function createSingleStaff(partial?: InsertSingleStaffOptions): SingleStaff {
  const withDefaultMeasure = partial?.withDefaultMeasure !== false;
  const {withDefaultMeasure: _w, at: _at, ...rest} = partial ?? {};
  return {
    ...ZERO_FRAME,
    id: newId(),
    measures: withDefaultMeasure ? [createEmptyMeasure({
      clef: ClefTypeEnum.Treble,
      timeSignature: TimeSignatureTypeEnum['4_4']
    })] : [],
    uSpaceI: partial?.uSpaceI ?? DEFAULT_SPACING.singleStaff.uSpaceI,
    dSpaceI: partial?.dSpaceI ?? DEFAULT_SPACING.singleStaff.dSpaceI,
    uSpaceO: partial?.uSpaceO ?? DEFAULT_SPACING.singleStaff.uSpaceO,
    dSpaceO: partial?.dSpaceO ?? DEFAULT_SPACING.singleStaff.dSpaceO,
    ...rest,
  };
}

export function createGrandStaff(partial?: InsertGrandStaffOptions): GrandStaff {
  const withDefaultStaff = partial?.withDefaultStaff !== false;
  const {withDefaultStaff: _w, at: _at, ...rest} = partial ?? {};
  return {
    ...ZERO_FRAME,
    id: newId(),
    staves: withDefaultStaff ? [createSingleStaff()] : [],
    uSpace: partial?.uSpace ?? DEFAULT_SPACING.grandStaff.uSpace,
    dSpace: partial?.dSpace ?? DEFAULT_SPACING.grandStaff.dSpace,
    ...rest,
  };
}

// —— 插入 API ——

export function createMusicScore(options: CreateMusicScoreOptions = {}): MusicScore {
  return {
    id: options.id ?? newId(),
    type: options.type ?? MusicScoreTypeEnum.StandardStaff,
    title: options.title ?? '',
    bpm: options.bpm ?? 120,
    topSpaceHeight: options.topSpaceHeight ?? 0,
    width: options.width ?? 800,
    height: options.height ?? 400,
    grandStaffs: [],
    affiliatedSymbols: [],
  };
}

export function insertGrandStaff(
  score: MusicScore,
  options: InsertGrandStaffOptions = {},
): GrandStaffPath {
  const staff = createGrandStaff(options);
  const at = options.at ?? score.grandStaffs.length;
  score.grandStaffs.splice(at, 0, staff);
  return {grandStaffIndex: at};
}

export function insertSingleStaff(
  score: MusicScore,
  path: GrandStaffPath,
  options: InsertSingleStaffOptions = {},
): SingleStaffPath {
  const gs = resolveGrandStaff(score, path);
  const singleStaff = createSingleStaff(options);
  const at = options.at ?? gs.staves.length;
  gs.staves.splice(at, 0, singleStaff);
  return {...path, singleStaffIndex: at};
}

export function insertMeasure(
  score: MusicScore,
  path: SingleStaffPath,
  options: InsertMeasureOptions = {},
): MeasurePath {
  const staff = resolveSingleStaff(score, path);
  const at = options.at ?? staff.measures.length;
  const inherit = options.inheritFromPrev !== false && at > 0;

  const {
    inheritFromPrev: _i,
    clef,
    timeSignature,
    keySignature,
    barline,
    at: _at,
    ...rest
  } = options;

  let measure = createEmptyMeasure({
    clef,
    timeSignature,
    keySignature,
    barline,
    widthRatioForMeasure: options.widthRatioForMeasure,
    ...rest,
  });

  if (inherit) {
    const prev = staff.measures[at - 1]!;
    const header = cloneMeasureHeaderFromPrev(prev);
    measure.clef_f = measure.clef_f ?? header.clef_f;
    measure.timeSignature_f = measure.timeSignature_f ?? header.timeSignature_f;
    measure.keySignature_f = measure.keySignature_f ?? header.keySignature_f;
  }

  staff.measures.splice(at, 0, measure);
  return {...path, measureIndex: at};
}

/** 设置小节前置/后置元素 */
export function setMeasureClef(
  score: MusicScore,
  path: MeasurePath,
  clefType: ClefTypeEnum,
  position: 'f' | 'b' = 'f',
): void {
  const measure = resolveMeasure(score, path);
  const clef = createClef(clefType);
  if (position === 'f') measure.clef_f = clef;
  else measure.clef_b = clef;
}

export function setMeasureTimeSignature(
  score: MusicScore,
  path: MeasurePath,
  type: TimeSignatureTypeEnum,
  position: 'f' | 'b' = 'f',
): void {
  const measure = resolveMeasure(score, path);
  const ts = createTimeSignature(type);
  if (position === 'f') measure.timeSignature_f = ts;
  else measure.timeSignature_b = ts;
}

export function setMeasureKeySignature(
  score: MusicScore,
  path: MeasurePath,
  type: KeySignatureTypeEnum,
  position: 'f' | 'b' = 'f',
): void {
  const measure = resolveMeasure(score, path);
  const ks = createKeySignature(type);
  if (position === 'f') measure.keySignature_f = ks;
  else measure.keySignature_b = ks;
}

export function setMeasureBarline(
  score: MusicScore,
  path: MeasurePath,
  barlineType: BarlineTypeEnum,
  position: 'f' | 'b' = 'b',
): void {
  const measure = resolveMeasure(score, path);
  const bar = createBarline(barlineType);
  if (position === 'f') measure.barline_f = bar;
  else measure.barline_b = bar;
}

export function insertNote(
  score: MusicScore,
  path: MeasurePath,
  options: InsertNoteOptions = {},
): NotePath {
  const measure = resolveMeasure(score, path);
  const note = createNoteSymbol(options);
  const at = options.at ?? measure.notes.length;
  measure.notes.splice(at, 0, note);
  return {...path, noteIndex: at};
}

export function insertRest(
  score: MusicScore,
  path: MeasurePath,
  options: InsertRestOptions = {},
): NotePath {
  const measure = resolveMeasure(score, path);
  const rest = createNoteRest(options);
  const at = options.at ?? measure.notes.length;
  measure.notes.splice(at, 0, rest);
  return {...path, noteIndex: at};
}

/** 向已有音符位追加一个声部 / 和弦音 */
export function insertNoteInfo(
  score: MusicScore,
  path: NotePath,
  options: InsertNoteInfoOptions,
): void {
  const note = resolveNote(score, path);
  note.notesInfo.push(createNotesInfo(options));
}

/** 修改已有 notesInfo（按声部索引） */
export function updateNoteInfo(
  score: MusicScore,
  path: NotePath & { notesInfoIndex: number },
  patch: Partial<InsertNoteInfoOptions>,
): void {
  const note = resolveNote(score, path);
  const ni = note.notesInfo[path.notesInfoIndex];
  if (!ni) {
    throw new RangeError(`notesInfoIndex ${path.notesInfoIndex} 越界`);
  }
  if (patch.region != null) ni.region = patch.region;
  if (patch.chronaxie != null) ni.chronaxie = patch.chronaxie;
  if (patch.direction != null) ni.direction = patch.direction;
  if (patch.beamType != null) ni.beamType = patch.beamType;
  if (patch.accidental != null) ni.accidental = createAccidental(patch.accidental);
}

export function insertNoteNumber(
  score: MusicScore,
  path: MeasurePath,
  options: InsertNoteNumberOptions,
): NotePath {
  const measure = resolveMeasure(score, path);
  const note = createNoteNumber(options);
  const at = options.at ?? measure.notes.length;
  measure.notes.splice(at, 0, note);
  return {...path, noteIndex: at};
}

export function insertNotesNumberInfo(
  score: MusicScore,
  path: NotePath,
  options: {
    syllable: NotesNumberInfo['syllable'];
    octaveDot?: NotesNumberInfo['octaveDot'];
    accidental?: AccidentalTypeEnum;
  },
): void {
  const measure = resolveMeasure(score, path);
  const raw = measure.notes[path.noteIndex];
  if (!isNoteNumber(raw)) {
    throw new TypeError('insertNotesNumberInfo 仅用于简谱 NoteNumber');
  }
  raw.notesInfo.push(
    createNotesNumberInfo(options.syllable, {
      octaveDot: options.octaveDot,
      accidental: options.accidental != null ? createAccidental(options.accidental) : undefined,
    }),
  );
}

export function insertBracket(
  score: MusicScore,
  path: GrandStaffPath,
  bracketType: BracketTypeEnum,
  startSingleStaffIndex = 0,
): void {
  const gs = resolveGrandStaff(score, path);
  gs.bracket = {
    ...ZERO_FRAME,
    id: newId(),
    type: bracketType,
    startSingleStaffIndex,
  };
}

// —— 读取辅助 ——

export function getGrandStaff(score: MusicScore, index: number): GrandStaff {
  return resolveGrandStaff(score, {grandStaffIndex: index});
}

export function getSingleStaff(score: MusicScore, path: SingleStaffPath): SingleStaff {
  return resolveSingleStaff(score, path);
}

export function getMeasure(score: MusicScore, path: MeasurePath): Measure {
  return resolveMeasure(score, path);
}

export function getSlot(score: MusicScore, path: NotePath): StaffSlot | NoteNumber {
  const measure = resolveMeasure(score, path);
  return measure.notes[path.noteIndex]!;
}

export function getNote(score: MusicScore, path: NotePath): NoteSymbol {
  return resolveNote(score, path);
}

export function getRest(score: MusicScore, path: NotePath): NoteRest {
  return resolveRest(score, path);
}
