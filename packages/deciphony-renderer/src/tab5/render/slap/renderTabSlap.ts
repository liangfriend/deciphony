import type {VDom} from '@/types/common';
import {Tab6SkinKeyEnum} from '@/tab6/enums/tab6SkinKeyEnum';

export function buildTabSlapVDom(params: {
  startPoint: { x: number; y: number };
  endPoint: { x: number; y: number };
  targetId: string;
  skinName: string;
  zIndex: number;
}): VDom {
  const {startPoint, endPoint, targetId, skinName, zIndex} = params;
  const w = Math.max(0, endPoint.x - startPoint.x);
  const h = Math.max(0, endPoint.y - startPoint.y);
  return {
    x: 0,
    y: 0,
    w,
    h,
    zIndex,
    tag: 'tabSlap',
    skinKey: Tab6SkinKeyEnum.Tab_slap,
    skinName,
    targetId,
    startPoint,
    endPoint,
    special: {tabSlap: {}},
    dataComment: '拍弦',
  };
}
