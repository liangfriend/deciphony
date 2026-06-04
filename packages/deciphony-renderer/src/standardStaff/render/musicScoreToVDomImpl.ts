/**
 * musicScoreToVDom 实现：宏观布局 + 小节符号 + 符杠 + 附属型符号
 */

import {Skin, SkinPack, SlotConfig, VDom} from "@/types/common";
import {MusicScore, GrandStaff, SingleStaff, Measure, NoteSymbol} from "@/types/MusicScoreType";
import {StandardStaffSkinKeyEnum} from "@/standardStaff/enums/standardStaffSkinKeyEnum";
import {defaultSkin} from "@/skins/defaultSkin";
import type {NodeIdMap} from "./types";
import {getSlotH, getSlotW, getSlotZIndex} from "./utils/slot";
import {getBarlineSkinKey, getBracketSkinKey, getLinkedBarlineSkinKey} from "./utils/skinKey";
import {getMeasureWidthRatio} from "./utils/note";
import {getBarlineFXInMeasure, getBarlineXInMeasure, renderSymbol} from "./symbol/renderSymbol";
import {processBeam} from "./beam/processBeam";
import {processGraceBeam} from "./beam/processGraceBeam";
import {renderMusicScoreAffiliatedSymbols, renderSingleMeasureAffiliatedSymbols} from "@/render/affiliated";
import {renderMeasureRepeat} from "@/render/repeat/renderMeasureRepeat";
import {collectRelativeFrameMap, applyRelativeFramesToVDomRange} from "@/render/vdomFrame";
import {
  slotDataForGrandStaff,
  slotDataForMeasure,
  slotDataForMusicScore,
  slotDataForSingleStaff,
} from "@/render/slotData";
import {BarlineTypeEnum} from "@/enums/musicScoreEnum";

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
  /** 曲谱 id → 累计 Frame；子级偏移 = 祖先 relative 之和 + 自身（见 vdomFrame collectRelativeFrameMap） */
  const relativeFrameMap = collectRelativeFrameMap(musicScore);
  /**
   * 为何不只在渲染末尾调用一次 applyRelativeFramesToVDomRange？
   *
   * 1) 符杠 / 倚音符杠（processBeam、processGraceBeam）在符号 vDom 生成之后立刻运行：读取 nodeIdMap 里
   *    noteStem 的 x/y，拉长符干至符杠高度，再 push noteBeam（startPoint/endPoint 由符干接点算出）。
   *    若符干尚未施加 Frame 偏移，符杠会按「未偏移」的接点绘制，末尾再偏移符干也不会重算符杠，
   *    noteBeam 又无 targetId，无法靠 frameMap 补正 → 符杠与音符脱节。故阶段一必须在 processBeam 之前。
   *
   * 2) 连音线（renderMusicScoreAffiliatedSymbols）锚定 idMap 中 noteHead 的中心；须在音符头已偏移后再
   *    取锚点（阶段二补扫布局 vDom 之后、阶段三渲染连音线；连音线自身 Frame 在阶段三 apply）。
   *
   * 3) 连谱号、小节框、插槽等 vDom 在复谱表循环末尾才 push，阶段一时尚不存在，需阶段二补扫。
   *
   * relativeApplied：多阶段对同一 vDom 只偏移一次，阶段二 [0,length) 全扫时跳过阶段一已处理的符号。
   */
  const relativeApplied = new WeakSet<VDom>();

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
    slotData: slotDataForMusicScore(musicScore),
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
      slotData: slotDataForGrandStaff(musicScore, grandStaff),
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
      slotData: slotDataForGrandStaff(musicScore, grandStaff),
      dataComment: '复谱表右侧插槽',
    };
    vDoms.push(grSlot);
    let grandStaffCurrentY = grandStaffStartY;

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
      slotData: slotDataForGrandStaff(musicScore, grandStaff),
      dataComment: '复谱表（含外边距）',
    };
    vDoms.push(gSlot);

    vDoms.push({
      startPoint: {x: 0, y: 0}, endPoint: {x: 0, y: 0}, special: {},
      x: grandStaffX, y: grandStaffCurrentY, w: grandStaffW, h: grandStaff.uSpace,
      zIndex: 1000, tag: 'space', skinName: effectiveSkinName, targetId: '', dataComment: '复谱表上边距',
    });
    grandStaffCurrentY += grandStaff.uSpace;

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
      slotData: slotDataForGrandStaff(musicScore, grandStaff),
      dataComment: '复谱表上方插槽',
    });
    grandStaffCurrentY += gUH;

    let prevMeasureStartY: number | undefined = undefined;
    /** 单谱表小节行 Y 范围（不含单谱表/复谱表上下边距与插槽） */
    const staffMeasureBounds: { measureTopY: number; measureBottomY: number }[] = [];
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
        slotData: slotDataForSingleStaff(musicScore, grandStaff, staff),
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
        slotData: slotDataForSingleStaff(musicScore, grandStaff, staff),
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
        slotData: slotDataForSingleStaff(musicScore, grandStaff, staff),
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
        slotData: slotDataForSingleStaff(musicScore, grandStaff, staff),
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
          slotData: slotDataForMeasure(musicScore, grandStaff, staff, measure),
          dataComment: '小节上方插槽',
        });
        measureCurrentX += measureWidth;
      }
      measureCurrentX = grandStaffX;

      const currentMeasureStartY = grandStaffCurrentY + staffUSpaceI;
      if (linkedStaff && i >= 1 && prevMeasureStartY !== undefined) {
        const linkedBarlineY = prevMeasureStartY + measureHeight;
        const linkedBarlineH = currentMeasureStartY - linkedBarlineY;
        const linkedCloseLineKey = StandardStaffSkinKeyEnum.linked_close_line;
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
            const linkedKeyF = getLinkedBarlineSkinKey(measure.barline_f.type);
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
            const linkedKeyB = getLinkedBarlineSkinKey(measure.barline_b.type);
            const barlineItem = skin[linkedKeyB];
            const barlineW = barlineItem?.w ?? 0;
            vDoms.push({
              startPoint: {x: 0, y: 0},
              endPoint: {x: 0, y: 0},
              special: {},
              x: barlineX,
              y: linkedBarlineY,
              w: barlineW,
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

      const measureTopY = grandStaffCurrentY;
      measureCurrentX = grandStaffX;

      // 单谱表开始要加一个闭合线，闭合第一小节左侧
      const closeLineSkinKey = StandardStaffSkinKeyEnum.Close_line;
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
        renderSingleMeasureAffiliatedSymbols(
          measure,
          measureCurrentX,
          grandStaffCurrentY,
          measureWidth,
          measureHeight,
          {VDoms: vDoms, idMap: nodeIdMap, skinName: effectiveSkinName, skin, measureHeight},
        );
        /*
         * 【阶段一 · 小节符号】必须在 processBeam / processGraceBeam 之前 apply（见文件头「为何不只在末尾 apply」）。
         * Frame 不参与小节宽度、符干长度等布局公式，只改最终 vDom 几何。
         *
         * 本段 vDom：renderSymbol、renderMeasureRepeat、renderSingleMeasureAffiliatedSymbols。
         * 级联：NoteSymbol → NotesInfo → accidental / augmentationDot / affiliatedSymbols / 倚音链（collectRelativeFrameMap）。
         *
         * 符杠依赖符干 vDom：processBeam 用 stem.x、stem.y 定符杠斜率与 noteBeam 端点；符干须先偏移，
         * 符杠随后生成即与音符对齐（noteBeam 无 targetId，末尾统一 apply 覆盖不到符杠几何重算）。
         */
        applyRelativeFramesToVDomRange(vDoms, relativeFrameMap, symbolVDomsStartIdx, vDoms.length, relativeApplied);
        /*
        * 渲染符杠
        * 这个函数内部会调整已经存在的符干和符尾（拉伸符干和去掉符尾）
        * */
        processBeam({
          measure: measure as { notes: import("@/types/MusicScoreType").StaffSlot[] },
          nodeIdMap,
          vDoms,
          symbolVDomsStartIdx,
          symbolVDomsLength: symbolVDoms.length,
          skin,
          measureHeight,
          measureLineWidth,
          skinName: effectiveSkinName,
        });
        processGraceBeam({
          measure: measure as { notes: import("@/types/MusicScoreType").StaffSlot[] },
          nodeIdMap,
          vDoms,
          symbolVDomsStartIdx,
          symbolVDomsLength: symbolVDoms.length,
          skin,
          measureHeight,
          measureLineWidth,
          skinName: effectiveSkinName,
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
          slotData: slotDataForMeasure(musicScore, grandStaff, staff, measure),
          dataComment: '小节插槽',
        });
        measureCurrentX += measureWidth;
      }
      grandStaffCurrentY += measureHeight;
      const measureBottomY = measureTopY + measureHeight;
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
          slotData: slotDataForMeasure(musicScore, grandStaff, staff, measure),
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
        slotData: slotDataForSingleStaff(musicScore, grandStaff, staff),
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
      staffMeasureBounds.push({measureTopY, measureBottomY});
    }

    const bracket = grandStaff.bracket;
    if (bracket) {
      const startIdx = bracket.startSingleStaffIndex;
      const endIdx = grandStaff.staves.length - 1;
      if (
        startIdx >= 0 &&
        startIdx < staffMeasureBounds.length &&
        endIdx >= startIdx &&
        endIdx - startIdx + 1 >= 2
      ) {
        const topY = staffMeasureBounds[startIdx]!.measureTopY;
        const bottomY = staffMeasureBounds[endIdx]!.measureBottomY;
        const bracketSkinKey = getBracketSkinKey(bracket.type);
        const bracketItem = skin[bracketSkinKey];
        const bracketW = bracketItem?.w ?? 16;
        vDoms.push({
          startPoint: {x: 0, y: 0},
          endPoint: {x: 0, y: 0},
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
      slotData: slotDataForGrandStaff(musicScore, grandStaff),
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
      slotData: slotDataForMusicScore(musicScore),
      dataComment: '底部插槽',
    });
  }
  /*
  * 渲染双音符或双小节附属符号
  * slur,volta
  * */
  /*
   * 【阶段二 · 布局补扫】不能并入「末尾一次 apply」的原因：① 阶段一必须在符杠前，不能拖到全曲结束；
   * ② 本段 vDom（连谱号 bracket、插槽、小节 measure 框等）在阶段一之后才 push，当时还不存在。
   * relativeApplied 跳过阶段一已处理节点，避免重复偏移。
   * 须在 renderMusicScoreAffiliatedSymbols 之前：连音线通过符干/音符头 vDom 取锚点，需 noteHead 已偏移。
   */
  applyRelativeFramesToVDomRange(vDoms, relativeFrameMap, 0, vDoms.length, relativeApplied);
  const scoreAffiliatedStartIdx = vDoms.length;
  renderMusicScoreAffiliatedSymbols(musicScore, {
    VDoms: vDoms,
    idMap: nodeIdMap,
    skinName: effectiveSkinName,
    skin,
  });
  /*
   * 【阶段三 · 曲谱级附属】本批 vDom 在阶段二之后才创建，故单独 apply；不能与前两阶段合并为「曲谱末尾一次」
   *（阶段一必须早于符杠，阶段二必须早于连音线取锚点）。
   * slur：锚点来自已偏移 noteHead + data.slur 造型点；再对 sym.id 施加 Frame（平移 startPoint/endPoint）。
   * volta：基于已偏移 measure 布局，再对 sym.id 施加 Frame（含 relativeW/H）。
   */
  applyRelativeFramesToVDomRange(vDoms, relativeFrameMap, scoreAffiliatedStartIdx, vDoms.length, relativeApplied);
  vDoms.sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
  return vDoms;
}
