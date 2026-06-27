import {
    BarlineTypeEnum,
    BracketTypeEnum,
    TabNoteInfoTypeEnum,
    TimeSignatureTypeEnum,
} from "@/enums/musicScoreEnum";
import {GuitarTabSkinKeyEnum} from "@/guitarTab/enums/guitarTabSkinKeyEnum";
import type {AugmentationDot, NotesInfo, TabNoteInfo} from "@/types/MusicScoreType";

export function getBarlineSkinKey(barlineType: BarlineTypeEnum): GuitarTabSkinKeyEnum {
    const map: Record<BarlineTypeEnum, GuitarTabSkinKeyEnum> = {
        [BarlineTypeEnum.Single_barline]: GuitarTabSkinKeyEnum.Single_barline,
        [BarlineTypeEnum.Double_barline]: GuitarTabSkinKeyEnum.Double_barline,
        [BarlineTypeEnum.StartRepeat_barline]: GuitarTabSkinKeyEnum.StartRepeat_barline,
        [BarlineTypeEnum.EndRepeat_barline]: GuitarTabSkinKeyEnum.EndRepeat_barline,
        [BarlineTypeEnum.Dashed_barline]: GuitarTabSkinKeyEnum.Dashed_barline,
        [BarlineTypeEnum.Final_barline]: GuitarTabSkinKeyEnum.Final_barline,
        [BarlineTypeEnum.Start_end_repeat_barline]: GuitarTabSkinKeyEnum.Start_end_repeat_barline,
        [BarlineTypeEnum.Dotted_barline]: GuitarTabSkinKeyEnum.Dotted_barline,
        [BarlineTypeEnum.Reverse_barline]: GuitarTabSkinKeyEnum.Reverse_barline,
        [BarlineTypeEnum.Heavy_barline]: GuitarTabSkinKeyEnum.Heavy_barline,
        [BarlineTypeEnum.Heavy_double_barline]: GuitarTabSkinKeyEnum.Heavy_double_barline,
    };
    return map[barlineType] ?? GuitarTabSkinKeyEnum.Single_barline;
}

/** 连谱小节线皮肤 key（BarlineTypeEnum → linked_*） */
export function getLinkedBarlineSkinKey(barlineType: BarlineTypeEnum): GuitarTabSkinKeyEnum {
    const map: Record<BarlineTypeEnum, GuitarTabSkinKeyEnum> = {
        [BarlineTypeEnum.Single_barline]: GuitarTabSkinKeyEnum.linked_single_barline,
        [BarlineTypeEnum.Double_barline]: GuitarTabSkinKeyEnum.linked_double_barline,
        [BarlineTypeEnum.StartRepeat_barline]: GuitarTabSkinKeyEnum.linked_startRepeat_barline,
        [BarlineTypeEnum.EndRepeat_barline]: GuitarTabSkinKeyEnum.linked_endRepeat_barline,
        [BarlineTypeEnum.Dashed_barline]: GuitarTabSkinKeyEnum.linked_dashed_barline,
        [BarlineTypeEnum.Final_barline]: GuitarTabSkinKeyEnum.linked_final_barline,
        [BarlineTypeEnum.Start_end_repeat_barline]: GuitarTabSkinKeyEnum.linked_start_end_repeat_barline,
        [BarlineTypeEnum.Dotted_barline]: GuitarTabSkinKeyEnum.linked_dotted_barline,
        [BarlineTypeEnum.Reverse_barline]: GuitarTabSkinKeyEnum.linked_reverse_barline,
        [BarlineTypeEnum.Heavy_barline]: GuitarTabSkinKeyEnum.linked_heavy_barline,
        [BarlineTypeEnum.Heavy_double_barline]: GuitarTabSkinKeyEnum.linked_heavy_double_barline,
    };
    return map[barlineType] ?? GuitarTabSkinKeyEnum.linked_single_barline;
}

export function getTimeSignatureSkinKey(type?: TimeSignatureTypeEnum): GuitarTabSkinKeyEnum {
    if (type == null) return GuitarTabSkinKeyEnum['4_4'];
    return GuitarTabSkinKeyEnum[type as keyof typeof GuitarTabSkinKeyEnum]
        ?? GuitarTabSkinKeyEnum['4_4'];
}

/** 品数；-1 为 x（闷音） */
export function getTabNoteValue(info: NotesInfo | TabNoteInfo): number {
    const v = (info as TabNoteInfo).value;
    return typeof v === 'number' ? v : 0;
}

/** 品数 value → tab_note 皮肤；-1 为 tab_note_x */
export function getTabNoteSkinKey(value: number): GuitarTabSkinKeyEnum {
    if (value === -1) return GuitarTabSkinKeyEnum.Tab_note_x;
    if (value >= 0 && value <= 27) {
        const enumKey = `Tab_note_${value}` as keyof typeof GuitarTabSkinKeyEnum;
        const skinKey = GuitarTabSkinKeyEnum[enumKey];
        if (skinKey) return skinKey;
    }
    return GuitarTabSkinKeyEnum.Tab_note_0;
}

/** 品数 value → tab_harmonic 皮肤；-1 为 tab_harmonic_x */
export function getTabHarmonicSkinKey(value: number): GuitarTabSkinKeyEnum {
    if (value === -1) return GuitarTabSkinKeyEnum.Tab_harmonic_x;
    if (value >= 0 && value <= 27) {
        const enumKey = `Tab_harmonic_${value}` as keyof typeof GuitarTabSkinKeyEnum;
        const skinKey = GuitarTabSkinKeyEnum[enumKey];
        if (skinKey) return skinKey;
    }
    return GuitarTabSkinKeyEnum.Tab_harmonic_0;
}

/** Normal → tab_note_*；Harmonic → tab_harmonic_* */
export function getTabNoteHeadSkinKey(info: TabNoteInfo | NotesInfo): GuitarTabSkinKeyEnum {
    const value = getTabNoteValue(info);
    if ('type' in info && info.type === TabNoteInfoTypeEnum.Harmonic) {
        return getTabHarmonicSkinKey(value);
    }
    return getTabNoteSkinKey(value);
}

/** 时值 chronaxie → 休止符皮肤 */
export function getRestSkinKey(chronaxie: number): GuitarTabSkinKeyEnum {
    const map: Record<number, GuitarTabSkinKeyEnum> = {
        256: GuitarTabSkinKeyEnum.Rest_1,
        128: GuitarTabSkinKeyEnum.Rest_2,
        64: GuitarTabSkinKeyEnum.Rest_3,
        32: GuitarTabSkinKeyEnum.Rest_4,
        16: GuitarTabSkinKeyEnum.Rest_5,
        8: GuitarTabSkinKeyEnum.Rest_6,
        4: GuitarTabSkinKeyEnum.Rest_7,
        2: GuitarTabSkinKeyEnum.Rest_8,
        1: GuitarTabSkinKeyEnum.Rest_9,
    };
    return map[chronaxie] ?? GuitarTabSkinKeyEnum.Rest_4;
}

/** 时值 chronaxie ≤32 → 符尾皮肤 */
export function getNoteTailSkinKey(chronaxie: number, direction?: 'up' | 'down'): GuitarTabSkinKeyEnum {
    const map: Record<number, GuitarTabSkinKeyEnum> = {
        32: GuitarTabSkinKeyEnum.NoteTail_1,
        16: GuitarTabSkinKeyEnum.NoteTail_2,
        8: GuitarTabSkinKeyEnum.NoteTail_3,
        4: GuitarTabSkinKeyEnum.NoteTail_4,
        2: GuitarTabSkinKeyEnum.NoteTail_5,
        1: GuitarTabSkinKeyEnum.NoteTail_6,
    };

    return map[chronaxie] ?? GuitarTabSkinKeyEnum.NoteTail_1;
}

export function chronaxieToBeamLineCount(chronaxie: number): number {
    const map: Record<number, number> = {32: 1, 16: 2, 8: 3, 4: 4, 2: 5, 1: 6};
    return map[chronaxie] ?? 1;
}

/** 减时线皮肤内最后一条线的 y（guitarTab 倚音皮肤为简谱一半，坐标已直接绘制） */
const REDUCE_LINE_Y_BY_COUNT = [0.25, 2.25, 3.75, 4.75, 5.75, 6.75] as const;

export function getReduceLineLastLineY(chronaxie: number): number {
    const count = chronaxieToBeamLineCount(chronaxie);
    return REDUCE_LINE_Y_BY_COUNT[Math.min(Math.max(count, 1), 6) - 1] ?? 0.25;
}

export function getReduceLineSkinKey(chronaxie: number): GuitarTabSkinKeyEnum {
    const map: Record<number, GuitarTabSkinKeyEnum> = {
        32: GuitarTabSkinKeyEnum.ReduceLine_1,
        16: GuitarTabSkinKeyEnum.ReduceLine_2,
        8: GuitarTabSkinKeyEnum.ReduceLine_3,
        4: GuitarTabSkinKeyEnum.ReduceLine_4,
        2: GuitarTabSkinKeyEnum.ReduceLine_5,
        1: GuitarTabSkinKeyEnum.ReduceLine_6,
    };
    return map[chronaxie] ?? GuitarTabSkinKeyEnum.ReduceLine_1;
}

/** 连谱号类型 → 皮肤 key */
export function getBracketSkinKey(type: BracketTypeEnum): GuitarTabSkinKeyEnum {
    const map: Record<BracketTypeEnum, GuitarTabSkinKeyEnum> = {
        [BracketTypeEnum.Bracket]: GuitarTabSkinKeyEnum.Bracket,
        [BracketTypeEnum.Brace]: GuitarTabSkinKeyEnum.Brace,
        [BracketTypeEnum.Square]: GuitarTabSkinKeyEnum.Square,
    };
    return map[type] ?? GuitarTabSkinKeyEnum.Bracket;
}

export function getAugmentationDotSkinKey(augmentationDot: AugmentationDot): GuitarTabSkinKeyEnum {
    const map: Record<1 | 2 | 3, GuitarTabSkinKeyEnum> = {
        [1]: GuitarTabSkinKeyEnum.AugmentationDot_1,
        [2]: GuitarTabSkinKeyEnum.AugmentationDot_2,
        [3]: GuitarTabSkinKeyEnum.AugmentationDot_3,
    };
    return map[augmentationDot.count as 1 | 2 | 3];
}
