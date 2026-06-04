/**
 * musicScoreToVDom 实现：宏观布局 + 小节符号 + 符杠 + 附属型符号
 */
import { readonly } from "vue";
import { NumberNotationSkinKeyEnum } from "@/numberNotation/enums/numberNotationSkinKeyEnum";
import { defaultSkin } from "@/skins/defaultSkin";
import { getSlotH, getSlotW, getSlotZIndex } from "./utils/slot";
import { getBracketSkinKey, getLinkedBarlineSkinKey } from "./utils/skinKey";
import { getMeasureWidthRatio } from "./utils/note";
import { getBarlineFXInMeasure, getBarlineXInMeasure, renderSymbol } from "./symbol/renderSymbol";
import { processBeam } from "./beam/processBeam";
import { renderMusicScoreAffiliatedSymbols, renderSingleMeasureAffiliatedSymbols } from "@/render/affiliated";
import { renderMeasureRepeat } from "@/render/repeat/renderMeasureRepeat";
import { applyRelativeFramesToVDomRange, collectRelativeFrameMap } from "@/render/vdomFrame";
function setNodeIdMap(map, id, vdom) {
    let obj = map.get(id);
    if (!obj) {
        obj = {};
        map.set(id, obj);
    }
    obj[vdom.tag] = vdom;
}
export function musicScoreToVDom(musicScore, slotConfig, options) {
    const nodeIdMap = new Map();
    const { width, grandStaffs } = musicScore;
    const config = slotConfig ?? {};
    const s = options?.skin;
    const sn = options?.skinName;
    const effectiveSkinName = sn && s && sn in s ? sn : 'default';
    const skinPack = s?.[effectiveSkinName] ?? defaultSkin;
    const skin = skinPack.numberNotation ?? defaultSkin.numberNotation;
    const measureHeight = skin[NumberNotationSkinKeyEnum.Measure]?.h ?? 45;
    const measureLineWidth = skin[NumberNotationSkinKeyEnum.Measure]?.w ?? 1;
    const vDoms = [];
    /** 曲谱 id → 累计 Frame；级联规则见 vdomFrame collectRelativeFrameMap */
    const relativeFrameMap = collectRelativeFrameMap(musicScore);
    /**
     * 为何不只在渲染末尾统一 applyRelativeFramesToVDomRange？—— 五线谱同理，见 standardStaff/musicScoreToVDomImpl
     * 文件头说明。简谱 processBeam 虽为空，阶段一仍保证音符头等与 Frame 一致；阶段二/三处理晚生成的布局
     * vDom 与曲谱级连音线。relativeApplied 防止阶段二全量扫时重复偏移小节符号。
     */
    const relativeApplied = new WeakSet();
    const gLW = getSlotW(config, 'g-l');
    const gRW = getSlotW(config, 'g-r');
    const sLW = getSlotW(config, 's-l');
    const sRW = getSlotW(config, 's-r');
    const grandStaffX = gLW + sLW;
    const grandStaffW = width - gLW - gRW - sLW - sRW;
    const gUH = getSlotH(config, 'g-u');
    const gDH = getSlotH(config, 'g-d');
    const sUH = getSlotH(config, 's-u');
    const sDH = getSlotH(config, 's-d');
    const mUH = getSlotH(config, 'm-u');
    const mDH = getSlotH(config, 'm-d');
    let scoreCurrentY = 0;
    vDoms.push({
        startPoint: { x: 0, y: 0 },
        endPoint: { x: 0, y: 0 },
        special: {},
        x: 0,
        y: scoreCurrentY,
        w: musicScore.width,
        h: musicScore.topSpaceHeight,
        zIndex: getSlotZIndex(config, 't'),
        tag: 'slot',
        skinName: effectiveSkinName,
        targetId: 't',
        slotData: readonly(musicScore),
        slotName: 't',
        dataComment: '顶部插槽',
    });
    scoreCurrentY += musicScore.topSpaceHeight;
    for (const grandStaff of grandStaffs) {
        const grandStaffStartY = scoreCurrentY;
        const glSlot = {
            startPoint: { x: 0, y: 0 },
            endPoint: { x: 0, y: 0 },
            special: {},
            x: 0,
            y: grandStaffStartY,
            w: gLW,
            h: 0,
            zIndex: getSlotZIndex(config, 'g-l'),
            tag: 'slot',
            skinName: effectiveSkinName,
            slotName: 'g-l',
            targetId: `g-l-${grandStaff.id}`,
            slotData: readonly(grandStaff),
            dataComment: '复谱表左侧插槽',
        };
        vDoms.push(glSlot);
        const linkedStaff = grandStaff.linkedStaff ?? false;
        const maxMeasures = Math.max(...grandStaff.staves.map((s) => s.measures.length), 0);
        const measureWidths = [];
        if (linkedStaff && maxMeasures > 0) {
            const totalRatioPerCol = new Array(maxMeasures).fill(0);
            for (const staff of grandStaff.staves) {
                for (let mi = 0; mi < staff.measures.length && mi < maxMeasures; mi++) {
                    totalRatioPerCol[mi] += getMeasureWidthRatio(staff.measures[mi], skin);
                }
            }
            const totalSum = totalRatioPerCol.reduce((a, b) => a + b, 0) || 1;
            for (let mi = 0; mi < maxMeasures; mi++) {
                measureWidths.push(totalRatioPerCol[mi] / totalSum * grandStaffW);
            }
        }
        const grSlot = {
            startPoint: { x: 0, y: 0 },
            endPoint: { x: 0, y: 0 },
            special: {},
            x: width - gRW,
            y: grandStaffStartY,
            w: gRW,
            h: 0,
            zIndex: getSlotZIndex(config, 'g-r'),
            tag: 'slot',
            skinName: effectiveSkinName,
            slotName: 'g-r',
            targetId: `g-r-${grandStaff.id}`,
            slotData: readonly(grandStaff),
            dataComment: '复谱表右侧插槽',
        };
        vDoms.push(grSlot);
        let grandStaffCurrentY = grandStaffStartY;
        vDoms.push({
            startPoint: { x: 0, y: 0 }, endPoint: { x: 0, y: 0 }, special: {},
            x: grandStaffX, y: grandStaffCurrentY, w: grandStaffW, h: grandStaff.uSpace,
            zIndex: 1000, tag: 'space', skinName: effectiveSkinName, targetId: '', dataComment: '复谱表上边距',
        });
        grandStaffCurrentY += grandStaff.uSpace;
        const gSlot = {
            startPoint: { x: 0, y: 0 },
            endPoint: { x: 0, y: 0 },
            special: {},
            x: grandStaffX,
            y: grandStaffStartY,
            w: grandStaffW,
            h: 0,
            zIndex: getSlotZIndex(config, 'g'),
            tag: 'slot',
            skinName: effectiveSkinName,
            slotName: 'g',
            targetId: `g-${grandStaff.id}`,
            slotData: readonly(grandStaff),
            dataComment: '复谱表（含外边距）',
        };
        vDoms.push(gSlot);
        vDoms.push({
            startPoint: { x: 0, y: 0 },
            endPoint: { x: 0, y: 0 },
            special: {},
            x: grandStaffX,
            y: grandStaffCurrentY,
            w: grandStaffW,
            h: gUH,
            zIndex: getSlotZIndex(config, 'g-u'),
            tag: 'slot',
            skinName: effectiveSkinName,
            slotName: 'g-u',
            targetId: `g-u-${grandStaff.id}`,
            slotData: readonly(grandStaff),
            dataComment: '复谱表上方插槽',
        });
        grandStaffCurrentY += gUH;
        let prevMeasureStartY = undefined;
        const staffMeasureBounds = [];
        for (let i = 0; i < grandStaff.staves.length; i++) {
            const singleStaffStartY = grandStaffCurrentY;
            const staff = grandStaff.staves[i];
            const staffUSpaceI = staff.uSpaceI;
            const staffDSpaceI = staff.dSpaceI;
            const staffUSpaceO = staff.uSpaceO;
            const staffDSpaceO = staff.dSpaceO;
            let totalWidthRatioForMeasure = 0;
            if (!linkedStaff) {
                for (const m of staff.measures) {
                    totalWidthRatioForMeasure += getMeasureWidthRatio(m, skin);
                }
                if (!Number.isFinite(totalWidthRatioForMeasure) || totalWidthRatioForMeasure <= 0) {
                    totalWidthRatioForMeasure = 1;
                }
            }
            const sSlot = {
                startPoint: { x: 0, y: 0 },
                endPoint: { x: 0, y: 0 },
                special: {},
                x: grandStaffX,
                y: singleStaffStartY,
                w: grandStaffW,
                h: 0,
                zIndex: getSlotZIndex(config, 's'),
                tag: 'slot',
                skinName: effectiveSkinName,
                slotName: 's',
                targetId: `s-${staff.id}`,
                slotData: readonly(staff),
                dataComment: '单谱表（含外边距）',
            };
            vDoms.push(sSlot);
            const slSlot = {
                startPoint: { x: 0, y: 0 },
                endPoint: { x: 0, y: 0 },
                special: {},
                x: gLW,
                y: singleStaffStartY,
                w: sLW,
                h: 0,
                zIndex: getSlotZIndex(config, 's-l'),
                tag: 'slot',
                skinName: effectiveSkinName,
                slotName: 's-l',
                targetId: `s-l-${staff.id}`,
                slotData: readonly(staff),
                dataComment: '单谱表左侧插槽',
            };
            vDoms.push(slSlot);
            const srSlot = {
                startPoint: { x: 0, y: 0 },
                endPoint: { x: 0, y: 0 },
                special: {},
                x: width - gLW - gRW,
                y: singleStaffStartY,
                w: sRW,
                h: 0,
                zIndex: getSlotZIndex(config, 's-r'),
                tag: 'slot',
                skinName: effectiveSkinName,
                slotName: 's-r',
                targetId: `s-r-${staff.id}`,
                slotData: readonly(staff),
                dataComment: '单谱表右侧插槽',
            };
            vDoms.push(srSlot);
            vDoms.push({
                startPoint: { x: 0, y: 0 }, endPoint: { x: 0, y: 0 }, special: {},
                x: grandStaffX, y: grandStaffCurrentY, w: grandStaffW, h: staffUSpaceO,
                zIndex: 1000, tag: 'space', skinName: effectiveSkinName, targetId: '', dataComment: '单谱表上外边距',
            });
            grandStaffCurrentY += staffUSpaceO;
            vDoms.push({
                startPoint: { x: 0, y: 0 },
                endPoint: { x: 0, y: 0 },
                special: {},
                x: grandStaffX,
                y: grandStaffCurrentY,
                w: grandStaffW,
                h: sUH,
                zIndex: getSlotZIndex(config, 's-u'),
                tag: 'slot',
                skinName: effectiveSkinName,
                slotName: 's-u',
                targetId: `s-u-${staff.id}`,
                slotData: readonly(staff),
                dataComment: '单谱表上方插槽',
            });
            grandStaffCurrentY += sUH;
            let measureCurrentX = grandStaffX;
            const getMeasureW = (m, mi) => linkedStaff ? measureWidths[mi] : getMeasureWidthRatio(m, skin) / totalWidthRatioForMeasure * grandStaffW;
            for (let mi = 0; mi < staff.measures.length; mi++) {
                const measure = staff.measures[mi];
                const measureWidth = getMeasureW(measure, mi);
                vDoms.push({
                    startPoint: { x: 0, y: 0 },
                    endPoint: { x: 0, y: 0 },
                    special: {},
                    x: measureCurrentX,
                    y: grandStaffCurrentY,
                    w: measureWidth,
                    h: mUH,
                    zIndex: getSlotZIndex(config, 'm-u'),
                    tag: 'slot',
                    skinName: effectiveSkinName,
                    slotName: 'm-u',
                    targetId: `m-u-${measure.id}`,
                    slotData: readonly(measure),
                    dataComment: '小节上方插槽',
                });
                measureCurrentX += measureWidth;
            }
            measureCurrentX = grandStaffX;
            const currentMeasureStartY = grandStaffCurrentY + staffUSpaceI;
            if (linkedStaff && i >= 1 && prevMeasureStartY !== undefined) {
                const linkedBarlineY = prevMeasureStartY + measureHeight;
                const linkedBarlineH = currentMeasureStartY - linkedBarlineY;
                const linkedCloseLineKey = NumberNotationSkinKeyEnum.linked_close_line;
                const linkedCloseLineItem = skin[linkedCloseLineKey];
                vDoms.push({
                    startPoint: { x: 0, y: 0 },
                    endPoint: { x: 0, y: 0 },
                    special: {},
                    x: grandStaffX,
                    y: linkedBarlineY,
                    w: linkedCloseLineItem?.w ?? 1,
                    h: linkedBarlineH,
                    zIndex: 1200,
                    tag: 'linked_close_line',
                    skinKey: linkedCloseLineKey,
                    skinName: effectiveSkinName,
                    targetId: `linked-close-${staff.id}`,
                    dataComment: '连谱闭合线',
                });
                let barlineMeasureX = grandStaffX;
                for (let mi = 0; mi < staff.measures.length; mi++) {
                    const measure = staff.measures[mi];
                    const measureWidth = getMeasureW(measure, mi);
                    if (measure.barline_f) {
                        const barlineFX = getBarlineFXInMeasure(measure, barlineMeasureX, skin);
                        const linkedKeyF = getLinkedBarlineSkinKey(measure.barline_f.type);
                        const itemF = skin[linkedKeyF];
                        vDoms.push({
                            startPoint: { x: 0, y: 0 },
                            endPoint: { x: 0, y: 0 },
                            special: {},
                            x: barlineFX,
                            y: linkedBarlineY,
                            w: itemF?.w ?? 0,
                            h: linkedBarlineH,
                            zIndex: 1200,
                            tag: 'linked_barline',
                            skinKey: linkedKeyF,
                            skinName: effectiveSkinName,
                            targetId: measure.barline_f.id,
                            dataComment: '连谱小节线',
                        });
                    }
                    if (measure.barline_b) {
                        const barlineX = getBarlineXInMeasure(measure, barlineMeasureX, measureWidth, skin);
                        const linkedKeyB = getLinkedBarlineSkinKey(measure.barline_b.type);
                        const barlineItem = skin[linkedKeyB];
                        vDoms.push({
                            startPoint: { x: 0, y: 0 },
                            endPoint: { x: 0, y: 0 },
                            special: {},
                            x: barlineX,
                            y: linkedBarlineY,
                            w: barlineItem?.w ?? 0,
                            h: linkedBarlineH,
                            zIndex: 1200,
                            tag: 'linked_barline',
                            skinKey: linkedKeyB,
                            skinName: effectiveSkinName,
                            targetId: measure.barline_b.id,
                            dataComment: '连谱小节线',
                        });
                    }
                    barlineMeasureX += measureWidth;
                }
            }
            vDoms.push({
                startPoint: { x: 0, y: 0 }, endPoint: { x: 0, y: 0 }, special: {},
                x: grandStaffX, y: grandStaffCurrentY, w: grandStaffW, h: staffUSpaceI,
                zIndex: 1000, tag: 'space', skinName: effectiveSkinName, targetId: '', dataComment: '单谱表上内边距',
            });
            grandStaffCurrentY += staffUSpaceI;
            const measureTopY = grandStaffCurrentY;
            measureCurrentX = grandStaffX;
            const closeLineSkinKey = NumberNotationSkinKeyEnum.Close_line;
            const closeLineItem = skin[closeLineSkinKey];
            vDoms.push({
                startPoint: { x: 0, y: 0 },
                endPoint: { x: 0, y: 0 },
                special: {},
                x: grandStaffX,
                y: grandStaffCurrentY,
                w: closeLineItem?.w ?? 1,
                h: measureHeight,
                zIndex: 1200,
                tag: 'close_line',
                skinKey: closeLineSkinKey,
                skinName: effectiveSkinName,
                targetId: `close-${staff.id}`,
                dataComment: '闭合线',
            });
            for (let mi = 0; mi < staff.measures.length; mi++) {
                const measure = staff.measures[mi];
                const measureWidth = getMeasureW(measure, mi);
                vDoms.push({
                    startPoint: { x: 0, y: 0 }, endPoint: { x: 0, y: 0 }, special: {},
                    x: measureCurrentX, y: grandStaffCurrentY, w: measureWidth, h: measureHeight,
                    zIndex: 1000, tag: 'measure', skinName: effectiveSkinName, targetId: measure.id,
                    dataComment: '小节', skinKey: NumberNotationSkinKeyEnum.Measure,
                });
                setNodeIdMap(nodeIdMap, measure.id, vDoms[vDoms.length - 1]);
                measureCurrentX += measureWidth;
            }
            measureCurrentX = grandStaffX;
            /*
            * 便利小节，渲染前后置符号
            * */
            for (let mi = 0; mi < staff.measures.length; mi++) {
                const measure = staff.measures[mi];
                const measureWidth = getMeasureW(measure, mi);
                // 渲染小节上的所有符号
                const symbolVDoms = renderSymbol({
                    measure,
                    measures: staff.measures,
                    measureIndex: mi,
                    measureX: measureCurrentX,
                    measureY: grandStaffCurrentY,
                    measureWidth,
                    measureHeight,
                    measureLineWidth,
                    skin,
                    idMap: nodeIdMap,
                    skinName: effectiveSkinName,
                });
                const symbolVDomsStartIdx = vDoms.length;
                vDoms.push(...symbolVDoms);
                vDoms.push(...renderMeasureRepeat({
                    measure,
                    measureX: measureCurrentX,
                    measureY: grandStaffCurrentY,
                    measureWidth,
                    measureHeight,
                    skin,
                    skinName: effectiveSkinName,
                    idMap: nodeIdMap,
                }));
                renderSingleMeasureAffiliatedSymbols(measure, measureCurrentX, grandStaffCurrentY, measureWidth, measureHeight, { VDoms: vDoms, idMap: nodeIdMap, skinName: effectiveSkinName, skin, measureHeight });
                /*
                 * 【阶段一 · 小节符号】五线谱须在 processBeam 前 apply（符杠读符干 vDom）；简谱 processBeam 为空，
                 * 仍保持同一时机，且与末尾单次 apply 方案一致。不能只在全曲末尾 apply：晚生成的布局 vDom、连音线锚点见文件头注释。
                 */
                applyRelativeFramesToVDomRange(vDoms, relativeFrameMap, symbolVDomsStartIdx, vDoms.length, relativeApplied);
                /*
                * 渲染符杠
                * 这个函数内部会调整已经存在的符干和符尾（拉伸符干和去掉符尾）
                * */
                processBeam({
                    measure: measure,
                    nodeIdMap,
                    vDoms,
                    symbolVDomsLength: symbolVDoms.length,
                    skin,
                    measureHeight,
                    measureLineWidth,
                });
                vDoms.push({
                    startPoint: { x: 0, y: 0 },
                    endPoint: { x: 0, y: 0 },
                    special: {},
                    x: measureCurrentX,
                    y: grandStaffCurrentY,
                    w: measureWidth,
                    h: measureHeight,
                    zIndex: getSlotZIndex(config, 'm'),
                    tag: 'slot',
                    skinName: effectiveSkinName,
                    slotName: 'm',
                    targetId: `m-${measure.id}`,
                    slotData: readonly(measure),
                    dataComment: '小节插槽',
                });
                measureCurrentX += measureWidth;
            }
            grandStaffCurrentY += measureHeight;
            const measureBottomY = measureTopY + measureHeight;
            measureCurrentX = grandStaffX;
            // ==============================================下方插槽====================================================
            vDoms.push({
                startPoint: { x: 0, y: 0 }, endPoint: { x: 0, y: 0 }, special: {},
                x: grandStaffX, y: grandStaffCurrentY, w: grandStaffW, h: staffDSpaceI,
                zIndex: 1000, tag: 'space', skinName: effectiveSkinName, targetId: '', dataComment: '单谱表下内边距',
            });
            grandStaffCurrentY += staffDSpaceI;
            measureCurrentX = grandStaffX;
            for (let mi = 0; mi < staff.measures.length; mi++) {
                const measure = staff.measures[mi];
                const measureWidth = getMeasureW(measure, mi);
                vDoms.push({
                    startPoint: { x: 0, y: 0 },
                    endPoint: { x: 0, y: 0 },
                    special: {},
                    x: measureCurrentX,
                    y: grandStaffCurrentY,
                    w: measureWidth,
                    h: mDH,
                    zIndex: getSlotZIndex(config, 'm-d'),
                    tag: 'slot',
                    skinName: effectiveSkinName,
                    slotName: 'm-d',
                    targetId: `m-d-${measure.id}`,
                    slotData: readonly(measure),
                    dataComment: '小节下方插槽',
                });
                measureCurrentX += measureWidth;
            }
            grandStaffCurrentY += mDH;
            measureCurrentX = grandStaffX;
            vDoms.push({
                startPoint: { x: 0, y: 0 },
                endPoint: { x: 0, y: 0 },
                special: {},
                x: grandStaffX,
                y: grandStaffCurrentY,
                w: grandStaffW,
                h: sDH,
                zIndex: getSlotZIndex(config, 's-d'),
                tag: 'slot',
                skinName: effectiveSkinName,
                slotName: 's-d',
                targetId: `s-d-${staff.id}`,
                slotData: readonly(staff),
                dataComment: '单谱表下方插槽',
            });
            grandStaffCurrentY += sDH;
            vDoms.push({
                startPoint: { x: 0, y: 0 }, endPoint: { x: 0, y: 0 }, special: {},
                x: grandStaffX, y: grandStaffCurrentY, w: grandStaffW, h: staffDSpaceO,
                zIndex: 1000, tag: 'space', skinName: effectiveSkinName, targetId: '', dataComment: '单谱表下外边距',
            });
            grandStaffCurrentY += staffDSpaceO;
            sSlot.h = grandStaffCurrentY - singleStaffStartY;
            slSlot.h = grandStaffCurrentY - singleStaffStartY;
            srSlot.h = grandStaffCurrentY - singleStaffStartY;
            prevMeasureStartY = singleStaffStartY + staffUSpaceO + sUH + staffUSpaceI;
            staffMeasureBounds.push({ measureTopY, measureBottomY });
        }
        const bracket = grandStaff.bracket;
        if (bracket) {
            const startIdx = bracket.startSingleStaffIndex;
            const endIdx = grandStaff.staves.length - 1;
            if (startIdx >= 0 &&
                startIdx < staffMeasureBounds.length &&
                endIdx >= startIdx &&
                endIdx - startIdx + 1 >= 2) {
                const topY = staffMeasureBounds[startIdx].measureTopY;
                const bottomY = staffMeasureBounds[endIdx].measureBottomY;
                const bracketSkinKey = getBracketSkinKey(bracket.type);
                const bracketItem = skin[bracketSkinKey];
                const bracketW = bracketItem?.w ?? 16;
                vDoms.push({
                    startPoint: { x: 0, y: 0 },
                    endPoint: { x: 0, y: 0 },
                    special: {},
                    x: grandStaffX - bracketW,
                    y: topY,
                    w: bracketW,
                    h: bottomY - topY,
                    zIndex: 1200,
                    tag: 'bracket',
                    skinKey: bracketSkinKey,
                    skinName: effectiveSkinName,
                    targetId: bracket.id,
                    dataComment: '连谱号',
                });
            }
        }
        vDoms.push({
            startPoint: { x: 0, y: 0 },
            endPoint: { x: 0, y: 0 },
            special: {},
            x: grandStaffX,
            y: grandStaffCurrentY,
            w: grandStaffW,
            h: gDH,
            zIndex: getSlotZIndex(config, 'g-d'),
            tag: 'slot',
            skinName: effectiveSkinName,
            slotName: 'g-d',
            targetId: `g-d-${grandStaff.id}`,
            slotData: readonly(grandStaff),
            dataComment: '复谱表下方插槽',
        });
        grandStaffCurrentY += gDH;
        vDoms.push({
            startPoint: { x: 0, y: 0 }, endPoint: { x: 0, y: 0 }, special: {},
            x: grandStaffX, y: grandStaffCurrentY, w: grandStaffW, h: grandStaff.dSpace,
            zIndex: 1000, tag: 'space', skinName: effectiveSkinName, targetId: '', dataComment: '复谱表下边距',
        });
        grandStaffCurrentY += grandStaff.dSpace;
        const grandStaffH = grandStaffCurrentY - grandStaffStartY;
        gSlot.h = grandStaffH;
        glSlot.h = grandStaffH;
        grSlot.h = grandStaffH;
        scoreCurrentY = grandStaffCurrentY;
    }
    const eH = config?.['e']?.h;
    if (eH !== undefined && eH > 0) {
        vDoms.push({
            startPoint: { x: 0, y: 0 },
            endPoint: { x: 0, y: 0 },
            special: {},
            x: 0,
            y: scoreCurrentY,
            w: width,
            h: eH,
            zIndex: getSlotZIndex(config, 'e'),
            tag: 'slot',
            skinName: effectiveSkinName,
            targetId: 'e',
            slotName: 'e',
            dataComment: '底部插槽',
        });
    }
    /*
    * 渲染双音符或双小节附属符号
    * slur,volta
    * */
    /* 【阶段二 · 布局补扫】阶段一不能推迟到曲谱末尾（符杠/锚点顺序）；本段 vDom 晚于阶段一才生成。见五线谱注释。 */
    applyRelativeFramesToVDomRange(vDoms, relativeFrameMap, 0, vDoms.length, relativeApplied);
    const scoreAffiliatedStartIdx = vDoms.length;
    renderMusicScoreAffiliatedSymbols(musicScore, {
        VDoms: vDoms,
        idMap: nodeIdMap,
        skinName: effectiveSkinName,
        skin,
    });
    /* 【阶段三 · 曲谱级附属】晚于阶段二新建，单独 apply；不能合并为曲谱末尾一次（见文件头）。见五线谱同段注释。 */
    applyRelativeFramesToVDomRange(vDoms, relativeFrameMap, scoreAffiliatedStartIdx, vDoms.length, relativeApplied);
    vDoms.sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
    return vDoms;
}
