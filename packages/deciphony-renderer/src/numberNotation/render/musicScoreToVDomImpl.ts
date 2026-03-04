/**
 * musicScoreToVDom 实现：宏观布局 + 小节符号 + 符杠 + 附属型符号
 */

import {readonly} from "vue";
import {Skin, SkinPack, SlotConfig, VDom} from "@/types/common";
import {MusicScore, NoteNumber} from "@/types/MusicScoreType";
import {NumberNotationSkinKeyEnum} from "@/numberNotation/enums/numberNotationSkinKeyEnum";
import {defaultSkin} from "@/skins/defaultSkin";
import type {NodeIdMap} from "./types";
import {getSlotH, getSlotW, getSlotZIndex} from "./utils/slot";
import {getLinkedBarlineSkinKey} from "./utils/skinKey";
import {getMeasureWidthRatio} from "./utils/note";
import {getBarlineFXInMeasure, getBarlineXInMeasure, renderSymbol} from "./symbol/renderSymbol";
import {processBeam} from "./beam/processBeam";
import {renderDoubleAffiliatedSymbol} from "./affiliated/renderDoubleAffiliatedSymbol";

function setNodeIdMap(map: NodeIdMap, id: string, vdom: VDom): void {
    let obj = map.get(id);
    if (!obj) {
        obj = {};
        map.set(id, obj);
    }
    obj[vdom.tag] = vdom;
}

export function musicScoreToVDom(
    musicScore: MusicScore,
    slotConfig?: SlotConfig,
    options?: { skin?: Skin; skinName?: string },
): VDom[] {
    const nodeIdMap: NodeIdMap = new Map();
    const {width, grandStaffs} = musicScore;
    const config = slotConfig ?? {};
    const s = options?.skin;
    const sn = options?.skinName;
    const effectiveSkinName = sn && s && sn in s ? sn : 'default';
    const skinPack: SkinPack = s?.[effectiveSkinName] ?? defaultSkin;
    const skin = skinPack.numberNotation ?? (defaultSkin.numberNotation as import("@/types/common").NumberNotationSkinPack);
    const measureHeight = skin[NumberNotationSkinKeyEnum.Measure]?.h ?? 45;
    const measureLineWidth = skin[NumberNotationSkinKeyEnum.Measure]?.w ?? 1;
    const vDoms: VDom[] = [];

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
        startPoint: {x: 0, y: 0},
        endPoint: {x: 0, y: 0},
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
        const glSlot: VDom = {
            startPoint: {x: 0, y: 0},
            endPoint: {x: 0, y: 0},
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
        const measureWidths: number[] = [];
        if (linkedStaff && maxMeasures > 0) {
            const totalRatioPerCol: number[] = new Array(maxMeasures).fill(0);
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

        const grSlot: VDom = {
            startPoint: {x: 0, y: 0},
            endPoint: {x: 0, y: 0},
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
            startPoint: {x: 0, y: 0}, endPoint: {x: 0, y: 0}, special: {},
            x: grandStaffX, y: grandStaffCurrentY, w: grandStaffW, h: grandStaff.uSpace,
            zIndex: 1000, tag: 'space', skinName: effectiveSkinName, targetId: '', dataComment: '复谱表上边距',
        });
        grandStaffCurrentY += grandStaff.uSpace;

        const gSlot: VDom = {
            startPoint: {x: 0, y: 0},
            endPoint: {x: 0, y: 0},
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
            startPoint: {x: 0, y: 0},
            endPoint: {x: 0, y: 0},
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

        let prevMeasureStartY: number | undefined = undefined;
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

            const sSlot: VDom = {
                startPoint: {x: 0, y: 0},
                endPoint: {x: 0, y: 0},
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

            const slSlot: VDom = {
                startPoint: {x: 0, y: 0},
                endPoint: {x: 0, y: 0},
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
            const srSlot: VDom = {
                startPoint: {x: 0, y: 0},
                endPoint: {x: 0, y: 0},
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
                startPoint: {x: 0, y: 0}, endPoint: {x: 0, y: 0}, special: {},
                x: grandStaffX, y: grandStaffCurrentY, w: grandStaffW, h: staffUSpaceO,
                zIndex: 1000, tag: 'space', skinName: effectiveSkinName, targetId: '', dataComment: '单谱表上外边距',
            });
            grandStaffCurrentY += staffUSpaceO;

            vDoms.push({
                startPoint: {x: 0, y: 0},
                endPoint: {x: 0, y: 0},
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
            const getMeasureW = (m: typeof staff.measures[0], mi: number) =>
                linkedStaff ? measureWidths[mi] : getMeasureWidthRatio(m, skin) / totalWidthRatioForMeasure * grandStaffW;
            for (let mi = 0; mi < staff.measures.length; mi++) {
                const measure = staff.measures[mi];
                const measureWidth = getMeasureW(measure, mi);
                vDoms.push({
                    startPoint: {x: 0, y: 0},
                    endPoint: {x: 0, y: 0},
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
                    startPoint: {x: 0, y: 0},
                    endPoint: {x: 0, y: 0},
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
                        const linkedKeyF = getLinkedBarlineSkinKey(measure.barline_f.barlineType);
                        const itemF = skin[linkedKeyF];
                        vDoms.push({
                            startPoint: {x: 0, y: 0},
                            endPoint: {x: 0, y: 0},
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
                        const linkedKeyB = getLinkedBarlineSkinKey(measure.barline_b.barlineType);
                        const barlineItem = skin[linkedKeyB];
                        vDoms.push({
                            startPoint: {x: 0, y: 0},
                            endPoint: {x: 0, y: 0},
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
                startPoint: {x: 0, y: 0}, endPoint: {x: 0, y: 0}, special: {},
                x: grandStaffX, y: grandStaffCurrentY, w: grandStaffW, h: staffUSpaceI,
                zIndex: 1000, tag: 'space', skinName: effectiveSkinName, targetId: '', dataComment: '单谱表上内边距',
            });
            grandStaffCurrentY += staffUSpaceI;

            measureCurrentX = grandStaffX;
            const closeLineSkinKey = NumberNotationSkinKeyEnum.Close_line;
            const closeLineItem = skin[closeLineSkinKey];
            vDoms.push({
                startPoint: {x: 0, y: 0},
                endPoint: {x: 0, y: 0},
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
                    startPoint: {x: 0, y: 0}, endPoint: {x: 0, y: 0}, special: {},
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
                vDoms.push(...symbolVDoms);
                /*
                * 渲染符杠
                * 这个函数内部会调整已经存在的符干和符尾（拉伸符干和去掉符尾）
                * */
                processBeam({
                    measure: measure as { notes: NoteNumber[] },
                    nodeIdMap,
                    vDoms,
                    symbolVDomsLength: symbolVDoms.length,
                    skin,
                    measureHeight,
                    measureLineWidth,
                });
                vDoms.push({
                    startPoint: {x: 0, y: 0},
                    endPoint: {x: 0, y: 0},
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
            measureCurrentX = grandStaffX;
            // ==============================================下方插槽====================================================
            vDoms.push({
                startPoint: {x: 0, y: 0}, endPoint: {x: 0, y: 0}, special: {},
                x: grandStaffX, y: grandStaffCurrentY, w: grandStaffW, h: staffDSpaceI,
                zIndex: 1000, tag: 'space', skinName: effectiveSkinName, targetId: '', dataComment: '单谱表下内边距',
            });
            grandStaffCurrentY += staffDSpaceI;

            measureCurrentX = grandStaffX;
            for (let mi = 0; mi < staff.measures.length; mi++) {
                const measure = staff.measures[mi];
                const measureWidth = getMeasureW(measure, mi);
                vDoms.push({
                    startPoint: {x: 0, y: 0},
                    endPoint: {x: 0, y: 0},
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
                startPoint: {x: 0, y: 0},
                endPoint: {x: 0, y: 0},
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
                startPoint: {x: 0, y: 0}, endPoint: {x: 0, y: 0}, special: {},
                x: grandStaffX, y: grandStaffCurrentY, w: grandStaffW, h: staffDSpaceO,
                zIndex: 1000, tag: 'space', skinName: effectiveSkinName, targetId: '', dataComment: '单谱表下外边距',
            });
            grandStaffCurrentY += staffDSpaceO;
            sSlot.h = grandStaffCurrentY - singleStaffStartY;
            slSlot.h = grandStaffCurrentY - singleStaffStartY;
            srSlot.h = grandStaffCurrentY - singleStaffStartY;
            prevMeasureStartY = singleStaffStartY + staffUSpaceO + sUH + staffUSpaceI;
        }

        vDoms.push({
            startPoint: {x: 0, y: 0},
            endPoint: {x: 0, y: 0},
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
            startPoint: {x: 0, y: 0}, endPoint: {x: 0, y: 0}, special: {},
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
            startPoint: {x: 0, y: 0},
            endPoint: {x: 0, y: 0},
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
    renderDoubleAffiliatedSymbol({idMap: nodeIdMap, musicScore, VDoms: vDoms, skinName: effectiveSkinName});
    vDoms.sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
    return vDoms;
}
