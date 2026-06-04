import type {Chronaxie} from 'deciphony-renderer';
import type {
  Accidental,
  AugmentationDot,
  Barline,
  Bracket,
  Clef,
  DoubleMeasureAffiliatedSymbol,
  DoubleNoteAffiliatedSymbol,
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
} from 'deciphony-renderer';
import type {
  AccidentalTypeEnum,
  BarlineTypeEnum,
  BeamTypeEnum,
  BracketTypeEnum,
  ClefTypeEnum,
  KeySignatureTypeEnum,
  MeasureEndRepeatEnum,
  MeasureStartRepeatEnum,
  TimeSignatureTypeEnum,
} from 'deciphony-renderer';

// —— 树路径（索引定位，供 insert / edit 使用）——

export type GrandStaffPath = {grandStaffIndex: number};

export type SingleStaffPath = GrandStaffPath & {singleStaffIndex: number};

export type MeasurePath = SingleStaffPath & {measureIndex: number};

export type NotePath = MeasurePath & {noteIndex: number};

export type NotesInfoPath = NotePath & {notesInfoIndex: number};

/** 引用定位结果：编辑层用对象引用反查索引 */
export type LocatedGrandStaff = GrandStaffPath & {grandStaff: GrandStaff};

export type LocatedSingleStaff = SingleStaffPath & {
  grandStaff: GrandStaff;
  singleStaff: SingleStaff;
};

export type LocatedMeasure = MeasurePath & {
  grandStaff: GrandStaff;
  singleStaff: SingleStaff;
  measure: Measure;
};

export type LocatedNoteSlot = NotePath & {
  grandStaff: GrandStaff;
  singleStaff: SingleStaff;
  measure: Measure;
  slot: StaffSlot | NoteNumber;
};

export type LocatedNotesInfo = NotesInfoPath & {
  grandStaff: GrandStaff;
  singleStaff: SingleStaff;
  measure: Measure;
  note: NoteSymbol;
  notesInfo: NotesInfo;
};

// —— 创建选项 ——

export type CreateMusicScoreOptions = Partial<
  Pick<MusicScore, 'id' | 'type' | 'title' | 'bpm' | 'width' | 'height' | 'topSpaceHeight'>
>;

export type CreateGrandStaffOptions = Partial<
  Pick<GrandStaff, 'uSpace' | 'dSpace' | 'linkedStaff' | 'bracket'>
> & {
  withDefaultStaff?: boolean;
};

export type CreateSingleStaffOptions = Partial<
  Pick<SingleStaff, 'uSpaceI' | 'dSpaceI' | 'uSpaceO' | 'dSpaceO'>
> & {
  withDefaultMeasure?: boolean;
};

export type CreateMeasureOptions = {
  inheritFromPrev?: boolean;
  clef?: ClefTypeEnum;
  timeSignature?: TimeSignatureTypeEnum;
  keySignature?: KeySignatureTypeEnum;
  barline?: BarlineTypeEnum;
  widthRatioForMeasure?: number;
};

export type CreateNotesInfoOptions = {
  region: number;
  chronaxie?: Chronaxie;
  direction?: 'up' | 'down';
  beamType?: BeamTypeEnum;
  accidental?: AccidentalTypeEnum;
  augmentationDot?: AugmentationDot | AccidentalTypeEnum;
  affiliatedSymbols?: NotesInfo['affiliatedSymbols'];
};

export type CreateNoteSymbolOptions = {
  widthRatio?: number;
  widthRatioForMeasure?: number;
  clef?: ClefTypeEnum;
  notesInfo?: CreateNotesInfoOptions[];
  region?: number;
  chronaxie?: Chronaxie;
  direction?: 'up' | 'down';
  beamType?: BeamTypeEnum;
  accidental?: AccidentalTypeEnum;
  graceNotes?: CreateNotesInfoOptions[];
  graceNotesAfter?: CreateNotesInfoOptions[];
};

export type CreateNoteRestOptions = {
  chronaxie?: Chronaxie;
  widthRatio?: number;
  widthRatioForMeasure?: number;
  clef?: ClefTypeEnum;
  augmentationDot?: AugmentationDot | AccidentalTypeEnum;
  affiliatedSymbols?: NoteRest['affiliatedSymbols'];
};

export type CreateNoteNumberOptions = {
  syllable: NotesNumberInfo['syllable'];
  chronaxie?: Chronaxie;
  octaveDot?: NotesNumberInfo['octaveDot'];
  beamType?: BeamTypeEnum;
  accidental?: AccidentalTypeEnum;
  widthRatio?: number;
  widthRatioForMeasure?: number;
  notesInfo?: Array<{
    syllable: NotesNumberInfo['syllable'];
    octaveDot?: NotesNumberInfo['octaveDot'];
    accidental?: AccidentalTypeEnum;
  }>;
};

export type CreateSlurOptions = {
  startId: string;
  endId: string;
  partial?: Partial<DoubleNoteAffiliatedSymbol>;
};

export type FramePartial = Partial<Pick<Accidental | Clef, 'relativeX' | 'relativeY' | 'relativeW' | 'relativeH'>>;
