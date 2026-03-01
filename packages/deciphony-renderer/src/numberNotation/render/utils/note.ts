import type {Measure, NoteNumber, NoteSymbol} from "@/types/MusicScoreType";
import type {NumberNotationSkinPack} from "@/types/common";
import {NoteSymbolTypeEnum} from "@/enums/musicScoreEnum";
import {resolveWidthRatio} from "@/utils/widthRatio";
import {
    getAccidentalSkinKey,
    getAugmentationDotSkinKey,
    getBarlineSkinKey,
    getClefSkinKey,
    getKeySignatureSkinKey,
    getNoteHeadSkinKey,
    getRestSkinKey,
    getTimeSignatureSkinKey,
} from "./skinKey";
import {NumberNotationSkinKeyEnum} from "@/numberNotation/enums/numberNotationSkinKeyEnum";

/** 简谱音符位取 voicePart 时值用于宽度系数 */
export function getSlotChronaxie(note: NoteNumber): number {
    return note.voicePart.chronaxie || 64;
}

/** 是否为休止符位：简谱 syllable===0 或五线谱 type===Rest */
export function isSlotRest(note: NoteNumber): boolean {
    if ('type' in note && note.type === NoteSymbolTypeEnum.Rest) return true;
    return !note.voicePart.notesInfo.length || note.voicePart.notesInfo.every((n) => n.syllable === 0);
}

/** 休止符位取第一个有拍子的声部的时值用于休止符形状 */
export function getSlotRestChronaxie(note: NoteNumber): number {
    return note.voicePart.chronaxie ?? 64;
}

/** widthRatio/widthRatioForMeasure 以四分音符(64)为 1；时值换算系数 */
export function getChronaxieWidthCoefficient(chronaxie: number): number {
    if (chronaxie === 256) return 4;
    if (chronaxie === 128) return 2;
    if (chronaxie === 64) return 1;
    if (chronaxie === 32) return 0.5;
    if (chronaxie === 16) return 0.25;
    if (chronaxie === 8) return 0.25;
    if (chronaxie === 4) return 0.25;
    if (chronaxie === 2) return 0.25;
    if (chronaxie === 1) return 0.25;
    return 1;
}

/** 音符在小节内的宽度占比与布局：仅用 widthRatio（含时值系数、变音、谱号、附点等）；数据优先，否则用皮肤，0 为有效值 */
export function getNoteWidthRatio(note: NoteNumber, skin: NumberNotationSkinPack): number {
    const slotChronaxie = getSlotChronaxie(note);
    const isRest = isSlotRest(note);
    const slotSkinKey = isRest ? getRestSkinKey(slotChronaxie) : getNoteHeadSkinKey(slotChronaxie);
    const slotW = resolveWidthRatio(note.widthRatio, skin[slotSkinKey]?.widthRatio);
    const base = slotW * getChronaxieWidthCoefficient(slotChronaxie);
    let sub = 0;
    const beat = note.voicePart;
    for (const n of beat.notesInfo) {
        const acc = 'accidental' in n ? n.accidental : (n as { accidental?: { widthRatio?: number } }).accidental;
        if (acc) sub += resolveWidthRatio(acc.widthRatio, skin[getAccidentalSkinKey(acc.type)]?.widthRatio);
    }
    if (beat.augmentationDot) {
        sub += resolveWidthRatio(beat.augmentationDot.widthRatio, skin[getAugmentationDotSkinKey(beat.augmentationDot)]?.widthRatio);
    }
    return base + sub;
}

/** 音符对小节在单谱表内宽度占比的系数：仅用 widthRatioForMeasure（本包仅处理 NoteNumber）；数据优先，否则用皮肤，0 为有效值 */
export function getNoteWidthRatioForMeasure(note: NoteNumber, skin: NumberNotationSkinPack): number {
    const slotChronaxie = getSlotChronaxie(note);
    const isRest = isSlotRest(note);
    const slotSkinKey = isRest ? getRestSkinKey(slotChronaxie) : getNoteHeadSkinKey(slotChronaxie);
    const slotW = resolveWidthRatio(note.widthRatioForMeasure, skin[slotSkinKey]?.widthRatioForMeasure);
    const base = slotW * getChronaxieWidthCoefficient(slotChronaxie);
    let sub = 0;
    const beat = note.voicePart;
    for (const n of beat.notesInfo) {
        const acc = 'accidental' in n ? n.accidental : (n as { accidental?: { widthRatioForMeasure?: number } }).accidental;
        if (acc) sub += resolveWidthRatio(acc.widthRatioForMeasure, skin[getAccidentalSkinKey(acc.type)]?.widthRatioForMeasure);
    }
    if (beat.augmentationDot) {
        sub += resolveWidthRatio(beat.augmentationDot.widthRatioForMeasure, skin[getAugmentationDotSkinKey(beat.augmentationDot)]?.widthRatioForMeasure);
    }
    return base + sub;
}

/** 小节的宽度系数（小节在单谱表内的宽度占比）；数据优先，否则用皮肤，0 为有效值 */
export function getMeasureWidthRatio(measure: Measure, skin: NumberNotationSkinPack): number {
    let acc = 0;
    acc += resolveWidthRatio(measure.widthRatioForMeasure, skin[NumberNotationSkinKeyEnum.Measure]?.widthRatioForMeasure);
    for (let i = 0; i < measure.notes.length; i++) {
        acc += getNoteWidthRatioForMeasure(measure.notes[i] as NoteNumber, skin);
    }
    if (measure.barline) {
        acc += resolveWidthRatio(measure.barline.widthRatioForMeasure, skin[getBarlineSkinKey(measure.barline.barlineType)]?.widthRatioForMeasure);
    }
    if (measure.clef_f) {
        acc += resolveWidthRatio(measure.clef_f.widthRatioForMeasure, skin[getClefSkinKey(measure.clef_f.clefType, true)]?.widthRatioForMeasure);
    }
    if (measure.clef_b) {
        acc += resolveWidthRatio(measure.clef_b.widthRatioForMeasure, skin[getClefSkinKey(measure.clef_b.clefType, false)]?.widthRatioForMeasure);
    }
    if (measure.keySignature_f) {
        acc += resolveWidthRatio(measure.keySignature_f.widthRatioForMeasure, skin[getKeySignatureSkinKey(measure.keySignature_f.type)]?.widthRatioForMeasure);
    }
    if (measure.keySignature_b) {
        acc += resolveWidthRatio(measure.keySignature_b.widthRatioForMeasure, skin[getKeySignatureSkinKey(measure.keySignature_b.type)]?.widthRatioForMeasure);
    }
    if (measure.timeSignature_f) {
        acc += resolveWidthRatio(measure.timeSignature_f.widthRatioForMeasure, skin[getTimeSignatureSkinKey(measure.timeSignature_f.type)]?.widthRatioForMeasure);
    }
    if (measure.timeSignature_b) {
        acc += resolveWidthRatio(measure.timeSignature_b.widthRatioForMeasure, skin[getTimeSignatureSkinKey(measure.timeSignature_b.type)]?.widthRatioForMeasure);
    }
    return acc;
}
