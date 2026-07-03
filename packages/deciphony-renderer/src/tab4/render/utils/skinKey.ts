import {
    BarlineTypeEnum,
    BracketTypeEnum,
    TabNoteInfoTypeEnum,
    TimeSignatureTypeEnum,
} from "@/enums/musicScoreEnum";
import {Tab6SkinKeyEnum} from "@/tab6/enums/tab6SkinKeyEnum";
import type {AugmentationDot, NotesInfo, TabNoteInfo} from "@/types/MusicScoreType";

export function getBarlineSkinKey(barlineType: BarlineTypeEnum): Tab6SkinKeyEnum {
    const map: Record<BarlineTypeEnum, Tab6SkinKeyEnum> = {
        [BarlineTypeEnum.Single_barline]: Tab6SkinKeyEnum.Single_barline,
        [BarlineTypeEnum.Double_barline]: Tab6SkinKeyEnum.Double_barline,
        [BarlineTypeEnum.StartRepeat_barline]: Tab6SkinKeyEnum.StartRepeat_barline,
        [BarlineTypeEnum.EndRepeat_barline]: Tab6SkinKeyEnum.EndRepeat_barline,
        [BarlineTypeEnum.Dashed_barline]: Tab6SkinKeyEnum.Dashed_barline,
        [BarlineTypeEnum.Final_barline]: Tab6SkinKeyEnum.Final_barline,
        [BarlineTypeEnum.Start_end_repeat_barline]: Tab6SkinKeyEnum.Start_end_repeat_barline,
        [BarlineTypeEnum.Dotted_barline]: Tab6SkinKeyEnum.Dotted_barline,
        [BarlineTypeEnum.Reverse_barline]: Tab6SkinKeyEnum.Reverse_barline,
        [BarlineTypeEnum.Heavy_barline]: Tab6SkinKeyEnum.Heavy_barline,
        [BarlineTypeEnum.Heavy_double_barline]: Tab6SkinKeyEnum.Heavy_double_barline,
    };
    return map[barlineType] ?? Tab6SkinKeyEnum.Single_barline;
}

/** 连谱小节线皮肤 key（BarlineTypeEnum → linked_*） */
export function getLinkedBarlineSkinKey(barlineType: BarlineTypeEnum): Tab6SkinKeyEnum {
    const map: Record<BarlineTypeEnum, Tab6SkinKeyEnum> = {
        [BarlineTypeEnum.Single_barline]: Tab6SkinKeyEnum.linked_single_barline,
        [BarlineTypeEnum.Double_barline]: Tab6SkinKeyEnum.linked_double_barline,
        [BarlineTypeEnum.StartRepeat_barline]: Tab6SkinKeyEnum.linked_startRepeat_barline,
        [BarlineTypeEnum.EndRepeat_barline]: Tab6SkinKeyEnum.linked_endRepeat_barline,
        [BarlineTypeEnum.Dashed_barline]: Tab6SkinKeyEnum.linked_dashed_barline,
        [BarlineTypeEnum.Final_barline]: Tab6SkinKeyEnum.linked_final_barline,
        [BarlineTypeEnum.Start_end_repeat_barline]: Tab6SkinKeyEnum.linked_start_end_repeat_barline,
        [BarlineTypeEnum.Dotted_barline]: Tab6SkinKeyEnum.linked_dotted_barline,
        [BarlineTypeEnum.Reverse_barline]: Tab6SkinKeyEnum.linked_reverse_barline,
        [BarlineTypeEnum.Heavy_barline]: Tab6SkinKeyEnum.linked_heavy_barline,
        [BarlineTypeEnum.Heavy_double_barline]: Tab6SkinKeyEnum.linked_heavy_double_barline,
    };
    return map[barlineType] ?? Tab6SkinKeyEnum.linked_single_barline;
}

export function getTimeSignatureSkinKey(type?: TimeSignatureTypeEnum): Tab6SkinKeyEnum {
    if (type == null) return Tab6SkinKeyEnum['4_4'];
    return Tab6SkinKeyEnum[type as keyof typeof Tab6SkinKeyEnum]
        ?? Tab6SkinKeyEnum['4_4'];
}

/** 品数；-1 为 x（闷音） */
export function getTabNoteValue(info: NotesInfo | TabNoteInfo): number {
    const v = (info as TabNoteInfo).value;
    return typeof v === 'number' ? v : 0;
}

/** 品数 value → tab_note 皮肤；-1 为 tab_note_x */
export function getTabNoteSkinKey(value: number): Tab6SkinKeyEnum {
    if (value === -1) return Tab6SkinKeyEnum.Tab_note_x;
    if (value >= 0 && value <= 27) {
        const enumKey = `Tab_note_${value}` as keyof typeof Tab6SkinKeyEnum;
        const skinKey = Tab6SkinKeyEnum[enumKey];
        if (skinKey) return skinKey;
    }
    return Tab6SkinKeyEnum.Tab_note_0;
}

/** 品数 value → tab_harmonic 皮肤；-1 为 tab_harmonic_x */
export function getTabHarmonicSkinKey(value: number): Tab6SkinKeyEnum {
    if (value === -1) return Tab6SkinKeyEnum.Tab_harmonic_x;
    if (value >= 0 && value <= 27) {
        const enumKey = `Tab_harmonic_${value}` as keyof typeof Tab6SkinKeyEnum;
        const skinKey = Tab6SkinKeyEnum[enumKey];
        if (skinKey) return skinKey;
    }
    return Tab6SkinKeyEnum.Tab_harmonic_0;
}

/** Normal → tab_note_*；Harmonic → tab_harmonic_* */
export function getTabNoteHeadSkinKey(info: TabNoteInfo | NotesInfo): Tab6SkinKeyEnum {
    const value = getTabNoteValue(info);
    if ('type' in info && info.type === TabNoteInfoTypeEnum.Harmonic) {
        return getTabHarmonicSkinKey(value);
    }
    return getTabNoteSkinKey(value);
}

/** 时值 chronaxie → 休止符皮肤 */
export function getRestSkinKey(chronaxie: number): Tab6SkinKeyEnum {
    const map: Record<number, Tab6SkinKeyEnum> = {
        256: Tab6SkinKeyEnum.Rest_1,
        128: Tab6SkinKeyEnum.Rest_2,
        64: Tab6SkinKeyEnum.Rest_3,
        32: Tab6SkinKeyEnum.Rest_4,
        16: Tab6SkinKeyEnum.Rest_5,
        8: Tab6SkinKeyEnum.Rest_6,
        4: Tab6SkinKeyEnum.Rest_7,
        2: Tab6SkinKeyEnum.Rest_8,
        1: Tab6SkinKeyEnum.Rest_9,
    };
    return map[chronaxie] ?? Tab6SkinKeyEnum.Rest_4;
}

/** 时值 chronaxie ≤32 → 符尾皮肤 */
export function getNoteTailSkinKey(chronaxie: number, direction?: 'up' | 'down'): Tab6SkinKeyEnum {
    const map: Record<number, Tab6SkinKeyEnum> = {
        32: Tab6SkinKeyEnum.NoteTail_1,
        16: Tab6SkinKeyEnum.NoteTail_2,
        8: Tab6SkinKeyEnum.NoteTail_3,
        4: Tab6SkinKeyEnum.NoteTail_4,
        2: Tab6SkinKeyEnum.NoteTail_5,
        1: Tab6SkinKeyEnum.NoteTail_6,
    };

    return map[chronaxie] ?? Tab6SkinKeyEnum.NoteTail_1;
}

export function chronaxieToBeamLineCount(chronaxie: number): number {
    const map: Record<number, number> = {32: 1, 16: 2, 8: 3, 4: 4, 2: 5, 1: 6};
    return map[chronaxie] ?? 1;
}

/** 减时线皮肤内最后一条线的 y（tab6 倚音皮肤为简谱一半，坐标已直接绘制） */
const REDUCE_LINE_Y_BY_COUNT = [0.25, 2.25, 3.75, 4.75, 5.75, 6.75] as const;

export function getReduceLineLastLineY(chronaxie: number): number {
    const count = chronaxieToBeamLineCount(chronaxie);
    return REDUCE_LINE_Y_BY_COUNT[Math.min(Math.max(count, 1), 6) - 1] ?? 0.25;
}

export function getReduceLineSkinKey(chronaxie: number): Tab6SkinKeyEnum {
    const map: Record<number, Tab6SkinKeyEnum> = {
        32: Tab6SkinKeyEnum.ReduceLine_1,
        16: Tab6SkinKeyEnum.ReduceLine_2,
        8: Tab6SkinKeyEnum.ReduceLine_3,
        4: Tab6SkinKeyEnum.ReduceLine_4,
        2: Tab6SkinKeyEnum.ReduceLine_5,
        1: Tab6SkinKeyEnum.ReduceLine_6,
    };
    return map[chronaxie] ?? Tab6SkinKeyEnum.ReduceLine_1;
}

/** 连谱号类型 → 皮肤 key */
export function getBracketSkinKey(type: BracketTypeEnum): Tab6SkinKeyEnum {
    const map: Record<BracketTypeEnum, Tab6SkinKeyEnum> = {
        [BracketTypeEnum.Bracket]: Tab6SkinKeyEnum.Bracket,
        [BracketTypeEnum.Brace]: Tab6SkinKeyEnum.Brace,
        [BracketTypeEnum.Square]: Tab6SkinKeyEnum.Square,
    };
    return map[type] ?? Tab6SkinKeyEnum.Bracket;
}

export function getAugmentationDotSkinKey(augmentationDot: AugmentationDot): Tab6SkinKeyEnum {
    const map: Record<1 | 2 | 3, Tab6SkinKeyEnum> = {
        [1]: Tab6SkinKeyEnum.AugmentationDot_1,
        [2]: Tab6SkinKeyEnum.AugmentationDot_2,
        [3]: Tab6SkinKeyEnum.AugmentationDot_3,
    };
    return map[augmentationDot.count as 1 | 2 | 3];
}
