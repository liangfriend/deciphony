import type {AugmentationDot, Measure, NoteRest, NoteSymbol, NotesInfo, StaffSlot} from "@/types/MusicScoreType";
import type {GuitarTabSkinPack} from "@/types/common";
import type {MeasureColumnLayout} from "@/render/layout/measureColumnLayout";
import {BeamTypeEnum} from "@/enums/musicScoreEnum";
import type {Chronaxie} from "@/types/common";
import {resolveWidthRatio} from "@/utils/widthRatio";
import {
    getAugmentationDotSkinKey,
    getBarlineSkinKey,
    getRestSkinKey,
    getTabNoteHeadSkinKey,
    getRestSkinKey,
    getTabNoteSkinKey,
    getTabNoteValue,
    getTimeSignatureSkinKey,
} from "./skinKey";
import {GuitarTabSkinKeyEnum} from "@/guitarTab/enums/guitarTabSkinKeyEnum";
import {isNoteRest, isNoteSymbol} from "./staffSlot";

export type VoiceGroup = {
    direction: 'up' | 'down';
    notesInfo: NotesInfo[];
    chronaxie: Chronaxie;
    beamType: BeamTypeEnum;
};

/** 按符干方向分组：同方向多条 notesInfo 视为和弦 */
export function getVoiceGroups(note: NoteSymbol): VoiceGroup[] {
    if (note.notesInfo.length === 0) return [];
    const map = new Map<'up' | 'down', NotesInfo[]>();
    for (const ni of note.notesInfo) {
        const list = map.get(ni.direction) ?? [];
        list.push(ni);
        map.set(ni.direction, list);
    }
    return (['up', 'down'] as const)
        .filter((d) => map.has(d))
        .map((direction) => {
            const entries = map.get(direction)!;
            return {
                direction,
                notesInfo: entries,
                chronaxie: entries[0]!.chronaxie,
                beamType: entries[0]!.beamType,
            };
        });
}

export function getVoiceGroupForDirection(note: NoteSymbol, direction: 'up' | 'down'): VoiceGroup | undefined {
    return getVoiceGroups(note).find((g) => g.direction === direction);
}

/** 符杠 / 符尾时值：notes[0].chronaxie */
export function getSlotBeamChronaxie(note: NoteSymbol): number {
    return note.notesInfo[0]?.chronaxie ?? 64;
}

/** 符杠 beamType：notes[0] */
export function getSlotBeamType(note: NoteSymbol): BeamTypeEnum {
    return note.notesInfo[0]?.beamType ?? BeamTypeEnum.None;
}

/** 符干 / 符尾 targetId：notes[0] */
export function getSlotStemTargetId(note: NoteSymbol): string | undefined {
    return note.notesInfo[0]?.id;
}

export function getRestChronaxie(rest: NoteRest): Chronaxie {
    return rest.chronaxie;
}

/** 四分音符 chronaxie 单位 */
export const QUARTER_CHRONAXIE = 64;

/** 附点延长后的时值（与播放 getDuration 一致） */
export function getDotExtendedChronaxie(chronaxie: number, dotCount: number): number {
    let total = chronaxie;
    let add = chronaxie;
    for (let i = 0; i < dotCount; i++) {
        add /= 2;
        total += add;
    }
    return total;
}

/** 列布局 onset 推进：notes[0] 附点延长；休止符用 rest.chronaxie + 附点 */
export function getSlotLayoutChronaxie(slot: StaffSlot): number {
    if (isNoteRest(slot)) {
        return getDotExtendedChronaxie(slot.chronaxie, slot.augmentationDot?.count ?? 0);
    }
    const lead = slot.notesInfo[0];
    if (!lead) return 64;
    return getDotExtendedChronaxie(lead.chronaxie, lead.augmentationDot?.count ?? 0);
}

/** 音符 / 休止符位的时值（和弦取 notesInfo 最大 chronaxie；符干/beam 等仍用） */
export function getSlotChronaxie(slot: StaffSlot): number {
    if (isNoteRest(slot)) return slot.chronaxie;
    if (slot.notesInfo.length === 0) return 64;
    let max = slot.notesInfo[0]!.chronaxie;
    for (let i = 1; i < slot.notesInfo.length; i++) {
        const c = slot.notesInfo[i]!.chronaxie;
        if (c > max) max = c;
    }
    return max;
}

/**
 * 二分音符第一个附点在增时线布局中渲染为加时线，不参与附点 widthRatio。
 */
export function getRenderableAugmentationDot(
    chronaxie: number,
    augmentationDot?: AugmentationDot,
): AugmentationDot | undefined {
    if (!augmentationDot) return undefined;
    if (chronaxie === 128 && augmentationDot.count >= 1) {
        const remaining = augmentationDot.count - 1;
        if (remaining <= 0) return undefined;
        return {...augmentationDot, count: remaining as 1 | 2 | 3};
    }
    return augmentationDot;
}

/** 加时线条数（notes[0] / rest 时值） */
export function getAddLineCount(
    chronaxie: number,
    augmentationDot?: AugmentationDot,
): number {
    return getAddLineOnsetOffsets(chronaxie, augmentationDot).length;
}

/**
 * 相对符头 onset 的加时线虚拟列偏移。
 * 128→[64]；128+附点→[64,128]；256→[64,128,192]。
 */
export function getAddLineOnsetOffsets(
    chronaxie: number,
    augmentationDot?: AugmentationDot,
): number[] {
    const dotCount = augmentationDot?.count ?? 0;
    if (chronaxie === 128 && dotCount > 0) {
        return [QUARTER_CHRONAXIE, QUARTER_CHRONAXIE * 2];
    }
    const offsets: number[] = [];
    for (let o = QUARTER_CHRONAXIE; o < chronaxie; o += QUARTER_CHRONAXIE) {
        offsets.push(o);
    }
    return offsets;
}

/** slot 加时线虚拟列（notes[0] 或 rest） */
export function getSlotAddLineOnsetOffsets(slot: StaffSlot): number[] {
    if (isNoteRest(slot)) {
        return getAddLineOnsetOffsets(slot.chronaxie, slot.augmentationDot);
    }
    const lead = slot.notesInfo[0];
    if (!lead) return [];
    return getAddLineOnsetOffsets(lead.chronaxie, lead.augmentationDot);
}

export function isSlotRest(slot: StaffSlot): slot is NoteRest {
    return isNoteRest(slot);
}

export function getSlotRestChronaxie(slot: StaffSlot): number {
    if (isNoteRest(slot)) return slot.chronaxie;
    return getSlotChronaxie(slot);
}

/**
 * widthRatio 时值换算系数。
 * onset 列布局后，全/二/四分不再靠放大 ratio 给符尾/增时腾位（时长由 onset 对齐）；仅更短时值略缩小。
 */
export function getChronaxieWidthCoefficient(chronaxie: number): number {
    if (chronaxie >= 64) return 1;
    if (chronaxie === 32) return 0.8;
    if (chronaxie === 16) return 0.7;
    if (chronaxie === 8) return 0.6;
    if (chronaxie === 4) return 0.55;
    if (chronaxie === 2) return 0.5;
    if (chronaxie === 1) return 0.45;
    return 1;
}

function getLayoutChronaxieForSlot(slot: StaffSlot): number {
    if (isNoteRest(slot)) return slot.chronaxie;
    return slot.notesInfo[0]?.chronaxie ?? 64;
}

type WidthPick = (
    item: { widthRatio?: number; widthRatioForMeasure?: number } | undefined,
    data?: number,
) => number;

function getSlotTabNoteValue(slot: StaffSlot): number {
    if (isNoteSymbol(slot) && slot.notesInfo[0]) {
        return getTabNoteValue(slot.notesInfo[0]);
    }
    return 0;
}

function getSlotHeadSkinKey(slot: StaffSlot): GuitarTabSkinKeyEnum {
    if (isNoteSymbol(slot) && slot.notesInfo[0]) {
        return getTabNoteHeadSkinKey(slot.notesInfo[0]);
    }
    return getTabNoteSkinKey(getSlotTabNoteValue(slot));
}

function getSlotSkinWidthRatio(
    slot: StaffSlot,
    skin: GuitarTabSkinPack,
    forMeasure: boolean,
): number {
    const chronaxie = getLayoutChronaxieForSlot(slot);
    const slotSkinKey = isNoteRest(slot)
        ? getRestSkinKey(chronaxie)
        : getSlotHeadSkinKey(slot);
    const slotW = forMeasure
        ? resolveWidthRatio(slot.widthRatioForMeasure, skin[slotSkinKey]?.widthRatioForMeasure)
        : resolveWidthRatio(slot.widthRatio, skin[slotSkinKey]?.widthRatio);
    return slotW * getChronaxieWidthCoefficient(chronaxie);
}

function collectHeadSubWidthRatio(
    slot: StaffSlot,
    skin: GuitarTabSkinPack,
    pick: WidthPick,
    includeAugDot: boolean,
): number {
    let sub = 0;
    if (isNoteSymbol(slot)) {
        for (const ni of slot.notesInfo) {
            if (includeAugDot && ni.augmentationDot) {
                sub += pick(skin[getAugmentationDotSkinKey(ni.augmentationDot)], ni.augmentationDot.widthRatio);
            }
        }
    } else if (includeAugDot && slot.augmentationDot) {
        sub += pick(skin[getAugmentationDotSkinKey(slot.augmentationDot)], slot.augmentationDot.widthRatio);
    }
    return sub;
}

function collectAugDotSubWidthRatio(
    slot: StaffSlot,
    skin: GuitarTabSkinPack,
    pick: WidthPick,
): number {
    let sub = 0;
    if (isNoteSymbol(slot)) {
        const lead = slot.notesInfo[0];
        if (lead?.augmentationDot) {
            const eff = getRenderableAugmentationDot(lead.chronaxie, lead.augmentationDot);
            if (eff) {
                sub += pick(skin[getAugmentationDotSkinKey(eff)], eff.widthRatio);
            }
        }
    } else if (slot.augmentationDot) {
        const eff = getRenderableAugmentationDot(slot.chronaxie, slot.augmentationDot);
        if (eff) {
            sub += pick(skin[getAugmentationDotSkinKey(eff)], eff.widthRatio);
        }
    }
    return sub;
}

/** 符头 onset 列：slot widthRatio + 附点等；有加时线时不含附点。倚音宽不参与列宽。 */
export function getNoteHeadColumnWidthRatio(
    slot: StaffSlot,
    skin: GuitarTabSkinPack,
    _measureHeight = skin[GuitarTabSkinKeyEnum.Measure]?.h ?? 45,
): number {
    const hasAddLines = getSlotAddLineOnsetOffsets(slot).length > 0;
    return (
        getSlotSkinWidthRatio(slot, skin, false)
        + collectHeadSubWidthRatio(slot, skin, (item, data) => resolveWidthRatio(data, item?.widthRatio), !hasAddLines)
    );
}

/** 中间加时线 onset 列：仅皮肤 widthRatio */
export function getAddLineOnlyColumnWidthRatio(
    slot: StaffSlot,
    skin: GuitarTabSkinPack,
): number {
    return getSlotSkinWidthRatio(slot, skin, false);
}

/** 最后一条加时线 onset 列：皮肤 + 附点（若有） */
export function getLastAddLineColumnWidthRatio(
    slot: StaffSlot,
    skin: GuitarTabSkinPack,
): number {
    return (
        getSlotSkinWidthRatio(slot, skin, false)
        + collectAugDotSubWidthRatio(slot, skin, (item, data) => resolveWidthRatio(data, item?.widthRatio))
    );
}

function getNoteHeadColumnWidthRatioForMeasure(
    slot: StaffSlot,
    skin: GuitarTabSkinPack,
    _measureHeight: number,
): number {
    const hasAddLines = getSlotAddLineOnsetOffsets(slot).length > 0;
    return (
        getSlotSkinWidthRatio(slot, skin, true)
        + collectHeadSubWidthRatio(
            slot,
            skin,
            (item, data) => resolveWidthRatio(data, item?.widthRatioForMeasure),
            !hasAddLines,
        )
    );
}

function getAddLineOnlyColumnWidthRatioForMeasure(
    slot: StaffSlot,
    skin: GuitarTabSkinPack,
): number {
    return getSlotSkinWidthRatio(slot, skin, true);
}

function getLastAddLineColumnWidthRatioForMeasure(
    slot: StaffSlot,
    skin: GuitarTabSkinPack,
): number {
    return (
        getSlotSkinWidthRatio(slot, skin, true)
        + collectAugDotSubWidthRatio(
            slot,
            skin,
            (item, data) => resolveWidthRatio(data, item?.widthRatioForMeasure),
        )
    );
}

/** 音符 / 休止符在小节内的宽度占比（符头 + 各加时线虚拟列） */
export function getNoteWidthRatio(
    slot: StaffSlot,
    skin: GuitarTabSkinPack,
    measureHeight = skin[GuitarTabSkinKeyEnum.Measure]?.h ?? 45,
): number {
    const offsets = getSlotAddLineOnsetOffsets(slot);
    let acc = getNoteHeadColumnWidthRatio(slot, skin, measureHeight);
    for (let i = 0; i < offsets.length; i++) {
        acc += i === offsets.length - 1
            ? getLastAddLineColumnWidthRatio(slot, skin)
            : getAddLineOnlyColumnWidthRatio(slot, skin);
    }
    return acc;
}

/** 音符 / 休止符对小节在单谱表内宽度占比的系数 */
export function getNoteWidthRatioForMeasure(
    slot: StaffSlot,
    skin: GuitarTabSkinPack,
    measureHeight = skin[GuitarTabSkinKeyEnum.Measure]?.h ?? 45,
): number {
    const offsets = getSlotAddLineOnsetOffsets(slot);
    let acc = getNoteHeadColumnWidthRatioForMeasure(slot, skin, measureHeight);
    for (let i = 0; i < offsets.length; i++) {
        acc += i === offsets.length - 1
            ? getLastAddLineColumnWidthRatioForMeasure(slot, skin)
            : getAddLineOnlyColumnWidthRatioForMeasure(slot, skin);
    }
    return acc;
}

/** 吉他谱列布局：为 slot 登记加时线虚拟 onset 的 widthRatio（不含 DEFAULT） */
export function getGuitarTabExtraOnsetRatios(
    slot: StaffSlot,
    skin: GuitarTabSkinPack,
): Array<{ onsetOffset: number; ratio: number }> {
    const offsets = getSlotAddLineOnsetOffsets(slot);
    return offsets.map((offset, index) => ({
        onsetOffset: offset,
        ratio: index === offsets.length - 1
            ? getLastAddLineColumnWidthRatio(slot, skin)
            : getAddLineOnlyColumnWidthRatio(slot, skin),
    }));
}

/** 加时线 x：取虚拟 onset 列起点（与简谱一致，列左缘） */
export function resolveAddLineXFromLayout(
    layout: MeasureColumnLayout,
    domainStartX: number,
    slotOnset: number,
    lineIndex: number,
): number | null {
    const onset = slotOnset + QUARTER_CHRONAXIE * (lineIndex + 1);
    const geo = layout.onsetColumnGeometry.get(onset);
    if (!geo) return null;
    return domainStartX + geo.startInDomain;
}

/** 附点 x 锚点：无加时线在符头右；有加时线在最后一根加时线 onset 列内 */
export function resolveAugmentationDotAnchorXFromLayout(
    layout: MeasureColumnLayout,
    domainStartX: number,
    slotOnset: number,
    chronaxie: number,
    noteHeadX: number,
    noteHeadW: number,
    addLineSkinW: number,
    augmentationDot?: AugmentationDot,
): number {
    const offsets = getAddLineOnsetOffsets(chronaxie, augmentationDot);
    if (!offsets.length) return noteHeadX + noteHeadW;
    const lastOnset = slotOnset + offsets[offsets.length - 1]!;
    const geo = layout.onsetColumnGeometry.get(lastOnset);
    if (!geo) return noteHeadX + noteHeadW;
    return domainStartX + geo.startInDomain + addLineSkinW;
}

/** 小节的宽度系数（五线谱：仅统计 StaffSlot） */
export function getMeasureWidthRatio(measure: Measure, skin: GuitarTabSkinPack): number {
    let acc = 0;
    acc += resolveWidthRatio(measure.widthRatioForMeasure, skin[GuitarTabSkinKeyEnum.Measure]?.widthRatioForMeasure);
    for (let i = 0; i < measure.notes.length; i++) {
        const slot = measure.notes[i];
        if (isNoteSymbol(slot) || isNoteRest(slot)) {
            acc += getNoteWidthRatioForMeasure(slot, skin);
        }
    }
    if (measure.barline_f) {
        acc += resolveWidthRatio(measure.barline_f.widthRatioForMeasure, skin[getBarlineSkinKey(measure.barline_f.type)]?.widthRatioForMeasure);
    }
    if (measure.barline_b) {
        acc += resolveWidthRatio(measure.barline_b.widthRatioForMeasure, skin[getBarlineSkinKey(measure.barline_b.type)]?.widthRatioForMeasure);
    }
    if (measure.timeSignature_f) {
        acc += resolveWidthRatio(measure.timeSignature_f.widthRatioForMeasure, skin[getTimeSignatureSkinKey(measure.timeSignature_f.type)]?.widthRatioForMeasure);
    }
    if (measure.timeSignature_b) {
        acc += resolveWidthRatio(measure.timeSignature_b.widthRatioForMeasure, skin[getTimeSignatureSkinKey(measure.timeSignature_b.type)]?.widthRatioForMeasure);
    }
    return acc;
}
