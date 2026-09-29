import {
    AccidentalTypeEnum,
    ArpeggioTypeEnum,
    BarlineTypeEnum,
    ClefTypeEnum,
    DoubleMeasureAffiliatedSymbolNameEnum,
    DoubleNoteAffiliatedSymbolNameEnum,
    DoubleSlotAffiliatedSymbolNameEnum,
    KeySignatureTypeEnum,
    MeasureEndRepeatEnum,
    MeasureStartRepeatEnum,
    MusicScoreTypeEnum,
    NoteSymbolTypeEnum,
    PedalTypeEnum,
    PitchTypeEnum,
    SingleSlotAffiliatedSymbolNameEnum,
    TimeSignatureTypeEnum,
} from '@deciphony/renderer';
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
    Lyrics,
    Measure,
    MeasureEndRepeat,
    MeasureNoteSlot,
    MeasureNoteSymbol,
    MeasureStartRepeat,
    MusicScore,
    NoteNumber,
    NoteRest,
    NotesInfo,
    NotesNumberInfo,
    NoteSymbol,
    SingleSlotAffiliatedSymbol,
    SingleStaff,
    TimeSignature,
} from '@deciphony/renderer';
import {DEFAULT_MEASURE_HEIGHT, DEFAULT_SPACING, DEFAULT_WIDTH_RATIO, ZERO_FRAME, defaultSingleSlotEndPoint} from './constants';
import {newId} from './id';
import {resolveDefaultBeamType} from './autoBeam';
import type {
    CreateArpeggioOptions,
    CreateGrandStaffOptions,
    CreateMeasureOptions,
    CreateMusicScoreOptions,
    CreateNoteNumberOptions,
    CreateNoteRestOptions,
    CreateNotesInfoOptions,
    CreateNoteSymbolOptions,
    CreatePedalOptions,
    CreatePitchOptions,
    CreateSingleStaffOptions,
    CreateSlurOptions,
    CreateStrummingOptions,
    FramePartial,
} from './types';

function defaultDirection(region: number): 'up' | 'down' {
  return region > 4 ? 'down' : 'up';
}

function resolveAccidental(
    input: AccidentalTypeEnum | Accidental | undefined,
): Accidental | undefined {
    if (input == null) return undefined;
    if (typeof input === 'object' && 'type' in input) return input;
    return createAccidental(input);
}

function resolveAugmentationDot(
    input: AugmentationDot | 1 | 2 | 3 | undefined,
): AugmentationDot | undefined {
    if (input == null) return undefined;
    if (typeof input === 'object') return input;
    return createAugmentationDot(input);
}

// —— 曲谱 / 结构 ——

export function createMusicScore(options: CreateMusicScoreOptions = {}): MusicScore {
    const type = options.type ?? MusicScoreTypeEnum.StandardStaff;
    const isNumberNotation = type === MusicScoreTypeEnum.NumberNotation;
    const score: MusicScore = {
        id: options.id ?? newId(),
        type,
        title: options.title ?? '',
        description: options.description ?? '',
        bpm: options.bpm ?? 120,
        topSpaceHeight: options.topSpaceHeight ?? 0,
        width: options.width ?? 800,
        height: options.height ?? 400,
        grandStaffs: [],
        affiliatedSymbols: [],
        data: options.data ?? {},
    };
    if (isNumberNotation) {
        score.keySignature = options.keySignature ?? KeySignatureTypeEnum.C;
        score.timeSignature = options.timeSignature ?? TimeSignatureTypeEnum['4_4'];
        score.beatUnit = options.beatUnit ?? 4;
    } else {
        score.beatUnit = options.beatUnit ?? 4;
        if (options.keySignature != null) score.keySignature = options.keySignature;
        if (options.timeSignature != null) score.timeSignature = options.timeSignature;
    }
    return score;
}

export function createGrandStaff(options: CreateGrandStaffOptions = {}): GrandStaff {
    const withDefaultStaff = options.withDefaultStaff !== false;
    return {
        ...ZERO_FRAME,
        id: newId(),
        staves: withDefaultStaff ? [createSingleStaff({notationType: options.notationType})] : [],
        uSpace: options.uSpace ?? DEFAULT_SPACING.grandStaff.uSpace,
        dSpace: options.dSpace ?? DEFAULT_SPACING.grandStaff.dSpace,
        linkedStaff: options.linkedStaff ?? true,
        bracket: options.bracket,
        data: options.data ?? {},
    };
}

export function createSingleStaff(options: CreateSingleStaffOptions = {}): SingleStaff {
    const withDefaultMeasure = options.withDefaultMeasure !== false;
    const isNumberNotation = options.notationType === MusicScoreTypeEnum.NumberNotation;
    const isTab =
        options.notationType === MusicScoreTypeEnum.Tab6 ||
        options.notationType === MusicScoreTypeEnum.Tab4;
    const isDrum = options.notationType === MusicScoreTypeEnum.DrumNotation;
    return {
        ...ZERO_FRAME,
        id: newId(),
        measures: withDefaultMeasure
            ? [createMeasure(
                isNumberNotation
                    ? {}
                    : isTab
                        ? {clef: ClefTypeEnum.Tab, timeSignature: TimeSignatureTypeEnum['4_4']}
                        : isDrum
                            ? {clef: ClefTypeEnum.Percussion, timeSignature: TimeSignatureTypeEnum['4_4'], voices: true}
                            : {clef: ClefTypeEnum.Treble, timeSignature: TimeSignatureTypeEnum['4_4']},
            )]
            : [],
        uSpaceI: options.uSpaceI ?? DEFAULT_SPACING.singleStaff.uSpaceI,
        dSpaceI: options.dSpaceI ?? DEFAULT_SPACING.singleStaff.dSpaceI,
        uSpaceO: options.uSpaceO ?? DEFAULT_SPACING.singleStaff.uSpaceO,
        dSpaceO: options.dSpaceO ?? DEFAULT_SPACING.singleStaff.dSpaceO,
        data: options.data ?? {},
    };
}

export function createMeasure(options: CreateMeasureOptions = {}): Measure {
    const {clef, timeSignature, keySignature, barline, widthRatioForMeasure, data, voices, ...frameRest} = options;
    const measure: Measure = {
        ...ZERO_FRAME,
        ...frameRest,
        id: newId(),
        notes: voices ? {up: [], down: []} : [],
        affiliatedSymbols: [],
        widthRatioForMeasure: widthRatioForMeasure ?? DEFAULT_SPACING.measureWidthRatioForMeasure,
        barline_b: createBarline(barline ?? BarlineTypeEnum.Single_barline),
        data: data ?? {},
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
    type: import('@deciphony/renderer').BracketTypeEnum,
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
    const beamType = resolveDefaultBeamType({
        beamType: options.beamType,
        beamOnset: options.beamOnset,
        chronaxie,
    });
    return {
        ...ZERO_FRAME,
        id: newId(),
        region: options.region,
        chronaxie,
        direction: options.direction ?? defaultDirection(options.region),
        beamType,
        affiliatedSymbols: options.affiliatedSymbols ?? [],
        ...(accidental ? {accidental} : {}),
        ...(augmentationDot ? {augmentationDot} : {}),
    };
}

/** 新建歌词项；缺省 Frame 归零 */
export function createLyrics(text = '', partial?: Partial<Omit<Lyrics, 'text'>>): Lyrics {
    return {
        ...ZERO_FRAME,
        text,
        ...partial,
    };
}

function mapGraceList(list: CreateNotesInfoOptions[] | undefined): NotesInfo[] | undefined {
    if (!list?.length) return undefined;
    return list.map((g) => createNotesInfo(g));
}

/** 新建歌词默认一行空歌词（g-d 高度全局共享，各谱表起步行数对齐） */
function defaultEmptyLyrics(): Lyrics[] {
    return [{
        text: '',
        relativeX: 0,
        relativeY: 0,
        relativeW: 0,
        relativeH: 0,
    }];
}

/** 包装槽内记谱体为小节音符槽（树节点：id + Frame） */
export function createMeasureNoteSlot(options: {
    symbol: MeasureNoteSymbol
    lyrics?: Lyrics[]
    affiliatedSymbols?: SingleSlotAffiliatedSymbol[]
    data?: Object
    widthRatio?: number
    widthRatioForMeasure?: number
    id?: string
    relativeX?: number
    relativeY?: number
    relativeW?: number
    relativeH?: number
}): MeasureNoteSlot {
    const widthRatio = options.widthRatio ?? DEFAULT_SPACING.noteWidthRatio;
    return {
        ...ZERO_FRAME,
        id: options.id ?? newId(),
        relativeX: options.relativeX ?? 0,
        relativeY: options.relativeY ?? 0,
        relativeW: options.relativeW ?? 0,
        relativeH: options.relativeH ?? 0,
        widthRatio,
        widthRatioForMeasure: options.widthRatioForMeasure ?? widthRatio,
        lyrics: options.lyrics ?? defaultEmptyLyrics(),
        affiliatedSymbols: options.affiliatedSymbols ?? [],
        data: options.data ?? {},
        symbol: options.symbol,
    };
}

export function createNoteSymbol(options: CreateNoteSymbolOptions = {}): MeasureNoteSlot {
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
                beamOnset: options.beamOnset,
                accidental: options.accidental,
            }),
        ];
    } else {
        throw new Error('createNoteSymbol：请提供 region 或 notesInfo');
    }

    const symbol: NoteSymbol = {
        ...ZERO_FRAME,
        id: newId(),
        type: NoteSymbolTypeEnum.Note,
        notesInfo,
        graceNotes: mapGraceList(options.graceNotes),
        graceNotesAfter: mapGraceList(options.graceNotesAfter),
    };
    if (options.clef != null) {
        symbol.clef = createClef(options.clef);
    }
    return createMeasureNoteSlot({
        symbol,
        lyrics: options.lyrics,
        data: options.data,
        widthRatio: options.widthRatio,
        widthRatioForMeasure: options.widthRatioForMeasure,
    });
}

export function createNoteRest(options: CreateNoteRestOptions = {}): MeasureNoteSlot {
    const augmentationDot = resolveAugmentationDot(options.augmentationDot);
    const symbol: NoteRest = {
        ...ZERO_FRAME,
        id: newId(),
        type: NoteSymbolTypeEnum.Rest,
        chronaxie: options.chronaxie ?? 64,
        affiliatedSymbols: options.affiliatedSymbols ?? [],
        ...(augmentationDot ? {augmentationDot} : {}),
    };
    if (options.clef != null) {
        symbol.clef = createClef(options.clef);
    }
    return createMeasureNoteSlot({
        symbol,
        lyrics: options.lyrics,
        data: options.data,
        widthRatio: options.widthRatio,
        widthRatioForMeasure: options.widthRatioForMeasure,
    });
}

export function createNotesNumberInfo(
    syllable: NotesNumberInfo['syllable'],
    partial?: Partial<Pick<NotesNumberInfo, 'octaveDot' | 'chronaxie' | 'beamType'>> & {
        accidental?: AccidentalTypeEnum | Accidental
        augmentationDot?: AugmentationDot | 1 | 2 | 3
        beamOnset?: number
    },
): NotesNumberInfo {
    const accidental = resolveAccidental(partial?.accidental);
    const augmentationDot = resolveAugmentationDot(partial?.augmentationDot);
    const chronaxie = partial?.chronaxie ?? 64;
    const beamType = resolveDefaultBeamType({
        beamType: partial?.beamType,
        beamOnset: partial?.beamOnset,
        chronaxie,
    });
    return {
        ...ZERO_FRAME,
        id: newId(),
        syllable,
        chronaxie,
        beamType,
        octaveDot: partial?.octaveDot ?? 0,
        ...(accidental ? {accidental} : {}),
        ...(augmentationDot ? {augmentationDot} : {}),
    };
}

export function createNoteNumber(options: CreateNoteNumberOptions): MeasureNoteSlot {
    const chronaxie = options.chronaxie ?? 64;
    const beamType = options.beamType;
    const beamOnset = options.beamOnset;
    const augmentationDot = resolveAugmentationDot(options.augmentationDot);

    let notesInfo: NotesNumberInfo[];
    if (options.notesInfo?.length) {
        notesInfo = options.notesInfo.map((ni) =>
            createNotesNumberInfo(ni.syllable, {
                octaveDot: ni.octaveDot,
                accidental: ni.accidental,
                chronaxie: ni.chronaxie ?? chronaxie,
                beamType: ni.beamType ?? beamType,
                beamOnset: ni.beamOnset ?? beamOnset,
                augmentationDot: ni.augmentationDot ?? augmentationDot,
            }),
        );
    } else {
        notesInfo = [
            createNotesNumberInfo(options.syllable, {
                octaveDot: options.octaveDot,
                accidental: options.accidental,
                chronaxie,
                beamType,
                beamOnset,
                augmentationDot,
            }),
        ];
    }

    const symbol: NoteNumber = {
        ...ZERO_FRAME,
        id: newId(),
        notesInfo,
        affiliatedSymbols: [],
    };
    return createMeasureNoteSlot({
        symbol,
        lyrics: options.lyrics,
        data: options.data,
        widthRatio: options.widthRatio,
        widthRatioForMeasure: options.widthRatioForMeasure,
    });
}

// —— 曲谱级附属 ——

export type CreateVoltaOptions = {
    startId: string;
    endId: string;
    text?: string;
    value?: number[];
    partial?: Partial<DoubleMeasureAffiliatedSymbol> & FramePartial;
};

/** 反复房子 volta：startId / endId 为小节 id */
export function createVolta(options: CreateVoltaOptions): DoubleMeasureAffiliatedSymbol {
    const {startId, endId, text = '1.', value = [0], partial} = options;
    return {
        ...ZERO_FRAME,
        id: newId(),
        name: DoubleMeasureAffiliatedSymbolNameEnum.Volta,
        startId,
        endId,
        data: {
            volta: {
                text,
                value,
                ...partial?.data?.volta,
            },
        },
        ...partial,
    };
}

/** 连音线 / 延音线：startId、endId 必须为 NotesInfo.id */
export function createSlur(options: CreateSlurOptions): DoubleNoteAffiliatedSymbol {
    const {startId, endId, partial} = options;
    return {
        ...ZERO_FRAME,
        id: partial?.id ?? newId(),
        name: DoubleNoteAffiliatedSymbolNameEnum.Slur,
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

/**
 * 单 slot 琶音：放入宿主 MeasureNoteSlot.affiliatedSymbols。
 * 两端默认同锚点；relativeEndPoint.y = -measureHeight，避免创建时挤成一点。
 */
export function createArpeggio(options: CreateArpeggioOptions = {}): SingleSlotAffiliatedSymbol {
    const {
        measureHeight = DEFAULT_MEASURE_HEIGHT,
        type = ArpeggioTypeEnum.Normal,
        arrow = true,
        partial,
    } = options;
    const {data: partialData, id: partialId, name: _name, ...rest} = partial ?? {};
    return {
        ...ZERO_FRAME,
        ...rest,
        id: partialId ?? newId(),
        name: SingleSlotAffiliatedSymbolNameEnum.Arpeggio,
        data: {
            arpeggio: {
                relativeStartPoint: {x: 0, y: 0},
                relativeEndPoint: defaultSingleSlotEndPoint(measureHeight),
                arrow,
                type,
                ...partialData?.arpeggio,
            },
        },
    };
}

/**
 * 单 slot 扫弦：放入宿主 MeasureNoteSlot.affiliatedSymbols。
 * 默认 relativeEndPoint.y = -measureHeight。
 */
export function createStrumming(options: CreateStrummingOptions = {}): SingleSlotAffiliatedSymbol {
    const {
        measureHeight = DEFAULT_MEASURE_HEIGHT,
        arrow = true,
        partial,
    } = options;
    const {data: partialData, id: partialId, name: _name, ...rest} = partial ?? {};
    return {
        ...ZERO_FRAME,
        ...rest,
        id: partialId ?? newId(),
        name: SingleSlotAffiliatedSymbolNameEnum.Strumming,
        data: {
            strumming: {
                relativeStartPoint: {x: 0, y: 0},
                relativeEndPoint: defaultSingleSlotEndPoint(measureHeight),
                arrow,
                ...partialData?.strumming,
            },
        },
    };
}

/**
 * 双 slot 踏板：startId / endId = MeasureNoteSlot.id。
 * 默认锚点 x=各 slot 列起点、y=小节底；相对端点归零。
 */
export function createPedal(options: CreatePedalOptions): DoubleSlotAffiliatedSymbol {
    const {
        startId,
        endId,
        type = PedalTypeEnum.Normal,
        partial,
    } = options;
    const {data: partialData, id: partialId, name: _name, startId: _s, endId: _e, ...rest} = partial ?? {};
    return {
        ...ZERO_FRAME,
        ...rest,
        id: partialId ?? newId(),
        name: DoubleSlotAffiliatedSymbolNameEnum.Pedal,
        startId,
        endId,
        data: {
            pedal: {
                relativeStartPoint: {x: 0, y: 0},
                relativeEndPoint: {x: 0, y: 0},
                type,
                ...partialData?.pedal,
            },
        },
    };
}

/**
 * 双 slot 八度记号：startId / endId = MeasureNoteSlot.id。
 * direction 决定 Pitch_up / Pitch_down。
 */
export function createPitch(options: CreatePitchOptions): DoubleSlotAffiliatedSymbol {
    const {
        startId,
        endId,
        direction,
        type = PitchTypeEnum['8va'],
        partial,
    } = options;
    const {data: partialData, id: partialId, name: _name, startId: _s, endId: _e, ...rest} = partial ?? {};
    const name = direction === 'up'
        ? DoubleSlotAffiliatedSymbolNameEnum.Pitch_up
        : DoubleSlotAffiliatedSymbolNameEnum.Pitch_down;
    return {
        ...ZERO_FRAME,
        ...rest,
        id: partialId ?? newId(),
        name,
        startId,
        endId,
        data: {
            pitch: {
                relativeStartPoint: {x: 0, y: 0},
                relativeEndPoint: {x: 0, y: 0},
                type,
                ...partialData?.pitch,
            },
        },
    };
}
