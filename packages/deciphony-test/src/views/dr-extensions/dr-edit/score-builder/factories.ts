import {
  AccidentalTypeEnum,
  BarlineTypeEnum,
  BeamTypeEnum,
  ClefTypeEnum,
  DoubleNoteAffiliatedSymbolNameEnum,
  KeySignatureTypeEnum,
  MeasureEndRepeatEnum,
  MeasureStartRepeatEnum,
  MusicScoreTypeEnum,
  NoteSymbolTypeEnum,
  TimeSignatureTypeEnum,
} from 'deciphony-renderer';
import type {
  Accidental,
  AugmentationDot,
  Barline,
  Bracket,
  Clef,
  DoubleNoteAffiliatedSymbol,
  GrandStaff,
  KeySignature,
  Measure,
  MeasureEndRepeat,
  MeasureStartRepeat,
  MusicScore,
  NoteNumber,
  NoteRest,
  NotesInfo,
  NotesNumberInfo,
  NoteSymbol,
  SingleStaff,
  TimeSignature,
} from 'deciphony-renderer';
import {DEFAULT_SPACING, DEFAULT_WIDTH_RATIO, ZERO_FRAME} from './constants';
import {newId} from './id';
import type {
  CreateGrandStaffOptions,
  CreateMeasureOptions,
  CreateMusicScoreOptions,
  CreateNoteNumberOptions,
  CreateNoteRestOptions,
  CreateNotesInfoOptions,
  CreateNoteSymbolOptions,
  CreateSingleStaffOptions,
  CreateSlurOptions,
  FramePartial,
} from './types';

function defaultDirection(region: number): 'up' | 'down' {
  return region >= 2 ? 'up' : 'down';
}

function resolveAccidental(
  input: AccidentalTypeEnum | Accidental | undefined,
): Accidental | undefined {
  if (input == null) return undefined;
  if (typeof input === 'object' && 'type' in input) return input;
  return createAccidental(input);
}

function resolveAugmentationDot(
  input: AugmentationDot | AccidentalTypeEnum | undefined,
): AugmentationDot | undefined {
  if (input == null) return undefined;
  if (typeof input === 'object' && 'count' in input) return input;
  return createAugmentationDot(input as 1 | 2 | 3);
}

// —— 曲谱 / 结构 ——

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

export function createGrandStaff(options: CreateGrandStaffOptions = {}): GrandStaff {
  const withDefaultStaff = options.withDefaultStaff !== false;
  return {
    ...ZERO_FRAME,
    id: newId(),
    staves: withDefaultStaff ? [createSingleStaff()] : [],
    uSpace: options.uSpace ?? DEFAULT_SPACING.grandStaff.uSpace,
    dSpace: options.dSpace ?? DEFAULT_SPACING.grandStaff.dSpace,
    linkedStaff: options.linkedStaff,
    bracket: options.bracket,
  };
}

export function createSingleStaff(options: CreateSingleStaffOptions = {}): SingleStaff {
  const withDefaultMeasure = options.withDefaultMeasure !== false;
  return {
    ...ZERO_FRAME,
    id: newId(),
    measures: withDefaultMeasure
      ? [createMeasure({clef: ClefTypeEnum.Treble, timeSignature: TimeSignatureTypeEnum['4_4']})]
      : [],
    uSpaceI: options.uSpaceI ?? DEFAULT_SPACING.singleStaff.uSpaceI,
    dSpaceI: options.dSpaceI ?? DEFAULT_SPACING.singleStaff.dSpaceI,
    uSpaceO: options.uSpaceO ?? DEFAULT_SPACING.singleStaff.uSpaceO,
    dSpaceO: options.dSpaceO ?? DEFAULT_SPACING.singleStaff.dSpaceO,
  };
}

export function createMeasure(options: CreateMeasureOptions = {}): Measure {
  const {clef, timeSignature, keySignature, barline, widthRatioForMeasure, ...frameRest} = options;
  const measure: Measure = {
    ...ZERO_FRAME,
    ...frameRest,
    id: newId(),
    notes: [],
    affiliatedSymbols: [],
    widthRatioForMeasure: widthRatioForMeasure ?? DEFAULT_SPACING.measureWidthRatioForMeasure,
    barline_b: createBarline(barline ?? BarlineTypeEnum.Single_barline),
  };
  if (clef != null) measure.clef_f = createClef(clef);
  if (timeSignature != null) measure.timeSignature_f = createTimeSignature(timeSignature);
  if (keySignature != null) measure.keySignature_f = createKeySignature(keySignature);
  return measure;
}

export function cloneMeasureHeaderFromPrev(
  prev: Measure,
): Pick<Measure, 'clef_f' | 'timeSignature_f' | 'keySignature_f'> {
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

// —— 小节前置/后置符号 ——

export function createClef(type: ClefTypeEnum, partial?: Partial<Clef> & FramePartial): Clef {
  return {
    ...ZERO_FRAME,
    id: newId(),
    type,
    widthRatio: partial?.widthRatio ?? DEFAULT_WIDTH_RATIO.clef.w,
    widthRatioForMeasure: partial?.widthRatioForMeasure ?? DEFAULT_WIDTH_RATIO.clef.wm,
    ...partial,
  };
}

export function createBarline(type: BarlineTypeEnum, partial?: Partial<Barline> & FramePartial): Barline {
  return {
    ...ZERO_FRAME,
    id: newId(),
    type,
    widthRatio: partial?.widthRatio ?? DEFAULT_WIDTH_RATIO.barline.w,
    widthRatioForMeasure: partial?.widthRatioForMeasure ?? DEFAULT_WIDTH_RATIO.barline.wm,
    ...partial,
  };
}

export function createTimeSignature(
  type: TimeSignatureTypeEnum,
  partial?: Partial<TimeSignature> & FramePartial,
): TimeSignature {
  return {
    ...ZERO_FRAME,
    id: newId(),
    type,
    widthRatio: partial?.widthRatio ?? DEFAULT_WIDTH_RATIO.timeSignature.w,
    widthRatioForMeasure: partial?.widthRatioForMeasure ?? DEFAULT_WIDTH_RATIO.timeSignature.wm,
    ...partial,
  };
}

export function createKeySignature(
  type: KeySignatureTypeEnum,
  partial?: Partial<KeySignature> & FramePartial,
): KeySignature {
  return {
    ...ZERO_FRAME,
    id: newId(),
    type,
    widthRatio: partial?.widthRatio ?? DEFAULT_WIDTH_RATIO.keySignature.w,
    widthRatioForMeasure: partial?.widthRatioForMeasure ?? DEFAULT_WIDTH_RATIO.keySignature.wm,
    ...partial,
  };
}

export function createMeasureStartRepeat(
  type: MeasureStartRepeatEnum,
  partial?: Partial<MeasureStartRepeat> & FramePartial,
): MeasureStartRepeat {
  return {...ZERO_FRAME, id: newId(), type, ...partial};
}

export function createMeasureEndRepeat(
  type: MeasureEndRepeatEnum,
  partial?: Partial<MeasureEndRepeat> & FramePartial,
): MeasureEndRepeat {
  return {...ZERO_FRAME, id: newId(), type, ...partial};
}

export function createBracket(
  type: import('deciphony-renderer').BracketTypeEnum,
  startSingleStaffIndex = 0,
  partial?: Partial<Bracket> & FramePartial,
): Bracket {
  return {
    ...ZERO_FRAME,
    id: newId(),
    type,
    startSingleStaffIndex,
    ...partial,
  };
}

// —— 音符 ——

export function createAccidental(type: AccidentalTypeEnum, partial?: Partial<Accidental> & FramePartial): Accidental {
  return {
    ...ZERO_FRAME,
    id: newId(),
    type,
    widthRatio: partial?.widthRatio ?? DEFAULT_WIDTH_RATIO.accidental.w,
    widthRatioForMeasure: partial?.widthRatioForMeasure ?? DEFAULT_WIDTH_RATIO.accidental.wm,
    ...partial,
  };
}

export function createAugmentationDot(
  count: 1 | 2 | 3,
  partial?: Partial<AugmentationDot> & FramePartial,
): AugmentationDot {
  return {
    ...ZERO_FRAME,
    id: newId(),
    count,
    widthRatio: partial?.widthRatio ?? DEFAULT_WIDTH_RATIO.augmentationDot.w,
    widthRatioForMeasure: partial?.widthRatioForMeasure ?? DEFAULT_WIDTH_RATIO.augmentationDot.wm,
    ...partial,
  };
}

export function createNotesInfo(options: CreateNotesInfoOptions): NotesInfo {
  const chronaxie = options.chronaxie ?? 64;
  const accidental = resolveAccidental(options.accidental);
  const augmentationDot = resolveAugmentationDot(options.augmentationDot);
  return {
    ...ZERO_FRAME,
    id: newId(),
    region: options.region,
    chronaxie,
    direction: options.direction ?? defaultDirection(options.region),
    beamType: options.beamType ?? BeamTypeEnum.None,
    affiliatedSymbols: options.affiliatedSymbols ?? [],
    ...(accidental ? {accidental} : {}),
    ...(augmentationDot ? {augmentationDot} : {}),
  };
}

function mapGraceList(list: CreateNotesInfoOptions[] | undefined): NotesInfo[] | undefined {
  if (!list?.length) return undefined;
  return list.map((g) => createNotesInfo(g));
}

export function createNoteSymbol(options: CreateNoteSymbolOptions = {}): NoteSymbol {
  const widthRatio = options.widthRatio ?? DEFAULT_SPACING.noteWidthRatio;
  const widthRatioForMeasure = options.widthRatioForMeasure ?? widthRatio;

  let notesInfo: NotesInfo[];
  if (options.notesInfo?.length) {
    notesInfo = options.notesInfo.map((ni) => createNotesInfo(ni));
  } else if (options.region != null) {
    notesInfo = [
      createNotesInfo({
        region: options.region,
        chronaxie: options.chronaxie,
        direction: options.direction,
        beamType: options.beamType,
        accidental: options.accidental,
      }),
    ];
  } else {
    throw new Error('createNoteSymbol：请提供 region 或 notesInfo');
  }

  const note: NoteSymbol = {
    ...ZERO_FRAME,
    id: newId(),
    type: NoteSymbolTypeEnum.Note,
    notesInfo,
    widthRatio,
    widthRatioForMeasure,
    graceNotes: mapGraceList(options.graceNotes),
    graceNotesAfter: mapGraceList(options.graceNotesAfter),
  };
  if (options.clef != null) {
    note.clef = createClef(options.clef);
  }
  return note;
}

export function createNoteRest(options: CreateNoteRestOptions = {}): NoteRest {
  const widthRatio = options.widthRatio ?? DEFAULT_SPACING.noteWidthRatio;
  const augmentationDot = resolveAugmentationDot(options.augmentationDot);
  const rest: NoteRest = {
    ...ZERO_FRAME,
    id: newId(),
    type: NoteSymbolTypeEnum.Rest,
    chronaxie: options.chronaxie ?? 64,
    affiliatedSymbols: options.affiliatedSymbols ?? [],
    widthRatio,
    widthRatioForMeasure: options.widthRatioForMeasure ?? widthRatio,
    ...(augmentationDot ? {augmentationDot} : {}),
  };
  if (options.clef != null) {
    rest.clef = createClef(options.clef);
  }
  return rest;
}

export function createNotesNumberInfo(
  syllable: NotesNumberInfo['syllable'],
  partial?: Partial<Pick<NotesNumberInfo, 'octaveDot' | 'accidental'>>,
): NotesNumberInfo {
  const accidental = partial?.accidental
    ? typeof partial.accidental === 'object'
      ? partial.accidental
      : createAccidental(partial.accidental)
    : undefined;
  return {
    id: newId(),
    syllable,
    octaveDot: partial?.octaveDot ?? 0,
    ...(accidental ? {accidental} : {}),
  };
}

export function createNoteNumber(options: CreateNoteNumberOptions): NoteNumber {
  const widthRatio = options.widthRatio ?? DEFAULT_SPACING.noteWidthRatio;
  const chronaxie = options.chronaxie ?? 64;

  let notesInfo: NotesNumberInfo[];
  if (options.notesInfo?.length) {
    notesInfo = options.notesInfo.map((ni) =>
      createNotesNumberInfo(ni.syllable, {octaveDot: ni.octaveDot, accidental: ni.accidental}),
    );
  } else {
    notesInfo = [
      createNotesNumberInfo(options.syllable, {
        octaveDot: options.octaveDot,
        accidental: options.accidental,
      }),
    ];
  }

  return {
    ...ZERO_FRAME,
    id: newId(),
    chronaxie,
    notesInfo,
    beamType: options.beamType ?? BeamTypeEnum.None,
    affiliatedSymbols: [],
    widthRatio,
    widthRatioForMeasure: options.widthRatioForMeasure ?? widthRatio,
  };
}

// —— 曲谱级附属 ——

/** 连音线 / 延音线：startId、endId 必须为 NotesInfo.id */
export function createSlur(options: CreateSlurOptions): DoubleNoteAffiliatedSymbol {
  const {startId, endId, partial} = options;
  return {
    ...ZERO_FRAME,
    id: partial?.id ?? newId(),
    name: DoubleNoteAffiliatedSymbolNameEnum.slur,
    startId,
    endId,
    data: {
      slur: {
        relativeStartPoint: {x: 0, y: 0},
        relativeEndPoint: {x: 0, y: 0},
        relativeControlPoint: {x: 0, y: 0},
        thickness: 2,
        ...partial?.data?.slur,
      },
    },
    ...partial,
  };
}
