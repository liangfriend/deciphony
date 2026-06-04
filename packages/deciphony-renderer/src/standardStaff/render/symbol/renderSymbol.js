/**
 * 小节符号渲染：前置谱号→前置调号→前置拍号→音符→后置谱号→小节线→后置调号→后置拍号
 */
import { AccidentalTypeEnum } from "@/enums/musicScoreEnum";
import { StandardStaffSkinKeyEnum } from "@/standardStaff/enums/standardStaffSkinKeyEnum";
import { ACCIDENTAL_NOTE_GAP, AUGMENTATION_DOT_GAP, CLEF_NOTE_GAP_RATIO } from "../constants";
import { addLineBoxAt } from "../utils/addLine";
import { getAccidentalSkinKey, getAugmentationDotSkinKey, getBarlineSkinKey, getClefForMeasure, getClefSkinKey, getKeySignatureSkinKey, getKeySignatureYOffset, getNoteHeadSkinKey, getRestSkinKey, getTimeSignatureSkinKey, } from "../utils/skinKey";
import { getNoteWidthRatio, getSlotRestChronaxie, getVoiceGroups, isSlotRest } from "../utils/note";
import { isNoteSymbol, isStaffSlot } from "../utils/staffSlot";
import { renderStemAndTail } from "../note/renderStemAndTail";
import { graceAfterWidth, graceBeforeWidth, renderGraceNotesAfter, renderGraceNotesBefore, } from "../grace/renderGraceStaff";
import { renderSingleNoteAffiliatedSymbols } from "@/render/affiliated";
function setNodeIdMap(map, id, vdom) {
    let obj = map.get(id);
    if (!obj) {
        obj = {};
        map.set(id, obj);
    }
    obj[vdom.tag] = vdom;
}
export function renderSymbol(params) {
    const { measure, measures, measureIndex, measureX, measureY, measureWidth, measureHeight, measureLineWidth, skin, idMap, skinName, } = params;
    const skinNameForNodes = skinName ?? 'default';
    const out = [];
    const z = 1200;
    const clefType = getClefForMeasure(measures, measureIndex);
    const keySignatureYOffset = getKeySignatureYOffset(clefType, measureHeight, measureLineWidth);
    /*
    * 获取前置符号的w总和
    * */
    let prefixW = 0;
    if (measure.clef_f) {
        const key = getClefSkinKey(measure.clef_f.type, true);
        const item = skin[key];
        if (item)
            prefixW += item.w;
    }
    if (measure.keySignature_f) {
        const key = getKeySignatureSkinKey(measure.keySignature_f.type);
        const item = skin[key];
        if (item)
            prefixW += item.w;
    }
    if (measure.timeSignature_f) {
        const key = getTimeSignatureSkinKey(measure.timeSignature_f.type);
        const item = skin[key];
        if (item)
            prefixW += item.w;
    }
    if (measure.barline_f) {
        const key = getBarlineSkinKey(measure.barline_f.type);
        const item = skin[key];
        if (item)
            prefixW += item.w;
    }
    const rightParts = [];
    if (measure.barline_b) {
        rightParts.push({
            skinKey: getBarlineSkinKey(measure.barline_b.type),
            tag: 'barline_b',
            dataComment: '后置小节线',
            targetId: measure.barline_b.id ?? '',
        });
    }
    if (measure.clef_b) {
        rightParts.push({
            skinKey: getClefSkinKey(measure.clef_b.type, false),
            tag: 'clef_b',
            dataComment: '后置谱号',
            targetId: measure.clef_b.id ?? '',
        });
    }
    if (measure.keySignature_b) {
        rightParts.push({
            skinKey: getKeySignatureSkinKey(measure.keySignature_b.type),
            tag: 'keySignature_b',
            dataComment: '后置调号',
            targetId: measure.keySignature_b.id ?? '',
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
        if (item)
            suffixW += item.w;
    }
    // 计算出留给音符的w总和
    const noteDomainW = Math.max(0, measureWidth - prefixW - suffixW);
    /*
    * 定义vodm添加函数
    * */
    const pushSymbol = (x, skinKey, tag, dataComment, targetId, yOffset) => {
        const item = skin[skinKey];
        if (!item)
            return;
        let y = measureY + (measureHeight - item.h) / 2;
        if (yOffset != null)
            y += yOffset;
        const vdom = {
            startPoint: { x: 0, y: 0 },
            endPoint: { x: 0, y: 0 },
            special: {},
            x, y, w: item.w, h: item.h, zIndex: z, tag, skinName: skinNameForNodes, targetId, skinKey, dataComment,
        };
        out.push(vdom);
        // 如果添加的vdom存在id, 缓存数据方便查找
        if (targetId)
            setNodeIdMap(idMap, targetId, vdom);
    };
    /*
    * 依次渲染前置符号并累加x
    * */
    let x = measureX;
    if (measure.clef_f) {
        const clefKey = getClefSkinKey(measure.clef_f.type, true);
        pushSymbol(x, clefKey, 'clef_f', '前置谱号', measure.clef_f.id ?? '');
        const item = skin[clefKey];
        if (item)
            x += item.w;
    }
    if (measure.keySignature_f) {
        const keySigKey = getKeySignatureSkinKey(measure.keySignature_f.type);
        pushSymbol(x, keySigKey, 'keySignature_f', '前置调号', measure.keySignature_f.id ?? '', keySignatureYOffset);
        const item = skin[keySigKey];
        if (item)
            x += item.w;
    }
    if (measure.timeSignature_f) {
        const timeSigKey = getTimeSignatureSkinKey(measure.timeSignature_f.type);
        pushSymbol(x, timeSigKey, 'timeSignature_f', '前置拍号', measure.timeSignature_f.id ?? '');
        const item = skin[timeSigKey];
        if (item)
            x += item.w;
    }
    if (measure.barline_f) {
        const barlineKey = getBarlineSkinKey(measure.barline_f.type);
        pushSymbol(x, barlineKey, 'barline_f', '前置小节线', measure.barline_f.id ?? '');
        const item = skin[barlineKey];
        if (item)
            x += item.w;
    }
    const notes = measure.notes;
    // 计算当前小节总的widthRatio
    const totalNoteRatio = notes.reduce((sum, n) => {
        if (!isStaffSlot(n))
            return sum;
        return sum + getNoteWidthRatio(n, skin, measureHeight);
    }, 0);
    const domainStartX = measureX + prefixW;
    /*
    * 定义音符中心点坐标获取函数
    * */
    const noteCenterY = (region) => measureY + measureHeight - measureLineWidth / 2
        - region * (measureHeight - 5 * measureLineWidth) / 8
        - region * measureLineWidth / 2;
    /*
    * 使用均等槽位
    * 如果曲谱数据的widthRatio没有设置好，出现了不合理的总宽度系数，则使用均等槽位模式
    * 所有符号宽度域等比分配
    * 这个正常来讲不应该被用到，属于一个防报错手段
    * */
    const useEqualSlots = notes.length > 0 && totalNoteRatio <= 0;
    if (notes.length > 0) {
        let accRatio = 0;
        const slotWidth = useEqualSlots ? noteDomainW / notes.length : 0;
        for (let i = 0; i < notes.length; i++) {
            const slot = notes[i];
            if (!isStaffSlot(slot))
                continue;
            const ratio = useEqualSlots ? 1 : getNoteWidthRatio(slot, skin, measureHeight);
            // 计算出符号域宽度
            const slotW = useEqualSlots ? slotWidth : (ratio / totalNoteRatio) * noteDomainW;
            // 计算出符号域开始x值
            const slotStartX = domainStartX + (useEqualSlots ? i * slotWidth : (accRatio / totalNoteRatio) * noteDomainW);
            if (!useEqualSlots)
                accRatio += ratio;
            const isRest = isSlotRest(slot);
            // 参考宽度：用于在 slot 内居中。休止符用休止符皮肤宽；音符用该 slot 内所有声部符头皮肤的最大宽（全/二分/四分符头尺寸可能不同）
            let referenceW;
            if (isRest) {
                const restItem = skin[getRestSkinKey(getSlotRestChronaxie(slot))];
                if (!restItem)
                    continue;
                referenceW = restItem.w;
            }
            else {
                const voiceGroups = getVoiceGroups(slot);
                referenceW = 0;
                for (const group of voiceGroups) {
                    const headSkin = skin[getNoteHeadSkinKey(group.chronaxie)];
                    if (headSkin && headSkin.w > referenceW)
                        referenceW = headSkin.w;
                }
            }
            let graceBeforeW = 0;
            let graceAfterW = 0;
            if (!isRest && isNoteSymbol(slot)) {
                graceBeforeW = graceBeforeWidth(slot.graceNotes, skin, measureHeight);
                graceAfterW = graceAfterWidth(slot.graceNotesAfter, skin, measureHeight);
            }
            const headX = slotStartX + (slotW - graceBeforeW - referenceW - graceAfterW) / 2 + graceBeforeW;
            /*
            * 渲染音符前谱号
            * */
            if (slot.clef) {
                const clefKey = getClefSkinKey(slot.clef.type, true);
                const clefItem = skin[clefKey];
                if (clefItem) {
                    const clefX = headX - CLEF_NOTE_GAP_RATIO * measureHeight - clefItem.w;
                    const clefY = measureY - (clefItem.h - measureHeight) / 2;
                    const clefVDom = {
                        startPoint: { x: 0, y: 0 },
                        endPoint: { x: 0, y: 0 },
                        special: {},
                        x: clefX, y: clefY, w: clefItem.w, h: clefItem.h,
                        zIndex: z, tag: 'clef_f', skinName: skinNameForNodes, targetId: slot.clef.id,
                        skinKey: clefKey, dataComment: '音符前谱号',
                    };
                    out.push(clefVDom);
                    setNodeIdMap(idMap, slot.clef.id, clefVDom);
                }
            }
            // 渲染休止符
            if (isRest) {
                const rest = slot;
                const restChronaxie = getSlotRestChronaxie(rest);
                const headKey = getRestSkinKey(restChronaxie);
                const restItem = skin[headKey];
                if (!restItem)
                    continue;
                let ny;
                if (restChronaxie === 256)
                    ny = measureY + measureHeight / 4;
                else if (restChronaxie === 128)
                    ny = measureY + measureHeight / 2 - restItem.h;
                else
                    ny = measureY + (measureHeight - restItem.h) / 2;
                const vdom = {
                    startPoint: { x: 0, y: 0 },
                    endPoint: { x: 0, y: 0 },
                    special: {},
                    x: headX,
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
                renderSingleNoteAffiliatedSymbols(rest.affiliatedSymbols ?? [], vdom, {
                    VDoms: out,
                    idMap,
                    skinName: skinNameForNodes,
                    skin,
                    measureHeight,
                });
                continue;
            }
            const note = slot;
            const voiceGroups = getVoiceGroups(note);
            let firstHeadVDom = null;
            const addLineSkinD = skin[StandardStaffSkinKeyEnum.AddLine_d];
            const addLineSkinU = skin[StandardStaffSkinKeyEnum.AddLine_u];
            const drawVoice = (group) => {
                const directionUp = group.direction === 'up';
                const beat = group;
                const regions = beat.notesInfo.map((n) => n.region);
                const headKey = getNoteHeadSkinKey(beat.chronaxie);
                const headItem = skin[headKey];
                if (!headItem)
                    return;
                const minRegion = Math.min(...regions);
                const maxRegion = Math.max(...regions);
                const ledgerCenterX = headX + headItem.w / 2;
                const extremeRegion = directionUp ? maxRegion : minRegion;
                const extremeHeadY = noteCenterY(extremeRegion) - headItem.h / 2;
                const extremeHeadCenterY = extremeHeadY + headItem.h / 2;
                const otherExtremeHeadCenterY = directionUp ? noteCenterY(minRegion) : noteCenterY(maxRegion);
                const extremeNotesInfo = beat.notesInfo.find((n) => n.region === extremeRegion);
                const needLower = new Set();
                const needUpper = new Set();
                for (const r of regions) {
                    if (r < -1)
                        for (let line = -2; line >= r; line -= 2)
                            needLower.add(line);
                    if (r > 9)
                        for (let line = 10; line <= r; line += 2)
                            needUpper.add(line);
                }
                if (addLineSkinD)
                    for (const lineRegion of needLower) {
                        const lineY = noteCenterY(lineRegion);
                        const box = addLineBoxAt(lineY, ledgerCenterX, addLineSkinD);
                        out.push({
                            startPoint: { x: 0, y: 0 }, endPoint: { x: 0, y: 0 }, special: {},
                            ...box,
                            zIndex: z,
                            tag: 'addLine', skinName: skinNameForNodes, targetId: note.id,
                            skinKey: StandardStaffSkinKeyEnum.AddLine_d, dataComment: '下加线',
                        });
                    }
                if (addLineSkinU)
                    for (const lineRegion of needUpper) {
                        const lineY = noteCenterY(lineRegion);
                        const box = addLineBoxAt(lineY, ledgerCenterX, addLineSkinU);
                        out.push({
                            startPoint: { x: 0, y: 0 }, endPoint: { x: 0, y: 0 }, special: {},
                            ...box,
                            zIndex: z,
                            tag: 'addLine', skinName: skinNameForNodes, targetId: note.id,
                            skinKey: StandardStaffSkinKeyEnum.AddLine_u, dataComment: '上加线',
                        });
                    }
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
                renderGraceNotesBefore(note.graceNotes, headX, graceCtx);
                beat.notesInfo.forEach((n) => {
                    const ny = noteCenterY(n.region) - headItem.h / 2;
                    const hcy = noteCenterY(n.region);
                    if (n.accidental) {
                        const accSkinKey = getAccidentalSkinKey(n.accidental.type);
                        const accSkin = skin[accSkinKey];
                        if (accSkin) {
                            const accX = headX - ACCIDENTAL_NOTE_GAP * measureHeight - accSkin.w;
                            const isFlatOrDoubleFlat = n.accidental.type === AccidentalTypeEnum.Flat || n.accidental.type === AccidentalTypeEnum.Double_flat;
                            const accY = isFlatOrDoubleFlat ? (hcy + measureHeight / 8) - accSkin.h : hcy - accSkin.h / 2;
                            out.push({
                                startPoint: { x: 0, y: 0 },
                                endPoint: { x: 0, y: 0 },
                                special: {},
                                x: accX,
                                y: accY,
                                w: accSkin.w,
                                h: accSkin.h,
                                zIndex: z,
                                tag: 'accidental',
                                skinName: skinNameForNodes,
                                targetId: n.accidental.id ?? n.id,
                                skinKey: accSkinKey,
                                dataComment: '变音符号',
                            });
                        }
                    }
                    const vdom = {
                        startPoint: { x: 0, y: 0 },
                        endPoint: { x: 0, y: 0 },
                        special: {},
                        x: headX,
                        y: ny,
                        w: headItem.w,
                        h: headItem.h,
                        zIndex: z,
                        tag: 'noteHead',
                        skinName: skinNameForNodes,
                        targetId: n.id,
                        skinKey: headKey,
                        dataComment: '音符头',
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
                    if (!firstHeadVDom)
                        firstHeadVDom = vdom;
                });
                renderGraceNotesAfter(note.graceNotesAfter, headX, headItem.w, graceCtx);
                const groupAugmentationDot = beat.notesInfo.find((n) => n.augmentationDot)?.augmentationDot;
                if (groupAugmentationDot) {
                    const augSkinKey = getAugmentationDotSkinKey(groupAugmentationDot);
                    const augSkin = skin[augSkinKey];
                    if (augSkin) {
                        const augX = headX + headItem.w + AUGMENTATION_DOT_GAP * measureHeight;
                        beat.notesInfo.forEach((n) => {
                            let augY = noteCenterY(n.region) - augSkin.h / 2;
                            if (n.region % 2 === 0)
                                augY -= measureHeight / 8;
                            out.push({
                                startPoint: { x: 0, y: 0 },
                                endPoint: { x: 0, y: 0 },
                                special: {},
                                x: augX,
                                y: augY,
                                w: augSkin.w,
                                h: augSkin.h,
                                zIndex: z,
                                tag: 'accidental',
                                skinName: skinNameForNodes,
                                targetId: groupAugmentationDot.id,
                                skinKey: augSkinKey,
                                dataComment: '附点符号',
                            });
                        });
                    }
                }
                if (!extremeNotesInfo)
                    return;
                const stemTailVDoms = renderStemAndTail({
                    note,
                    headX: headX,
                    headY: extremeHeadY,
                    headW: headItem.w,
                    headH: headItem.h,
                    measureY,
                    measureHeight,
                    measureWidth,
                    skin,
                    zIndex: z,
                    idMap,
                    chronaxie: beat.chronaxie,
                    direction: directionUp ? 'up' : 'down',
                    stemTargetId: extremeNotesInfo.id,
                    headCenterYOther: otherExtremeHeadCenterY,
                    skinName: skinNameForNodes,
                });
                for (const v of stemTailVDoms) {
                    out.push(v);
                    if (v.targetId)
                        setNodeIdMap(idMap, v.targetId, v);
                }
            };
            for (const group of voiceGroups)
                drawVoice(group);
            if (firstHeadVDom)
                setNodeIdMap(idMap, note.id, firstHeadVDom);
        }
    }
    x = measureX + measureWidth - suffixW;
    for (const p of rightParts) {
        const yOff = p.tag === 'keySignature_b' ? keySignatureYOffset : undefined;
        pushSymbol(x, p.skinKey, p.tag, p.dataComment, p.targetId, yOff);
        const item = skin[p.skinKey];
        if (item)
            x += item.w;
    }
    return out;
}
/** 计算前置小节线在小节内的左边缘 x（clef_f + keySig_f + timeSig_f 之后，供连谱小节线 barline_f 定位） */
export function getBarlineFXInMeasure(measure, measureX, skin) {
    let prefixW = 0;
    if (measure.clef_f) {
        const item = skin[getClefSkinKey(measure.clef_f.type, true)];
        if (item)
            prefixW += item.w;
    }
    if (measure.keySignature_f) {
        const item = skin[getKeySignatureSkinKey(measure.keySignature_f.type)];
        if (item)
            prefixW += item.w;
    }
    if (measure.timeSignature_f) {
        const item = skin[getTimeSignatureSkinKey(measure.timeSignature_f.type)];
        if (item)
            prefixW += item.w;
    }
    return measureX + prefixW;
}
/** 计算后置小节线在小节内的左边缘 x（与 renderSymbol 中 rightParts 摆放一致，供连谱小节线 barline_b 定位） */
export function getBarlineXInMeasure(measure, measureX, measureWidth, skin) {
    const rightKeys = [];
    if (measure.barline_b)
        rightKeys.push(getBarlineSkinKey(measure.barline_b.type));
    if (measure.clef_b)
        rightKeys.push(getClefSkinKey(measure.clef_b.type, false));
    if (measure.keySignature_b)
        rightKeys.push(getKeySignatureSkinKey(measure.keySignature_b.type));
    if (measure.timeSignature_b)
        rightKeys.push(getTimeSignatureSkinKey(measure.timeSignature_b.type));
    let suffixW = 0;
    for (const k of rightKeys) {
        const item = skin[k];
        if (item)
            suffixW += item.w;
    }
    let x = measureX + measureWidth - suffixW;
    const barlineIdx = 0; // barline_b 在 rightParts 第一位
    for (let j = 0; j < barlineIdx && j < rightKeys.length; j++) {
        const item = skin[rightKeys[j]];
        if (item)
            x += item.w;
    }
    return x;
}
