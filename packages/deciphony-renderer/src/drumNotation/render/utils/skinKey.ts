import {
    BarlineTypeEnum,
    BracketTypeEnum,
    ClefTypeEnum,
    DrumHeadTypeEnum,
    KeySignatureTypeEnum,
    TimeSignatureTypeEnum,
} from "@/enums/musicScoreEnum";
import {DrumNotationSkinKeyEnum} from "@/drumNotation/enums/drumNotationSkinKeyEnum";
import type {AugmentationDot, Measure} from "@/types/MusicScoreType";
import type {LongRestKind} from "../types";


export function getBarlineSkinKey(barlineType: BarlineTypeEnum): DrumNotationSkinKeyEnum {
    const map: Record<BarlineTypeEnum, DrumNotationSkinKeyEnum> = {
        [BarlineTypeEnum.Single_barline]: DrumNotationSkinKeyEnum.Single_barline,
        [BarlineTypeEnum.Double_barline]: DrumNotationSkinKeyEnum.Double_barline,
        [BarlineTypeEnum.StartRepeat_barline]: DrumNotationSkinKeyEnum.StartRepeat_barline,
        [BarlineTypeEnum.EndRepeat_barline]: DrumNotationSkinKeyEnum.EndRepeat_barline,
        [BarlineTypeEnum.Dashed_barline]: DrumNotationSkinKeyEnum.Dashed_barline,
        [BarlineTypeEnum.Final_barline]: DrumNotationSkinKeyEnum.Final_barline,
        [BarlineTypeEnum.Start_end_repeat_barline]: DrumNotationSkinKeyEnum.Start_end_repeat_barline,
        [BarlineTypeEnum.Dotted_barline]: DrumNotationSkinKeyEnum.Dotted_barline,
        [BarlineTypeEnum.Reverse_barline]: DrumNotationSkinKeyEnum.Reverse_barline,
        [BarlineTypeEnum.Heavy_barline]: DrumNotationSkinKeyEnum.Heavy_barline,
        [BarlineTypeEnum.Heavy_double_barline]: DrumNotationSkinKeyEnum.Heavy_double_barline,
    };
    return map[barlineType] ?? DrumNotationSkinKeyEnum.Single_barline;
}

/** 连谱小节线皮肤 key（BarlineTypeEnum → linked_*） */
export function getLinkedBarlineSkinKey(barlineType: BarlineTypeEnum): DrumNotationSkinKeyEnum {
    const map: Record<BarlineTypeEnum, DrumNotationSkinKeyEnum> = {
        [BarlineTypeEnum.Single_barline]: DrumNotationSkinKeyEnum.linked_single_barline,
        [BarlineTypeEnum.Double_barline]: DrumNotationSkinKeyEnum.linked_double_barline,
        [BarlineTypeEnum.StartRepeat_barline]: DrumNotationSkinKeyEnum.linked_startRepeat_barline,
        [BarlineTypeEnum.EndRepeat_barline]: DrumNotationSkinKeyEnum.linked_endRepeat_barline,
        [BarlineTypeEnum.Dashed_barline]: DrumNotationSkinKeyEnum.linked_dashed_barline,
        [BarlineTypeEnum.Final_barline]: DrumNotationSkinKeyEnum.linked_final_barline,
        [BarlineTypeEnum.Start_end_repeat_barline]: DrumNotationSkinKeyEnum.linked_start_end_repeat_barline,
        [BarlineTypeEnum.Dotted_barline]: DrumNotationSkinKeyEnum.linked_dotted_barline,
        [BarlineTypeEnum.Reverse_barline]: DrumNotationSkinKeyEnum.linked_reverse_barline,
        [BarlineTypeEnum.Heavy_barline]: DrumNotationSkinKeyEnum.linked_heavy_barline,
        [BarlineTypeEnum.Heavy_double_barline]: DrumNotationSkinKeyEnum.linked_heavy_double_barline,
    };
    return map[barlineType] ?? DrumNotationSkinKeyEnum.linked_single_barline;
}

/** 谱号类型 + 是否前置 */
export function getClefSkinKey(clefType: ClefTypeEnum, isFront: boolean): DrumNotationSkinKeyEnum {
    switch (clefType) {
        case ClefTypeEnum.Percussion:
            return isFront ? DrumNotationSkinKeyEnum.Percussion_f : DrumNotationSkinKeyEnum.Percussion;
        case ClefTypeEnum.Treble:
            return isFront ? DrumNotationSkinKeyEnum.Treble_f : DrumNotationSkinKeyEnum.Treble;
        case ClefTypeEnum.Bass:
            return isFront ? DrumNotationSkinKeyEnum.Bass_f : DrumNotationSkinKeyEnum.Bass;
        case ClefTypeEnum.Alto:
            return isFront ? DrumNotationSkinKeyEnum.Alto_f : DrumNotationSkinKeyEnum.Alto;
        case ClefTypeEnum.Tenor:
            return isFront ? DrumNotationSkinKeyEnum.Tenor_f : DrumNotationSkinKeyEnum.Tenor;
        default:
            return isFront ? DrumNotationSkinKeyEnum.Percussion_f : DrumNotationSkinKeyEnum.Percussion;
    }
}

/** 小节生效谱号（鼓谱槽位不带谱号，只看小节前后置谱号） */
export function getClefForMeasure(measures: Measure[], measureIndex: number): ClefTypeEnum {
    if (measureIndex < 0) return ClefTypeEnum.Percussion;
    const m = measures[measureIndex];
    if (m.clef_f) return m.clef_f.type;
    const prev = measureIndex - 1;
    if (prev < 0) return ClefTypeEnum.Percussion;
    const pm = measures[prev];
    if (pm.clef_b) return pm.clef_b.type;
    if (pm.clef_f) return pm.clef_f.type;
    return getClefForMeasure(measures, prev);
}

/** 调号 y 偏移：皮肤按 treble 布局，中音/次中音 ±1 节，低音 +2 节，鼓谱谱号不偏移 */
export function getKeySignatureYOffset(
    clefType: ClefTypeEnum,
    measureHeight: number,
    measureLineWidth: number
): number {
    const unit = (measureHeight - 5 * measureLineWidth) / 8 + measureLineWidth / 2;
    switch (clefType) {
        case ClefTypeEnum.Alto:
            return unit;
        case ClefTypeEnum.Tenor:
            return -unit;
        case ClefTypeEnum.Bass:
            return unit * 2;
        default:
            return 0;
    }
}

export function getKeySignatureSkinKey(type: KeySignatureTypeEnum): DrumNotationSkinKeyEnum {
    return DrumNotationSkinKeyEnum[type];
}

export function getTimeSignatureSkinKey(type?: TimeSignatureTypeEnum): DrumNotationSkinKeyEnum {
    if (type == null) return DrumNotationSkinKeyEnum['4_4'];
    return DrumNotationSkinKeyEnum[type as keyof typeof DrumNotationSkinKeyEnum]
        ?? DrumNotationSkinKeyEnum['4_4'];
}

/** 音符头类型 → 音符头皮肤（与时值无关） */
export function getDrumHeadSkinKey(headType: DrumHeadTypeEnum): DrumNotationSkinKeyEnum {
    const map: Record<DrumHeadTypeEnum, DrumNotationSkinKeyEnum> = {
        [DrumHeadTypeEnum.Cross]: DrumNotationSkinKeyEnum.DrumHead_cross,
        [DrumHeadTypeEnum.CircledCross]: DrumNotationSkinKeyEnum.DrumHead_circledCross,
        [DrumHeadTypeEnum.Normal]: DrumNotationSkinKeyEnum.DrumHead_normal,
        [DrumHeadTypeEnum.CircledSlash]: DrumNotationSkinKeyEnum.DrumHead_circledSlash,
        [DrumHeadTypeEnum.Triangle]: DrumNotationSkinKeyEnum.DrumHead_triangle,
        [DrumHeadTypeEnum.Diamond]: DrumNotationSkinKeyEnum.DrumHead_diamond,
    };
    return map[headType] ?? DrumNotationSkinKeyEnum.DrumHead_normal;
}

/** 时值 chronaxie → 休止符皮肤 */
export function getRestSkinKey(chronaxie: number): DrumNotationSkinKeyEnum {
    const map: Record<number, DrumNotationSkinKeyEnum> = {
        256: DrumNotationSkinKeyEnum.Rest_1,
        128: DrumNotationSkinKeyEnum.Rest_2,
        64: DrumNotationSkinKeyEnum.Rest_3,
        32: DrumNotationSkinKeyEnum.Rest_4,
        16: DrumNotationSkinKeyEnum.Rest_5,
        8: DrumNotationSkinKeyEnum.Rest_6,
        4: DrumNotationSkinKeyEnum.Rest_7,
        2: DrumNotationSkinKeyEnum.Rest_8,
        1: DrumNotationSkinKeyEnum.Rest_9,
    };
    return map[chronaxie] ?? DrumNotationSkinKeyEnum.Rest_4;
}

/** 长休止符角色 → 皮肤 */
export function getLongRestSkinKey(kind: LongRestKind): DrumNotationSkinKeyEnum {
    const map: Record<LongRestKind, DrumNotationSkinKeyEnum> = {
        complete: DrumNotationSkinKeyEnum.LongRest_complete,
        head: DrumNotationSkinKeyEnum.LongRest_head,
        content: DrumNotationSkinKeyEnum.LongRest_content,
        tail: DrumNotationSkinKeyEnum.LongRest_tail,
    };
    return map[kind];
}

/** 时值 chronaxie ≤32 → 符尾皮肤；direction 为 down 时用符尾倒（_r） */
export function getNoteTailSkinKey(chronaxie: number, direction?: 'up' | 'down'): DrumNotationSkinKeyEnum {
    const map: Record<number, DrumNotationSkinKeyEnum> = {
        32: DrumNotationSkinKeyEnum.NoteTail_1,
        16: DrumNotationSkinKeyEnum.NoteTail_2,
        8: DrumNotationSkinKeyEnum.NoteTail_3,
        4: DrumNotationSkinKeyEnum.NoteTail_4,
        2: DrumNotationSkinKeyEnum.NoteTail_5,
        1: DrumNotationSkinKeyEnum.NoteTail_6,
    };
    const rMap: Record<number, DrumNotationSkinKeyEnum> = {
        32: DrumNotationSkinKeyEnum.NoteTail_1_r,
        16: DrumNotationSkinKeyEnum.NoteTail_2_r,
        8: DrumNotationSkinKeyEnum.NoteTail_3_r,
        4: DrumNotationSkinKeyEnum.NoteTail_4_r,
        2: DrumNotationSkinKeyEnum.NoteTail_5_r,
        1: DrumNotationSkinKeyEnum.NoteTail_6_r,
    };
    if (direction === 'down') {
        return rMap[chronaxie] ?? DrumNotationSkinKeyEnum.NoteTail_1_r;
    }
    return map[chronaxie] ?? DrumNotationSkinKeyEnum.NoteTail_1;
}

export function chronaxieToBeamLineCount(chronaxie: number): number {
    const map: Record<number, number> = {32: 1, 16: 2, 8: 3, 4: 4, 2: 5, 1: 6};
    return map[chronaxie] ?? 1;
}

/** 连谱号类型 → 皮肤 key */
export function getBracketSkinKey(type: BracketTypeEnum): DrumNotationSkinKeyEnum {
    const map: Record<BracketTypeEnum, DrumNotationSkinKeyEnum> = {
        [BracketTypeEnum.Bracket]: DrumNotationSkinKeyEnum.Bracket,
        [BracketTypeEnum.Brace]: DrumNotationSkinKeyEnum.Brace,
        [BracketTypeEnum.Square]: DrumNotationSkinKeyEnum.Square,
    };
    return map[type] ?? DrumNotationSkinKeyEnum.Bracket;
}

export function getAugmentationDotSkinKey(augmentationDot: AugmentationDot): DrumNotationSkinKeyEnum {
    const map: Record<1 | 2 | 3, DrumNotationSkinKeyEnum> = {
        [1]: DrumNotationSkinKeyEnum.AugmentationDot_1,
        [2]: DrumNotationSkinKeyEnum.AugmentationDot_2,
        [3]: DrumNotationSkinKeyEnum.AugmentationDot_3,
    };
    return map[augmentationDot.count as 1 | 2 | 3];
}
