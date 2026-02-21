/**
 * musicScoreToVDom 实现：宏观布局 + 小节符号 + 符杠 + 附属型符号
 */

import {Skin, SkinPack, SlotConfig, VDom} from "@/types/common";
import {MusicScore, NoteSymbol} from "@/types/MusicScoreType";
import {StandardStaffSkinKeyEnum} from "@/standardStaff/enums/standardStaffSkinKeyEnum";
import {defaultSkin} from "@/skins/defaultSkin";
import type {NodeIdMap} from "./types";
import {getSlotH, getSlotW} from "./utils/slot";
import {getMeasureWidthRatio} from "./utils/note";
import {renderSymbol} from "./symbol/renderSymbol";
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
  const skin = skinPack.standardStaff ?? (defaultSkin.standardStaff as import("@/types/common").StandardStaffSkinPack);
  const measureHeight = skin[StandardStaffSkinKeyEnum.Measure]?.h ?? 45;
  const measureLineWidth = skin[StandardStaffSkinKeyEnum.Measure]?.w ?? 1;
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
    startPoint: {x: 0, y: 0}, endPoint: {x: 0, y: 0}, special: {},
    x: 0, y: scoreCurrentY, w: musicScore.width, h: musicScore.topSpaceHeight,
    zIndex: 1000, tag: 'slot', skinName: effectiveSkinName, targetId: '', slotName: 't', dataComment: '顶部插槽',
  });
  scoreCurrentY += musicScore.topSpaceHeight;

  for (const grandStaff of grandStaffs) {
    const grandStaffStartY = scoreCurrentY;
    let glSlot: VDom = {} as VDom;
    if (gLW > 0) {
      glSlot = {
        startPoint: {x: 0, y: 0}, endPoint: {x: 0, y: 0}, special: {},
        x: 0, y: grandStaffStartY, w: gLW, h: 0,
        zIndex: 1000, tag: 'slot', skinName: effectiveSkinName, targetId: '', slotName: 'g-l', dataComment: '复谱表左侧插槽',
      };
      vDoms.push(glSlot);
    }
    let grSlot: VDom = {} as VDom;
    if (gRW > 0) {
      grSlot = {
        startPoint: {x: 0, y: 0}, endPoint: {x: 0, y: 0}, special: {},
        x: width - gRW, y: grandStaffStartY, w: gRW, h: 0,
        zIndex: 1000, tag: 'slot', skinName: effectiveSkinName, targetId: '', slotName: 'g-r', dataComment: '复谱表右侧插槽',
      };
      vDoms.push(grSlot);
    }
    let grandStaffCurrentY = grandStaffStartY;

    const gSlot: VDom = {
      startPoint: {x: 0, y: 0}, endPoint: {x: 0, y: 0}, special: {},
      x: grandStaffX, y: grandStaffStartY, w: grandStaffW, h: 0,
      zIndex: 999, tag: 'slot', skinName: effectiveSkinName, targetId: '', slotName: 'g', dataComment: '复谱表（含外边距）',
    };
    vDoms.push(gSlot);

    vDoms.push({
      startPoint: {x: 0, y: 0}, endPoint: {x: 0, y: 0}, special: {},
      x: grandStaffX, y: grandStaffCurrentY, w: grandStaffW, h: grandStaff.uSpace,
      zIndex: 1000, tag: 'space', skinName: effectiveSkinName, targetId: '', dataComment: '复谱表上边距',
    });
    grandStaffCurrentY += grandStaff.uSpace;

    vDoms.push({
      startPoint: {x: 0, y: 0}, endPoint: {x: 0, y: 0}, special: {},
      x: grandStaffX, y: grandStaffCurrentY, w: grandStaffW, h: gUH,
      zIndex: 1000, tag: 'slot', skinName: effectiveSkinName, targetId: '', slotName: 'g-u', dataComment: '复谱表上方插槽',
    });
    grandStaffCurrentY += gUH;

    for (let i = 0; i < grandStaff.staves.length; i++) {
      const singleStaffStartY = grandStaffCurrentY;
      const staff = grandStaff.staves[i];
      const staffUSpaceI = staff.uSpaceI;
      const staffDSpaceI = staff.dSpaceI;
      const staffUSpaceO = staff.uSpaceO;
      const staffDSpaceO = staff.dSpaceO;

      let totalWidthRatioForMeasure = 0;
      for (const m of staff.measures) {
        totalWidthRatioForMeasure += getMeasureWidthRatio(m);
      }

      const sSlot: VDom = {
        startPoint: {x: 0, y: 0}, endPoint: {x: 0, y: 0}, special: {},
        x: grandStaffX, y: singleStaffStartY, w: grandStaffW, h: 0,
        zIndex: 999, tag: 'slot', skinName: effectiveSkinName, targetId: '', slotName: 's', dataComment: '单谱表（含外边距）',
      };
      vDoms.push(sSlot);

      const slSlot: VDom = {
        startPoint: {x: 0, y: 0}, endPoint: {x: 0, y: 0}, special: {},
        x: gLW, y: singleStaffStartY, w: sLW, h: 0,
        zIndex: 1000, tag: 'slot', skinName: effectiveSkinName, targetId: '', slotName: 's-l', dataComment: '单谱表左侧插槽',
      };
      vDoms.push(slSlot);
      const srSlot: VDom = {
        startPoint: {x: 0, y: 0}, endPoint: {x: 0, y: 0}, special: {},
        x: width - gLW - gRW, y: singleStaffStartY, w: sRW, h: 0,
        zIndex: 1000, tag: 'slot', skinName: effectiveSkinName, targetId: '', slotName: 's-r', dataComment: '单谱表右侧插槽',
      };
      vDoms.push(srSlot);

      vDoms.push({
        startPoint: {x: 0, y: 0}, endPoint: {x: 0, y: 0}, special: {},
        x: grandStaffX, y: grandStaffCurrentY, w: grandStaffW, h: staffUSpaceO,
        zIndex: 1000, tag: 'space', skinName: effectiveSkinName, targetId: '', dataComment: '单谱表上外边距',
      });
      grandStaffCurrentY += staffUSpaceO;

      vDoms.push({
        startPoint: {x: 0, y: 0}, endPoint: {x: 0, y: 0}, special: {},
        x: grandStaffX, y: grandStaffCurrentY, w: grandStaffW, h: sUH,
        zIndex: 1000, tag: 'slot', skinName: effectiveSkinName, targetId: '', slotName: 's-u', dataComment: '单谱表上方插槽',
      });
      grandStaffCurrentY += sUH;

      let measureCurrentX = grandStaffX;
      for (const measure of staff.measures) {
        const measureWidth = getMeasureWidthRatio(measure) / totalWidthRatioForMeasure * grandStaffW;
        vDoms.push({
          startPoint: {x: 0, y: 0}, endPoint: {x: 0, y: 0}, special: {},
          x: measureCurrentX, y: grandStaffCurrentY, w: measureWidth, h: mUH,
          zIndex: 1000, tag: 'slot', skinName: effectiveSkinName, targetId: '', slotName: 'm-u', dataComment: '小节上方插槽',
        });
        measureCurrentX += measureWidth;
      }
      measureCurrentX = grandStaffX;

      vDoms.push({
        startPoint: {x: 0, y: 0}, endPoint: {x: 0, y: 0}, special: {},
        x: grandStaffX, y: grandStaffCurrentY, w: grandStaffW, h: staffUSpaceI,
        zIndex: 1000, tag: 'space', skinName: effectiveSkinName, targetId: '', dataComment: '单谱表上内边距',
      });
      grandStaffCurrentY += staffUSpaceI;

      measureCurrentX = grandStaffX;
      for (let mi = 0; mi < staff.measures.length; mi++) {
        const measure = staff.measures[mi];
        const measureWidth = getMeasureWidthRatio(measure) / totalWidthRatioForMeasure * grandStaffW;
        vDoms.push({
          startPoint: {x: 0, y: 0}, endPoint: {x: 0, y: 0}, special: {},
          x: measureCurrentX, y: grandStaffCurrentY, w: measureWidth, h: measureHeight,
          zIndex: 1000, tag: 'measure', skinName: effectiveSkinName, targetId: measure.id,
          dataComment: '小节', skinKey: StandardStaffSkinKeyEnum.Measure,
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
        const measureWidth = getMeasureWidthRatio(measure) / totalWidthRatioForMeasure * grandStaffW;
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
          measure: measure as { notes: NoteSymbol[] },
          nodeIdMap,
          vDoms,
          symbolVDomsLength: symbolVDoms.length,
          skin,
          measureHeight,
          measureLineWidth,
          skinName: effectiveSkinName,
        });
        vDoms.push({
          startPoint: {x: 0, y: 0}, endPoint: {x: 0, y: 0}, special: {},
          x: measureCurrentX, y: grandStaffCurrentY, w: measureWidth, h: measureHeight,
          zIndex: 1000, tag: 'slot', skinName: effectiveSkinName, targetId: '', slotName: 'm', dataComment: '小节插槽',
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
      for (const measure of staff.measures) {
        const measureWidth = getMeasureWidthRatio(measure) / totalWidthRatioForMeasure * grandStaffW;
        vDoms.push({
          startPoint: {x: 0, y: 0}, endPoint: {x: 0, y: 0}, special: {},
          x: measureCurrentX, y: grandStaffCurrentY, w: measureWidth, h: mDH,
          zIndex: 1000, tag: 'slot', skinName: effectiveSkinName, targetId: '', slotName: 'm-d', dataComment: '小节下方插槽',
        });
        measureCurrentX += measureWidth;
      }
      grandStaffCurrentY += mDH;
      measureCurrentX = grandStaffX;

      vDoms.push({
        startPoint: {x: 0, y: 0}, endPoint: {x: 0, y: 0}, special: {},
        x: grandStaffX, y: grandStaffCurrentY, w: grandStaffW, h: sDH,
        zIndex: 1000, tag: 'slot', skinName: effectiveSkinName, targetId: '', slotName: 's-d', dataComment: '单谱表下方插槽',
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
    }

    vDoms.push({
      startPoint: {x: 0, y: 0}, endPoint: {x: 0, y: 0}, special: {},
      x: grandStaffX, y: grandStaffCurrentY, w: grandStaffW, h: gDH,
      zIndex: 1000, tag: 'slot', skinName: effectiveSkinName, targetId: '', slotName: 'g-d', dataComment: '复谱表下方插槽',
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
    scoreCurrentY = grandStaffCurrentY;
    if (gLW > 0) glSlot.h = grandStaffH;
    if (gRW > 0) grSlot.h = grandStaffH;
  }
  /*
  * 渲染双音符或双小节附属符号
  * slur,volta
  * */
  renderDoubleAffiliatedSymbol({idMap: nodeIdMap, musicScore, VDoms: vDoms, skinName: effectiveSkinName});
  return vDoms;
}
