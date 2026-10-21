/**
 * 小节符号渲染：前置谱号→前置拍号→音符→后置谱号→后置小节线→后置拍号
 */

import {VDom} from "@/types/common";
import type {tabChord, TabNote, TabNoteInfo, TabRest, TabSlot} from "@/types/MusicScoreType";
import {Tab6SkinKeyEnum} from "@/tab6/enums/tab6SkinKeyEnum";
import type {NodeIdMap, RenderSymbolParams} from "../types";
import {AUGMENTATION_DOT_GAP, TAB_6_STEM_END_OFFSET_RATIO} from "../constants";
import {
    getAugmentationDotSkinKey,
    getBarlineSkinKey,
    getClefSkinKey,
    getRestSkinKey,
    getTabNoteHeadSkinKey,
    getTabNoteValue,
    getTimeSignatureSkinKey,
} from "../utils/skinKey";
import {
    getAddLineCount,
    getRenderableAugmentationDot,
    getSlotRestChronaxie,
    isSlotRest,
    resolveAddLineXFromLayout,
    resolveAugmentationDotAnchorXFromLayout,
} from "../utils/note";
import {isNoteRest, isNoteSymbol, slotSymbol} from "../utils/staffSlot";
import {renderTab6StemAndTailForSlot} from "../note/renderStemAndTail";
import {
    renderGraceNotesAfter,
    renderGraceNotesBefore,
} from "../grace/renderGraceStaff";
import {renderSingleNoteAffiliatedSymbols} from "@/render/affiliated";
import {buildMeasureColumnLayout, computeSlotOnset} from "@/render/layout/measureColumnLayout";
import {createTab6ColumnLayoutAdapter} from "../layout/measureColumnLayoutAdapter";
import {TabNoteInfoTypeEnum} from "@/enums/musicScoreEnum";
import {
    getTabNoteInfoRegion,
    getTabNoteStemAnchorRegion,
    isTabNoteGeometryInfo,
    isTabNoteHeadInfo,
    resolveTabArrowThickness,
    resolveTabArrowWidth
} from "../utils/tabNoteInfo";
import {buildTabChordVDom, isVisibleTabChord} from "../chord/renderTabChord";
import {buildTabSlapVDom} from "../slap/renderTabSlap";
import {buildTabBendVDom} from "../bend/renderTabBend";
import {getMeasureSlots} from '@/utils/measureNotes';

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
        skinKey: typeof Tab6SkinKeyEnum[keyof typeof Tab6SkinKeyEnum];
        tag: VDom['tag'];
        dataComment: string;
        targetId: string;
    };
    /*
    * 获取前置符号的w总和
    * */
    let prefixW = 0;

    if (measure.clef_f) {
        const key = getClefSkinKey(measure.clef_f.type, true);
        const item = skin[key];
        if (item) prefixW += item.w;
    }
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
    if (measure.clef_b) {
        rightParts.push({
            skinKey: getClefSkinKey(measure.clef_b.type, false),
            tag: 'clef_b',
            dataComment: '后置谱号',
            targetId: measure.clef_b.id ?? '',
        });
    }
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
        skinKey: typeof Tab6SkinKeyEnum[keyof typeof Tab6SkinKeyEnum],
        tag: VDom['tag'],
        dataComment: string,
        targetId: string,
        yOffset?: number
    ) => {
        const item = skin[skinKey];
        if (!item) return;
        // tab 谱号上下贴谱表边：强制与小节同高、顶边对齐
        const flushClef = skinKey === Tab6SkinKeyEnum.Tab || skinKey === Tab6SkinKeyEnum.Tab_f;
        const h = flushClef ? measureHeight : item.h;
        let y = flushClef ? measureY : measureY + (measureHeight - item.h) / 2;
        if (yOffset != null) y += yOffset;
        const vdom: VDom = {
            startPoint: {x: 0, y: 0},
            endPoint: {x: 0, y: 0},
            special: {},
            x, y, w: item.w, h, zIndex: z, tag, skinName: skinNameForNodes, targetId, skinKey, dataComment,
        };
        out.push(vdom);
        // 如果添加的vdom存在id, 缓存数据方便查找
        if (targetId) setNodeIdMap(idMap, targetId, vdom);
    };
    /*
    * 依次渲染前置符号并累加x
    * */
    let x = measureX;

    if (measure.clef_f) {
        const clefKey = getClefSkinKey(measure.clef_f.type, true);
        pushSymbol(x, clefKey, 'clef_f', '前置谱号', measure.clef_f.id ?? '');
        const item = skin[clefKey];
        if (item) x += item.w;
    }
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

    const notes = getMeasureSlots(measure);
    const columnAdapter = createTab6ColumnLayoutAdapter(skin, measureHeight);
    const layout =
        columnLayout ?? buildMeasureColumnLayout(measure, noteDomainW, prefixW, columnAdapter, measureHeight);
    const domainStartX = measureX + layout.noteDomainStartOffset;
    /*
    * 定义音符中心点坐标获取函数
    * */
    const noteCenterY = (region: number) =>
        measureY + measureHeight - measureLineWidth / 2
        - region * (measureHeight - 5 * measureLineWidth) / 4
        - region * measureLineWidth;

    function pushTabSlapForNote(note: TabNote): void {
        if (!note.isSlap) return;

        const slapInfos = note.notesInfo.filter(
            (info): info is TabNoteInfo & { type: TabNoteInfoTypeEnum.Normal; region: number } =>
                info.type === TabNoteInfoTypeEnum.Normal && getTabNoteValue(info) === -1,
        );
        if (slapInfos.length === 0) return;

        let topInfo = slapInfos[0];
        let bottomInfo = slapInfos[0];
        for (const info of slapInfos) {
            if (info.region > topInfo.region) topInfo = info;
            if (info.region < bottomInfo.region) bottomInfo = info;
        }

        const topHead = idMap.get(topInfo.id)?.tabNoteNumber;
        const bottomHead = idMap.get(bottomInfo.id)?.tabNoteNumber;
        if (!topHead || !bottomHead) return;

        const startPoint = {x: topHead.x, y: topHead.y};
        const endPoint = {
            x: bottomHead.x + bottomHead.w,
            y: bottomHead.y + bottomHead.h,
        };

        const vdom = buildTabSlapVDom({
            startPoint,
            endPoint,
            targetId: note.id,
            skinName: skinNameForNodes,
            zIndex: z + 75,
        });
        out.push(vdom);
    }

    function pushTabChordForSlot(note: TabNote, slotCenterX: number): void {
        const chord = note.chord;
        if (!isVisibleTabChord(chord)) return;
        const vdom = buildTabChordVDom({
            chord,
            slotCenterX,
            measureY,
            measureHeight,
            targetId: note.id,
            skinName: skinNameForNodes,
            zIndex: z + 80,
        });
        out.push(vdom);
        setNodeIdMap(idMap, note.id, vdom);
    }

    function renderAddLines(
        chronaxie: number,
        augmentationDot: import('@/types/MusicScoreType').AugmentationDot | undefined,
        slotOnset: number,
        targetId: string,
    ): void {
        const addLineCount = getAddLineCount(chronaxie, augmentationDot);
        if (addLineCount <= 0) return;
        const addLineSkin = skin[Tab6SkinKeyEnum.Addline];
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
                skinKey: Tab6SkinKeyEnum.Addline,
                dataComment: '加时线',
            });
        }
    }

    /**
     * 音符附点：一个 slot 只画一个（取首个带附点的 notesInfo），和符尾一样在符干根部右侧；
     * 无符干（全音符）按四分音符符干终点放。连杠时由 processBeam 挪到符杠上方（idMap 挂在符干 targetId 下）
     */
    function pushSlotAugmentationDot(
        allNotesInfo: TabNoteInfo[],
        stem: VDom | undefined,
        slotHeadCenterX: number,
    ): void {
        const dotInfo = allNotesInfo.find((n) => !isTabNoteGeometryInfo(n)
            && getRenderableAugmentationDot(n.chronaxie, n.augmentationDot));
        if (!dotInfo) return;
        const renderableDot = getRenderableAugmentationDot(dotInfo.chronaxie, dotInfo.augmentationDot)!;
        const augSkinKey = getAugmentationDotSkinKey(renderableDot);
        const augSkin = skin[augSkinKey];
        if (!augSkin) return;
        const rootY = stem
            ? stem.y + stem.h
            : measureY + measureHeight + TAB_6_STEM_END_OFFSET_RATIO * measureHeight;
        const rootX = stem ? stem.x + stem.w : slotHeadCenterX;
        const dot: VDom = {
            startPoint: {x: 0, y: 0},
            endPoint: {x: 0, y: 0},
            special: {},
            x: rootX + AUGMENTATION_DOT_GAP * measureHeight,
            y: rootY - augSkin.h,
            w: augSkin.w,
            h: augSkin.h,
            zIndex: z,
            tag: 'augmentationDot',
            skinName: skinNameForNodes,
            targetId: renderableDot.id,
            skinKey: augSkinKey,
            dataComment: '附点',
        };
        out.push(dot);
        const stemTargetId = allNotesInfo[0]?.id;
        if (stemTargetId) setNodeIdMap(idMap, stemTargetId, dot);
    }

    if (notes.length > 0) {
        for (let i = 0; i < notes.length; i++) {
            const sym = slotSymbol(notes[i]);
            if (!isNoteSymbol(sym) && !isNoteRest(sym)) continue;
            const slot = sym as TabSlot;
            const geo = layout.slotGeometries[i];
            if (!geo) continue;
            const slotStartX = domainStartX + geo.startInDomain;
            const slotW = geo.width;
            const tabBody = slot as import('@/types/MusicScoreType').StaffSlot;
            const isRest = isSlotRest(tabBody);
            if (isRest && !skin[getRestSkinKey(getSlotRestChronaxie(tabBody))]) continue;
            const slotOnset = computeSlotOnset(measure, i, columnAdapter);
            /** 零宽槽位锚点 x（未叠加 Frame）；符头 / 休止 / 符干均相对此点居中 */
            const slotX = slotStartX;
            const slotHeadCenterX = slotX;
            /*
            * 渲染音符前谱号
            * */

            // 渲染休止符
            if (isRest) {
                const rest = sym as TabRest;
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
                    x: slotX - restItem.w / 2,
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
                        const addLineSkin = skin[Tab6SkinKeyEnum.Addline];
                        if (augSkin) {
                            const restHeadX = slotX - restItem.w / 2;
                            const anchorX = resolveAugmentationDotAnchorXFromLayout(
                                layout,
                                domainStartX,
                                slotOnset,
                                restChronaxie,
                                restHeadX,
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
                continue;
            }

            const note = sym as unknown as TabNote;
            const allNotesInfo = note.notesInfo;

            // 1) 普通符头相对 slot 锚点居中；琶音/扫弦仅输出箭头 vDom
            allNotesInfo.forEach((n) => {
                const info = n as TabNoteInfo;
                if (isTabNoteGeometryInfo(info)) {
                    const thickness = resolveTabArrowThickness(info);
                    const arrowWidth = resolveTabArrowWidth(info);
                    const isArpeggio = info.type === TabNoteInfoTypeEnum.Arpeggio;
                    const skinKey = isArpeggio
                        ? Tab6SkinKeyEnum.Arpeggio
                        : Tab6SkinKeyEnum.Strumming;
                    const geomStyle = {thickness, arrowWidth};
                    const vdom: VDom = {
                        startPoint: {
                            x: slotHeadCenterX,
                            y: noteCenterY(info.regionRange.start),
                        },
                        endPoint: {
                            x: slotHeadCenterX,
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
                const headKey = getTabNoteHeadSkinKey(info);
                const headItem = skin[headKey];
                if (!headItem) return;
                const region = getTabNoteInfoRegion(info);
                const headX = slotX - headItem.w / 2;
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
                if (isTabNoteHeadInfo(info) && info.bend) {
                    const noteCenterX = headX + headItem.w / 2;
                    const noteCenterYVal = noteCenterY(region);
                    const bendVDom = buildTabBendVDom({
                        bend: info.bend,
                        noteCenterX,
                        noteCenterY: noteCenterYVal,
                        slotEndX: slotStartX + slotW,
                        measureHeight,
                        skinName: skinNameForNodes,
                        zIndex: z + 70,
                    });
                    if (bendVDom) {
                        out.push(bendVDom);
                    }
                }
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
            const primaryHeadX = primaryHead?.x ?? slotX;
            const primaryHeadW = primaryHead?.w ?? (
                allNotesInfo[0]
                    ? skin[getTabNoteHeadSkinKey(allNotesInfo[0])]?.w ?? 0
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

            // 加时线：时值取 notes[0]
            const primaryInfo = allNotesInfo[0];
            if (primaryInfo) {
                renderAddLines(primaryInfo.chronaxie, primaryInfo.augmentationDot, slotOnset, primaryInfo.id);
            }

            // 7) 符干符尾：锚 region 取全体 region / regionRange 端点最小值；x 对齐 slot 中心
            const stemTailVDoms = renderTab6StemAndTailForSlot({
                note,
                allNotesInfo: allNotesInfo as TabNoteInfo[],
                idMap,
                slotCenterX: slotHeadCenterX,
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
            pushSlotAugmentationDot(
                allNotesInfo as TabNoteInfo[],
                stemTailVDoms.find((v) => v.tag === 'noteStem'),
                slotHeadCenterX,
            );
            pushTabSlapForNote(note);
            pushTabChordForSlot(note, slotHeadCenterX);
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

/** 计算前置小节线在小节内的左边缘 x（clef_f + timeSig_f 之后，供连谱小节线 barline_f 定位） */
export function getBarlineFXInMeasure(
    measure: import("@/types/MusicScoreType").Measure,
    measureX: number,
    skin: import("@/types/common").Tab6SkinPack,
): number {
    let prefixW = 0;
    if (measure.clef_f) {
        const item = skin[getClefSkinKey(measure.clef_f.type, true)];
        if (item) prefixW += item.w;
    }
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
    skin: import("@/types/common").Tab6SkinPack,
): number {
    const rightKeys: typeof Tab6SkinKeyEnum[keyof typeof Tab6SkinKeyEnum][] = [];
    if (measure.clef_b) rightKeys.push(getClefSkinKey(measure.clef_b.type, false));
    if (measure.barline_b) rightKeys.push(getBarlineSkinKey(measure.barline_b.type));
    if (measure.timeSignature_b) rightKeys.push(getTimeSignatureSkinKey(measure.timeSignature_b.type));
    let suffixW = 0;
    for (const k of rightKeys) {
        const item = skin[k];
        if (item) suffixW += item.w;
    }
    let x = measureX + measureWidth - suffixW;
    const barlineIdx = measure.clef_b ? 1 : 0;
    for (let j = 0; j < barlineIdx && j < rightKeys.length; j++) {
        const item = skin[rightKeys[j]];
        if (item) x += item.w;
    }
    return x;
}
