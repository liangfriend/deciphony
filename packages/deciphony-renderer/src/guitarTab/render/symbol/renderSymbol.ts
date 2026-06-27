/**
 * 小节符号渲染：前置拍号→音符→后置小节线→后置拍号
 */

import {VDom} from "@/types/common";
import type {NoteRest, NotesInfo, NoteSymbol, StaffSlot, tabChord, TabNoteInfo} from "@/types/MusicScoreType";
import {GuitarTabSkinKeyEnum} from "@/guitarTab/enums/guitarTabSkinKeyEnum";
import type {NodeIdMap, RenderSymbolParams} from "../types";
import {AUGMENTATION_DOT_GAP} from "../constants";
import {
    getAugmentationDotSkinKey,
    getBarlineSkinKey,
    getRestSkinKey,
    getTabNoteSkinKey,
    getTabNoteValue,
    getTimeSignatureSkinKey,
} from "../utils/skinKey";
import {
    getAddLineCount,
    getRenderableAugmentationDot,
    getSlotAddLineOnsetOffsets,
    getSlotRestChronaxie,
    isSlotRest,
    resolveAddLineXFromLayout,
    resolveAugmentationDotAnchorXFromLayout,
} from "../utils/note";
import {isNoteSymbol, isStaffSlot} from "../utils/staffSlot";
import {renderGuitarTabStemAndTailForSlot} from "../note/renderStemAndTail";
import {
    graceAfterWidth,
    graceBeforeWidth,
    renderGraceNotesAfter,
    renderGraceNotesBefore,
} from "../grace/renderGraceStaff";
import {renderSingleNoteAffiliatedSymbols} from "@/render/affiliated";
import {buildMeasureColumnLayout, computeSlotOnset} from "@/render/layout/measureColumnLayout";
import {createGuitarTabColumnLayoutAdapter} from "../layout/measureColumnLayoutAdapter";
import {TabNoteInfoTypeEnum} from "@/enums/musicScoreEnum";
import {
    getTabNoteInfoRegion,
    getTabNoteStemAnchorRegion,
    isTabNoteGeometryInfo,
    resolveTabArrowThickness,
    resolveTabArrowWidth
} from "../utils/tabNoteInfo";
import {buildTabChordVDom} from "../chord/renderTabChord";

function setNodeIdMap(map: NodeIdMap, id: string, vdom: VDom): void {
    let obj = map.get(id);
    if (!obj) {
        obj = {};
        map.set(id, obj);
    }
    obj[vdom.tag] = vdom;
}

export function renderSymbol(params: RenderSymbolParams): VDom[] {
    const {
        measure,
        measureX,
        measureY,
        measureWidth,
        measureHeight,
        measureLineWidth,
        skin,
        idMap,
        skinName,
        columnLayout,
    } = params;
    const skinNameForNodes = skinName ?? 'default';
    const out: VDom[] = [];
    const z = 1200;

    type RightPart = {
        skinKey: typeof GuitarTabSkinKeyEnum[keyof typeof GuitarTabSkinKeyEnum];
        tag: VDom['tag'];
        dataComment: string;
        targetId: string;
    };
    /*
    * 获取前置符号的w总和
    * */
    let prefixW = 0;

    if (measure.timeSignature_f) {
        const key = getTimeSignatureSkinKey(measure.timeSignature_f.type);
        const item = skin[key];
        if (item) prefixW += item.w;
    }
    if (measure.barline_f) {
        const key = getBarlineSkinKey(measure.barline_f.type);
        const item = skin[key];
        if (item) prefixW += item.w;
    }

    const rightParts: RightPart[] = [];
    if (measure.barline_b) {
        rightParts.push({
            skinKey: getBarlineSkinKey(measure.barline_b.type),
            tag: 'barline_b',
            dataComment: '后置小节线',
            targetId: measure.barline_b.id ?? '',
        });
    }


    if (measure.timeSignature_b) {
        rightParts.push({
            skinKey: getTimeSignatureSkinKey(measure.timeSignature_b.type),
            tag: 'timeSignature_b',
            dataComment: '后置拍号',
            targetId: measure.timeSignature_b.id ?? '',
        });
    }
    let suffixW = 0;
    /*
    * 获取后置符号的w总和
    * */
    for (const p of rightParts) {
        const item = skin[p.skinKey];
        if (item) suffixW += item.w;
    }
    // 计算出留给音符的w总和
    const noteDomainW = Math.max(0, measureWidth - prefixW - suffixW);
    /*
    * 定义vodm添加函数
    * */
    const pushSymbol = (
        x: number,
        skinKey: typeof GuitarTabSkinKeyEnum[keyof typeof GuitarTabSkinKeyEnum],
        tag: VDom['tag'],
        dataComment: string,
        targetId: string,
        yOffset?: number
    ) => {
        const item = skin[skinKey];
        if (!item) return;
        let y = measureY + (measureHeight - item.h) / 2;
        if (yOffset != null) y += yOffset;
        const vdom: VDom = {
            startPoint: {x: 0, y: 0},
            endPoint: {x: 0, y: 0},
            special: {},
            x, y, w: item.w, h: item.h, zIndex: z, tag, skinName: skinNameForNodes, targetId, skinKey, dataComment,
        };
        out.push(vdom);
        // 如果添加的vdom存在id, 缓存数据方便查找
        if (targetId) setNodeIdMap(idMap, targetId, vdom);
    };
    /*
    * 依次渲染前置符号并累加x
    * */
    let x = measureX;

    if (measure.timeSignature_f) {
        const timeSigKey = getTimeSignatureSkinKey(measure.timeSignature_f.type);
        pushSymbol(x, timeSigKey, 'timeSignature_f', '前置拍号', measure.timeSignature_f.id ?? '');
        const item = skin[timeSigKey];
        if (item) x += item.w;
    }
    if (measure.barline_f) {
        const barlineKey = getBarlineSkinKey(measure.barline_f.type);
        pushSymbol(x, barlineKey, 'barline_f', '前置小节线', measure.barline_f.id ?? '');
        const item = skin[barlineKey];
        if (item) x += item.w;
    }

    const notes = measure.notes;
    const columnAdapter = createGuitarTabColumnLayoutAdapter(skin, measureHeight);
    const layout =
        columnLayout ?? buildMeasureColumnLayout(measure, noteDomainW, prefixW, columnAdapter);
    const domainStartX = measureX + layout.noteDomainStartOffset;
    /*
    * 定义音符中心点坐标获取函数
    * */
    const noteCenterY = (region: number) =>
        measureY + measureHeight - measureLineWidth / 2
        - region * (measureHeight - 6 * measureLineWidth) / 5
        - region * measureLineWidth;

    function pushTabChordForSlot(slot: StaffSlot, slotCenterX: number): void {
        const chord = (slot as { chord?: tabChord }).chord;
        if (!chord) return;
        const vdom = buildTabChordVDom({
            chord,
            slotCenterX,
            measureY,
            measureHeight,
            targetId: slot.id,
            skinName: skinNameForNodes,
            zIndex: z + 80,
        });
        out.push(vdom);
        setNodeIdMap(idMap, slot.id, vdom);
    }

    function renderAddLines(
        chronaxie: number,
        augmentationDot: import('@/types/MusicScoreType').AugmentationDot | undefined,
        slotOnset: number,
        targetId: string,
    ): void {
        const addLineCount = getAddLineCount(chronaxie, augmentationDot);
        if (addLineCount <= 0) return;
        const addLineSkin = skin[GuitarTabSkinKeyEnum.Addline];
        if (!addLineSkin) return;
        const lineY = measureY + measureHeight / 2 - addLineSkin.h / 2;
        for (let k = 0; k < addLineCount; k++) {
            const lineX = resolveAddLineXFromLayout(layout, domainStartX, slotOnset, k);
            if (lineX == null) continue;
            out.push({
                startPoint: {x: 0, y: 0},
                endPoint: {x: 0, y: 0},
                special: {},
                x: lineX,
                y: lineY,
                w: addLineSkin.w,
                h: addLineSkin.h,
                zIndex: z,
                tag: 'addLine',
                skinName: skinNameForNodes,
                targetId,
                skinKey: GuitarTabSkinKeyEnum.Addline,
                dataComment: '加时线',
            });
        }
    }

    if (notes.length > 0) {
        for (let i = 0; i < notes.length; i++) {
            const slot = notes[i];
            if (!isStaffSlot(slot)) continue;
            const geo = layout.slotGeometries[i];
            if (!geo) continue;
            const slotStartX = domainStartX + geo.startInDomain;
            const slotW = geo.width;
            const isRest = isSlotRest(slot);
            // 参考宽度：用于在 slot 内居中。休止符用休止符皮肤宽；音符用该 slot 内所有声部符头皮肤的最大宽（全/二分/四分符头尺寸可能不同）
            let referenceW: number;
            if (isRest) {
                const restItem = skin[getRestSkinKey(getSlotRestChronaxie(slot))];
                if (!restItem) continue;
                referenceW = restItem.w;
            } else {
                referenceW = 0;
                for (const ni of slot.notesInfo) {
                    const headSkin = skin[getTabNoteSkinKey(getTabNoteValue(ni))];
                    if (headSkin && headSkin.w > referenceW) referenceW = headSkin.w;
                }
            }
            let graceBeforeW = 0;
            let graceAfterW = 0;
            if (!isRest && isNoteSymbol(slot)) {
                graceBeforeW = graceBeforeWidth(slot.graceNotes, skin, measureHeight);
                graceAfterW = graceAfterWidth(slot.graceNotesAfter, skin, measureHeight);
            }
            const slotOnset = computeSlotOnset(measure, i, columnAdapter);
            const hasAddLines = getSlotAddLineOnsetOffsets(slot).length > 0;
            /** 槽位内布局锚点 x（未叠加 Frame）；有加时线时符头居左，否则 slot 内居中 */
            const slotX = hasAddLines
                ? slotStartX + graceBeforeW
                : slotStartX + (slotW - graceBeforeW - referenceW - graceAfterW) / 2 + graceBeforeW;
            /*
            * 渲染音符前谱号
            * */

            // 渲染休止符
            if (isRest) {
                const rest = slot as NoteRest;
                const restChronaxie = getSlotRestChronaxie(rest);
                const headKey = getRestSkinKey(restChronaxie);
                const restItem = skin[headKey];
                if (!restItem) continue;
                let ny: number;
                if (restChronaxie === 256) ny = measureY + measureHeight / 4;
                else if (restChronaxie === 128) ny = measureY + measureHeight / 2 - restItem.h;
                else ny = measureY + (measureHeight - restItem.h) / 2;
                const vdom: VDom = {
                    startPoint: {x: 0, y: 0},
                    endPoint: {x: 0, y: 0},
                    special: {},
                    x: slotX,
                    y: ny,
                    w: restItem.w,
                    h: restItem.h,
                    zIndex: z,
                    tag: 'rest',
                    skinName: skinNameForNodes,
                    targetId: rest.id,
                    skinKey: headKey,
                    dataComment: '休止符',
                };
                out.push(vdom);
                setNodeIdMap(idMap, rest.id, vdom);
                if (rest.augmentationDot) {
                    const renderableDot = getRenderableAugmentationDot(restChronaxie, rest.augmentationDot);
                    if (renderableDot) {
                        const augSkinKey = getAugmentationDotSkinKey(renderableDot);
                        const augSkin = skin[augSkinKey];
                        const addLineSkin = skin[GuitarTabSkinKeyEnum.Addline];
                        if (augSkin) {
                            const anchorX = resolveAugmentationDotAnchorXFromLayout(
                                layout,
                                domainStartX,
                                slotOnset,
                                restChronaxie,
                                slotX,
                                restItem.w,
                                addLineSkin?.w ?? 0,
                                rest.augmentationDot,
                            );
                            const augX = anchorX + AUGMENTATION_DOT_GAP * measureHeight;
                            const augY = ny + restItem.h / 2 - augSkin.h / 2;
                            out.push({
                                startPoint: {x: 0, y: 0},
                                endPoint: {x: 0, y: 0},
                                special: {},
                                x: augX,
                                y: augY,
                                w: augSkin.w,
                                h: augSkin.h,
                                zIndex: z,
                                tag: 'augmentationDot',
                                skinName: skinNameForNodes,
                                targetId: renderableDot.id,
                                skinKey: augSkinKey,
                                dataComment: '休止符附点',
                            });
                        }
                    }
                }
                renderAddLines(restChronaxie, rest.augmentationDot, slotOnset, rest.id);
                renderSingleNoteAffiliatedSymbols(rest.affiliatedSymbols ?? [], vdom, {
                    VDoms: out,
                    idMap,
                    skinName: skinNameForNodes,
                    skin,
                    measureHeight,
                });
                pushTabChordForSlot(rest, slotX + restItem.w / 2);
                continue;
            }

            const note = slot;
            const allNotesInfo = note.notesInfo;


            const slotCenterX = slotX + slotW / 2;

            // 1) 普通符头居中；琶音/扫弦仅输出箭头 vDom
            allNotesInfo.forEach((n) => {
                const info = n as TabNoteInfo;
                if (isTabNoteGeometryInfo(info)) {
                    const thickness = resolveTabArrowThickness(info);
                    const arrowWidth = resolveTabArrowWidth(info);
                    const isArpeggio = info.type === TabNoteInfoTypeEnum.Arpeggio;
                    const skinKey = isArpeggio
                        ? GuitarTabSkinKeyEnum.Arpeggio
                        : GuitarTabSkinKeyEnum.Strumming;
                    const geomStyle = {thickness, arrowWidth};
                    const vdom: VDom = {
                        startPoint: {
                            x: slotCenterX,
                            y: noteCenterY(info.regionRange.start),
                        },
                        endPoint: {
                            x: slotCenterX,
                            y: noteCenterY(info.regionRange.end),
                        },
                        special: isArpeggio
                            ? {arpeggio: geomStyle}
                            : {strumming: geomStyle},
                        x: 0,
                        y: 0,
                        w: arrowWidth,
                        h: 0,
                        zIndex: z,
                        tag: isArpeggio ? 'arpeggio' : 'strumming',
                        skinName: skinNameForNodes,
                        targetId: info.id,
                        skinKey,
                        dataComment: isArpeggio ? '琶音' : '扫弦',
                    };
                    out.push(vdom);
                    setNodeIdMap(idMap, info.id, vdom);
                    return;
                }
                const headKey = getTabNoteSkinKey(getTabNoteValue(n));
                const headItem = skin[headKey];
                if (!headItem) return;
                const region = getTabNoteInfoRegion(info);
                const headX = slotCenterX - headItem.w / 2;
                const ny = noteCenterY(region) - headItem.h / 2;
                const vdom: VDom = {
                    startPoint: {x: 0, y: 0},
                    endPoint: {x: 0, y: 0},
                    special: {},
                    x: headX,
                    y: ny,
                    w: headItem.w,
                    h: headItem.h,
                    zIndex: z,
                    tag: 'tabNoteNumber',
                    skinName: skinNameForNodes,
                    targetId: n.id,
                    skinKey: headKey,
                    dataComment: '音符',
                };
                out.push(vdom);
                setNodeIdMap(idMap, n.id, vdom);
                renderSingleNoteAffiliatedSymbols(n.affiliatedSymbols, vdom, {
                    VDoms: out,
                    idMap,
                    skinName: skinNameForNodes,
                    skin,
                    measureHeight,
                });
            });

            // 倚音/附点的参考音符头（首个有符头的 notesInfo）
            const primaryHead = allNotesInfo
                .map((ni) => idMap.get(ni.id)?.tabNoteNumber)
                .find((h) => h != null);
            const primaryHeadX = primaryHead?.x ?? slotCenterX;
            const primaryHeadW = primaryHead?.w ?? (
                allNotesInfo[0]
                    ? skin[getTabNoteSkinKey(getTabNoteValue(allNotesInfo[0]))]?.w ?? 0
                    : 0
            );

            const graceCtx = {
                noteCenterY,
                measureY,
                measureHeight,
                measureLineWidth,
                measureWidth,
                skin,
                skinName: skinNameForNodes,
                zIndex: z,
                note,
                idMap,
                out,
            };

            // 3) 前倚音
            renderGraceNotesBefore(note.graceNotes, primaryHeadX, graceCtx);


            // 5) 后倚音
            renderGraceNotesAfter(note.graceNotesAfter, primaryHeadX, primaryHeadW, graceCtx);

            // 6) 附点：仅普通音符
            allNotesInfo.forEach((n, niIdx) => {
                if (isTabNoteGeometryInfo(n as TabNoteInfo)) return;
                if (!n.augmentationDot) return;
                const renderableDot = getRenderableAugmentationDot(n.chronaxie, n.augmentationDot);
                if (!renderableDot) return;
                const headVDom = idMap.get(n.id)?.tabNoteNumber;
                const noteHeadX = headVDom?.x ?? slotCenterX;
                const noteHeadW = headVDom?.w ?? (skin[getTabNoteSkinKey(getTabNoteValue(n))]?.w ?? 0);
                const augSkinKey = getAugmentationDotSkinKey(renderableDot);
                const augSkin = skin[augSkinKey];
                if (!augSkin) return;
                const addLineSkin = skin[GuitarTabSkinKeyEnum.Addline];
                const anchorX = niIdx === 0 && hasAddLines
                    ? resolveAugmentationDotAnchorXFromLayout(
                        layout,
                        domainStartX,
                        slotOnset,
                        n.chronaxie,
                        noteHeadX,
                        noteHeadW,
                        addLineSkin?.w ?? 0,
                        n.augmentationDot,
                    )
                    : noteHeadX + noteHeadW;
                const augX = anchorX + AUGMENTATION_DOT_GAP * measureHeight;
                const region = getTabNoteInfoRegion(n as TabNoteInfo);
                let augY = noteCenterY(region) - augSkin.h / 2;
                if (region % 2 === 0) augY -= measureHeight / 8;
                out.push({
                    startPoint: {x: 0, y: 0},
                    endPoint: {x: 0, y: 0},
                    special: {},
                    x: augX,
                    y: augY,
                    w: augSkin.w,
                    h: augSkin.h,
                    zIndex: z,
                    tag: 'augmentationDot',
                    skinName: skinNameForNodes,
                    targetId: renderableDot.id,
                    skinKey: augSkinKey,
                    dataComment: '附点',
                });
            });

            // 加时线：时值取 notes[0]
            const primaryInfo = allNotesInfo[0];
            if (primaryInfo) {
                renderAddLines(primaryInfo.chronaxie, primaryInfo.augmentationDot, slotOnset, primaryInfo.id);
            }

            // 7) 符干符尾：锚 region 取全体 region / regionRange 端点最小值；x 对齐 slot 中心
            const stemTailVDoms = renderGuitarTabStemAndTailForSlot({
                note,
                allNotesInfo: allNotesInfo as TabNoteInfo[],
                idMap,
                slotCenterX,
                measureY,
                measureHeight,
                skin,
                zIndex: z,
                skinName: skinNameForNodes,
                noteCenterY,
            });
            for (const v of stemTailVDoms) {
                out.push(v);
                if (v.targetId) setNodeIdMap(idMap, v.targetId, v);
            }
            pushTabChordForSlot(note, slotCenterX);
        }
    }

    x = measureX + measureWidth - suffixW;
    for (const p of rightParts) {
        pushSymbol(x, p.skinKey, p.tag, p.dataComment, p.targetId);
        const item = skin[p.skinKey];
        if (item) x += item.w;
    }

    return out;
}

/** 计算前置小节线在小节内的左边缘 x（timeSig_f 之后，供连谱小节线 barline_f 定位） */
export function getBarlineFXInMeasure(
    measure: import("@/types/MusicScoreType").Measure,
    measureX: number,
    skin: import("@/types/common").GuitarTabSkinPack,
): number {
    let prefixW = 0;

    if (measure.timeSignature_f) {
        const item = skin[getTimeSignatureSkinKey(measure.timeSignature_f.type)];
        if (item) prefixW += item.w;
    }
    return measureX + prefixW;
}

/** 计算后置小节线在小节内的左边缘 x（与 renderSymbol 中 rightParts 摆放一致，供连谱小节线 barline_b 定位） */
export function getBarlineXInMeasure(
    measure: import("@/types/MusicScoreType").Measure,
    measureX: number,
    measureWidth: number,
    skin: import("@/types/common").GuitarTabSkinPack,
): number {
    const rightKeys: typeof GuitarTabSkinKeyEnum[keyof typeof GuitarTabSkinKeyEnum][] = [];
    if (measure.barline_b) rightKeys.push(getBarlineSkinKey(measure.barline_b.type));
    if (measure.timeSignature_b) rightKeys.push(getTimeSignatureSkinKey(measure.timeSignature_b.type));
    let suffixW = 0;
    for (const k of rightKeys) {
        const item = skin[k];
        if (item) suffixW += item.w;
    }
    let x = measureX + measureWidth - suffixW;
    const barlineIdx = 0; // barline_b 在 rightParts 第一位
    for (let j = 0; j < barlineIdx && j < rightKeys.length; j++) {
        const item = skin[rightKeys[j]];
        if (item) x += item.w;
    }
    return x;
}
