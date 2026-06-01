import {MeasureEndRepeatEnum, MeasureStartRepeatEnum} from '@/enums/musicScoreEnum';
import type {NumberNotationSkinPack, Skin, SkinItem, StandardStaffSkinPack, VDom, VDomTagType} from '@/types/common';
import type {Measure} from '@/types/MusicScoreType';
import type {NodeIdMap} from '@/standardStaff/render/types';
import {getEndRepeatSkinKey, getStartRepeatSkinKey} from './repeatSkinKey';

/** 反复符号默认贴齐小节顶边上方（相对 measureHeight 的比例） */
export const REPEAT_MARK_ABOVE_RATIO = 1 / 8;

export type RenderMeasureRepeatParams = {
  measure: Measure;
  measureX: number;
  measureY: number;
  measureWidth: number;
  measureHeight: number;
  skin: StandardStaffSkinPack | NumberNotationSkinPack;
  idMap: NodeIdMap;
  skinName?: string;
};

function setNodeIdMap(map: NodeIdMap, id: string, tag: VDomTagType, vdom: VDom): void {
  let obj = map.get(id);
  if (!obj) {
    obj = {};
    map.set(id, obj);
  }
  obj[tag] = vdom;
}

function pushRepeatMark(
  out: VDom[],
  params: RenderMeasureRepeatParams,
  tag: 'repeat_f' | 'repeat_b',
  skinKey: ReturnType<typeof getStartRepeatSkinKey>,
  targetId: string,
  x: number,
  y: number,
  dataComment: string,
  relativeX = 0,
): void {
  const {skin, skinName, idMap} = params;
  const item = skin[skinKey as keyof typeof skin] as SkinItem;
  if (!item) return;
  const vdom: VDom = {
    startPoint: {x: 0, y: 0},
    endPoint: {x: 0, y: 0},
    special: {},
    x: x + relativeX,
    y,
    w: item.w,
    h: item.h,
    zIndex: 1200,
    tag,
    skinName: skinName ?? 'default',
    targetId,
    skinKey: skinKey as VDom['skinKey'],
    dataComment,
  };
  out.push(vdom);
  setNodeIdMap(idMap, targetId, tag, vdom);
}

/** 小节前反复：符号几何中心 x = measureX */
function startRepeatX(measureX: number, skinW: number): number {
  return measureX - skinW / 2;
}

/** 小节末反复：符号右缘 x+w = measureX + measureWidth */
function endRepeatX(measureX: number, measureWidth: number, skinW: number): number {
  return measureX + measureWidth - skinW;
}

function repeatMarkY(measureY: number, measureHeight: number, skinH: number, relativeY = 0): number {
  return measureY - skinH - REPEAT_MARK_ABOVE_RATIO * measureHeight + relativeY;
}

export function renderMeasureRepeat(params: RenderMeasureRepeatParams): VDom[] {
  const {measure, measureX, measureY, measureWidth, measureHeight, skin} = params;
  const out: VDom[] = [];

  if (measure.startRepeat) {
    const sr = measure.startRepeat;
    const skinKey = getStartRepeatSkinKey(sr.type);
    const item = skin[skinKey as keyof typeof skin] as SkinItem;
    if (item) {
      pushRepeatMark(
        out,
        params,
        'repeat_f',
        skinKey,
        sr.id,
        startRepeatX(measureX, item.w),
        repeatMarkY(measureY, measureHeight, item.h, sr.relativeY),
        sr.type === MeasureStartRepeatEnum.Coda ? '反复符号 Coda' : '反复符号 Segno',
        sr.relativeX,
      );
    }
  }

  if (measure.endRepeat) {
    const er = measure.endRepeat;
    const skinKey = getEndRepeatSkinKey(er.type);
    const item = skin[skinKey as keyof typeof skin] as SkinItem;
    if (item) {
      pushRepeatMark(
        out,
        params,
        'repeat_b',
        skinKey,
        er.id,
        endRepeatX(measureX, measureWidth, item.w),
        repeatMarkY(measureY, measureHeight, item.h, er.relativeY),
        '反复符号',
        er.relativeX,
      );
    }
  }

  return out;
}
