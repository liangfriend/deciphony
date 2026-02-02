/*
 * 将 musicScore 转换为平铺的 vDom 列表
 * 计算并输出：复谱表、单谱表、13 个曲谱层面插槽
 * 小节及更细部分由调用方处理（m 插槽处预留空间）
 */

import {VDom, SlotName, SlotConfig} from "@/types/common";
import {MusicScore} from "@/types/MusicScoreType";
import {MEASURE_HEIGHT} from "@/standardStaff/constant";

function getSlotH(config: SlotConfig | undefined, name: SlotName): number {
  return config?.[name]?.h ?? 0;
}

function getSlotW(config: SlotConfig | undefined, name: SlotName): number {
  return config?.[name]?.w ?? 0;
}

/**
 * 将 musicScore 转换为平铺的 vDom 列表
 * @param musicScore 曲谱数据（纯展示数据，不含插槽配置）
 * @param slotConfig 插槽配置，由扩展插件组合提供（如歌词、符号注释等），可随意开关
 */
export function musicScoreToVDom(musicScore: MusicScore, slotConfig?: SlotConfig): VDom[] {
  const {width, grandStaffs} = musicScore;
  const config = slotConfig ?? {};
  const vDoms: VDom[] = [];

  const fLeftW = getSlotW(config, 'f-left');
  const fRightW = getSlotW(config, 'f-right');
  const grandStaffX = fLeftW;
  const grandStaffW = width - fLeftW - fRightW;

  const gUH = getSlotH(config, 'g-u');
  const gDH = getSlotH(config, 'g-d');
  const sUH = getSlotH(config, 's-u');
  const sDH = getSlotH(config, 's-d');
  const mUH = getSlotH(config, 'm-u');
  const mDH = getSlotH(config, 'm-d');

  let scoreCurrentY = 0;

  for (const grandStaff of grandStaffs) {
    const grandStaffStartY = scoreCurrentY;

    // f-left 插槽（先占位，高度稍后补全）
    if (fLeftW > 0) {
      vDoms.push({
        x: 0,
        y: grandStaffStartY,
        w: fLeftW,
        h: 0, // 临时，下方补全
        zIndex: 1000,
        tag: 'slot',
        slotName: 'f-left',
        dataComment: 'f-left插槽',
      });
    }

    // f-right 插槽
    if (fRightW > 0) {
      vDoms.push({
        x: width - fRightW,
        y: grandStaffStartY,
        w: fRightW,
        h: 0,
        zIndex: 1000,
        tag: 'slot',
        slotName: 'f-right',
        dataComment: 'f-right插槽',
      });
    }

    let grandStaffCurrentY = grandStaffStartY;

    // 复谱表容器 vDom（先占位，高度稍后补全）
    const grandStaffVDom: VDom = {
      x: grandStaffX,
      y: grandStaffStartY,
      w: grandStaffW,
      h: 0,
      zIndex: 1000,
      tag: 'grandStaff',
      dataComment: '复谱表',
    };
    vDoms.push(grandStaffVDom);

    // g-u 插槽
    vDoms.push({
      x: grandStaffX,
      y: grandStaffCurrentY,
      w: grandStaffW,
      h: gUH,
      zIndex: 1000,
      tag: 'slot',
      slotName: 'g-u',
      dataComment: 'g-u插槽',
    });
    grandStaffCurrentY += gUH;

    // 间距插槽高度由复谱表/单谱表的 uSpace、dSpace 决定
    const sUSpaceH = grandStaff.uSpace  // s-u-space 宽高=复谱表u-space
    const sDSpaceH = grandStaff.dSpace  // s-d-space 宽高=复谱表d-space

    for (let i = 0; i < grandStaff.staves.length; i++) {
      const staff = grandStaff.staves[i];
      const staffUSpace = staff.uSpace
      const staffDSpace = staff.dSpace
      const mUSpaceH = staff.uSpace  // m-u-space 宽高=单谱表u-space
      const mDSpaceH = staff.dSpace  // m-d-space 宽高=单谱表d-space

      // 单谱表容器 vDom（高度=各插槽之和，顺序：s-u-space, s-u, m-u-space, m-u, m, m-d, m-d-space, s-d, s-d-space）
      const singleStaffH = sUH + mUSpaceH + mUH + MEASURE_HEIGHT + mDH + mDSpaceH + sDH
      vDoms.push({
        x: grandStaffX,
        y: grandStaffCurrentY,
        w: grandStaffW,
        h: singleStaffH,
        zIndex: 1000,
        tag: 'singleStaff',
        dataComment: '单谱表',
      });

      // s-u-space（尺寸=复谱表u-space）
      vDoms.push({
        x: grandStaffX,
        y: grandStaffCurrentY,
        w: grandStaffW,
        h: sUSpaceH,
        zIndex: 1000,
        tag: 'slot',
        slotName: 's-u-space',
        dataComment: 's-u-space插槽',
      });
      grandStaffCurrentY += sUSpaceH;

      // s-u
      vDoms.push({
        x: grandStaffX,
        y: grandStaffCurrentY,
        w: grandStaffW,
        h: staffUSpace,
        zIndex: 1000,
        tag: 'slot',
        slotName: 's-u',
        dataComment: 's-u插槽',
      });
      grandStaffCurrentY += staffUSpace;

      // m-u-space（尺寸=单谱表u-space）
      vDoms.push({
        x: grandStaffX,
        y: grandStaffCurrentY,
        w: grandStaffW,
        h: mUSpaceH,
        zIndex: 1000,
        tag: 'slot',
        slotName: 'm-u-space',
        dataComment: 'm-u-space插槽',
      });
      grandStaffCurrentY += mUSpaceH;

      // m-u
      vDoms.push({
        x: grandStaffX,
        y: grandStaffCurrentY,
        w: grandStaffW,
        h: mUH,
        zIndex: 1000,
        tag: 'slot',
        slotName: 'm-u',
        dataComment: 'm-u插槽',
      });
      grandStaffCurrentY += mUH;

      // m 小节区域：预留 MEASURE_HEIGHT，由调用方填充内容
      vDoms.push({
        x: grandStaffX,
        y: grandStaffCurrentY,
        w: grandStaffW,
        h: MEASURE_HEIGHT,
        zIndex: 1000,
        tag: 'slot',
        slotName: 'm',
        dataComment: '小节',
      });
      grandStaffCurrentY += MEASURE_HEIGHT;

      // m-d
      vDoms.push({
        x: grandStaffX,
        y: grandStaffCurrentY,
        w: grandStaffW,
        h: mDH,
        zIndex: 1000,
        tag: 'slot',
        slotName: 'm-d',
        dataComment: 'm-d插槽',
      });
      grandStaffCurrentY += mDH;

      // m-d-space（尺寸=单谱表d-space，在 m 下方）
      vDoms.push({
        x: grandStaffX,
        y: grandStaffCurrentY,
        w: grandStaffW,
        h: mDSpaceH,
        zIndex: 1000,
        tag: 'slot',
        slotName: 'm-d-space',
        dataComment: 'm-d-space插槽',
      });
      grandStaffCurrentY += mDSpaceH;

      // s-d
      vDoms.push({
        x: grandStaffX,
        y: grandStaffCurrentY,
        w: grandStaffW,
        h: staffDSpace,
        zIndex: 1000,
        tag: 'slot',
        slotName: 's-d',
        dataComment: 's-d插槽',
      });
      grandStaffCurrentY += staffDSpace;

      // s-d-space（尺寸=复谱表d-space）
      vDoms.push({
        x: grandStaffX,
        y: grandStaffCurrentY,
        w: grandStaffW,
        h: sDSpaceH,
        zIndex: 1000,
        tag: 'slot',
        slotName: 's-d-space',
        dataComment: 's-d-space插槽',
      });
      grandStaffCurrentY += sDSpaceH;
    }

    // g-d 插槽
    vDoms.push({
      x: grandStaffX,
      y: grandStaffCurrentY,
      w: grandStaffW,
      h: gDH,
      zIndex: 1000,
      tag: 'slot',
      slotName: 'g-d',
      dataComment: 'g-d插槽',
    });
    grandStaffCurrentY += gDH;

    const grandStaffH = grandStaffCurrentY - grandStaffStartY;
    scoreCurrentY = grandStaffCurrentY;

    grandStaffVDom.h = grandStaffH;

    // 补全 f-left、f-right 的高度
    if (fLeftW > 0) {
      const fLeft = vDoms.find(v => v.slotName === 'f-left' && v.y === grandStaffStartY);
      if (fLeft) fLeft.h = grandStaffH;
    }
    if (fRightW > 0) {
      const fRight = vDoms.find(v => v.slotName === 'f-right' && v.y === grandStaffStartY);
      if (fRight) fRight.h = grandStaffH;
    }
  }

  return vDoms;
}
