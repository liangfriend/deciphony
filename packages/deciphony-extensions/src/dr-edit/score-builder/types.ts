import type {Chronaxie} from '@deciphony/renderer';
import type {
  Accidental,
  AugmentationDot,
  Barline,
  Bracket,
  Clef,
  DoubleMeasureAffiliatedSymbol,
  DoubleNoteAffiliatedSymbol,
  DoubleSlotAffiliatedSymbol,
  GrandStaff,
  KeySignature,
  Measure,
  MeasureNoteSlot,
  MusicScore,
  NoteNumber,
  NoteRest,
  NotesInfo,
  NotesNumberInfo,
  NoteSymbol,
  SingleSlotAffiliatedSymbol,
  SingleStaff,
  StaffSlot,
  TimeSignature,
} from '@deciphony/renderer';
import type {
  AccidentalTypeEnum,
  ArpeggioTypeEnum,
  BarlineTypeEnum,
  BeamTypeEnum,
  BracketTypeEnum,
  ClefTypeEnum,
  HairpinTypeEnum,
  KeySignatureTypeEnum,
  MeasureEndRepeatEnum,
  MeasureStartRepeatEnum,
  PedalTypeEnum,
  PitchTypeEnum,
  TimeSignatureTypeEnum,
  TrillTypeEnum,
} from '@deciphony/renderer';

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
  slot: MeasureNoteSlot;
};

export type LocatedSlotAffiliatedSymbol = LocatedNoteSlot & {
  symbolIndex: number;
  symbol: SingleSlotAffiliatedSymbol;
};

export type LocatedNotesInfo = NotesInfoPath & {
  grandStaff: GrandStaff;
  singleStaff: SingleStaff;
  measure: Measure;
  note: NoteSymbol;
  notesInfo: NotesInfo;
};

export type NotesNumberInfoPath = NotePath & {notesNumberInfoIndex: number};

export type LocatedNotesNumberInfo = NotesNumberInfoPath & {
  grandStaff: GrandStaff;
  singleStaff: SingleStaff;
  measure: Measure;
  note: NoteNumber;
  notesNumberInfo: NotesNumberInfo;
};

// —— 创建选项 ——

export type CreateMusicScoreOptions = Partial<
  Pick<
    MusicScore,
    | 'id'
    | 'type'
    | 'title'
    | 'description'
    | 'bpm'
    | 'beatUnit'
    | 'width'
    | 'height'
    | 'topSpaceHeight'
    | 'data'
    | 'keySignature'
    | 'timeSignature'
  >
> & {
  /** 小节号，默认创建（不带括号、Frame 全 0）；传 false 不加 */
  measureNumber?: Partial<import('@deciphony/renderer').MeasureNumber> | false;
};

export type CreateGrandStaffOptions = Partial<
  Pick<GrandStaff, 'uSpace' | 'dSpace' | 'linkedStaff' | 'bracket' | 'data'>
> & {
  withDefaultStaff?: boolean;
  notationType?: import('@deciphony/renderer').MusicScoreTypeEnum;
};

export type CreateSingleStaffOptions = Partial<
  Pick<SingleStaff, 'uSpaceI' | 'dSpaceI' | 'uSpaceO' | 'dSpaceO' | 'data'>
> & {
  withDefaultMeasure?: boolean;
  notationType?: import('@deciphony/renderer').MusicScoreTypeEnum;
};

export type CreateMeasureOptions = {
  inheritFromPrev?: boolean;
  clef?: ClefTypeEnum;
  timeSignature?: TimeSignatureTypeEnum;
  keySignature?: KeySignatureTypeEnum;
  barline?: BarlineTypeEnum;
  widthRatioForMeasure?: number;
  data?: Object;
  /** 鼓谱：notes 建为上下声部 `{up, down}` */
  voices?: boolean;
};

export type CreateNotesInfoOptions = {
  region: number;
  chronaxie?: Chronaxie;
  direction?: 'up' | 'down';
  /** 显式指定则优先生效；否则若提供 beamOnset 则按四分拍自动推断 */
  beamType?: BeamTypeEnum;
  /** 小节内 onset（chronaxie）；未指定 beamType 时用于 resolveAutoBeamType */
  beamOnset?: number;
  accidental?: AccidentalTypeEnum;
  augmentationDot?: AugmentationDot | 1 | 2 | 3;
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
  /** 透传给默认 notesInfo；未指定 beamType 时自动推算 */
  beamOnset?: number;
  accidental?: AccidentalTypeEnum;
  graceNotes?: CreateNotesInfoOptions[];
  graceNotesAfter?: CreateNotesInfoOptions[];
  lyrics?: import('@deciphony/renderer').Lyrics[];
  data?: Object;
};

export type CreateNoteRestOptions = {
  chronaxie?: Chronaxie;
  widthRatio?: number;
  widthRatioForMeasure?: number;
  clef?: ClefTypeEnum;
  augmentationDot?: AugmentationDot | 1 | 2 | 3;
  affiliatedSymbols?: NoteRest['affiliatedSymbols'];
  lyrics?: import('@deciphony/renderer').Lyrics[];
  data?: Object;
};

export type CreateNoteNumberOptions = {
  syllable: NotesNumberInfo['syllable'];
  /** 写入首个（或全部未指定时值的）notesInfo */
  chronaxie?: Chronaxie;
  octaveDot?: NotesNumberInfo['octaveDot'];
  beamType?: BeamTypeEnum;
  /** 未指定 beamType 时按四分拍自动推断 */
  beamOnset?: number;
  accidental?: AccidentalTypeEnum;
  augmentationDot?: AugmentationDot | 1 | 2 | 3;
  widthRatio?: number;
  widthRatioForMeasure?: number;
  lyrics?: import('@deciphony/renderer').Lyrics[];
  data?: Object;
  notesInfo?: Array<{
    syllable: NotesNumberInfo['syllable'];
    octaveDot?: NotesNumberInfo['octaveDot'];
    accidental?: AccidentalTypeEnum;
    chronaxie?: Chronaxie;
    beamType?: BeamTypeEnum;
    beamOnset?: number;
    augmentationDot?: AugmentationDot | 1 | 2 | 3;
  }>;
};

export type CreateSlurOptions = {
  startId: string;
  endId: string;
  partial?: Partial<DoubleNoteAffiliatedSymbol>;
};

export type CreateArpeggioOptions = {
  /** 小节高度（px）；默认 end 相对 start 上移该值 */
  measureHeight?: number;
  type?: ArpeggioTypeEnum;
  arrow?: boolean;
  partial?: Partial<SingleSlotAffiliatedSymbol>;
};

export type CreateStrummingOptions = {
  measureHeight?: number;
  arrow?: boolean;
  partial?: Partial<SingleSlotAffiliatedSymbol>;
};

/** 前奏括号（左 `(` / 右 `)`）；放入宿主 MeasureNoteSlot.affiliatedSymbols */
export type CreatePreludeBracketOptions = {
  partial?: Partial<SingleSlotAffiliatedSymbol>;
};

export type CreatePedalOptions = {
  /** 开始列 MeasureNoteSlot.id */
  startId: string;
  /** 结束列 MeasureNoteSlot.id */
  endId: string;
  type?: PedalTypeEnum;
  partial?: Partial<DoubleSlotAffiliatedSymbol>;
};

export type CreatePitchOptions = {
  /** 开始列 MeasureNoteSlot.id */
  startId: string;
  /** 结束列 MeasureNoteSlot.id */
  endId: string;
  direction: 'up' | 'down';
  type?: PitchTypeEnum;
  partial?: Partial<DoubleSlotAffiliatedSymbol>;
};

export type CreateTrillOptions = {
  /** 开始列 MeasureNoteSlot.id */
  startId: string;
  /** 结束列 MeasureNoteSlot.id */
  endId: string;
  type?: TrillTypeEnum;
  partial?: Partial<DoubleSlotAffiliatedSymbol>;
};

export type CreateHairpinOptions = {
  /** 开始列 MeasureNoteSlot.id */
  startId: string;
  /** 结束列 MeasureNoteSlot.id */
  endId: string;
  type?: HairpinTypeEnum;
  /** 楔形开口高度（px） */
  height?: number;
  partial?: Partial<DoubleSlotAffiliatedSymbol>;
};

export type FramePartial = Partial<Pick<Accidental | Clef, 'relativeX' | 'relativeY' | 'relativeW' | 'relativeH'>>;
