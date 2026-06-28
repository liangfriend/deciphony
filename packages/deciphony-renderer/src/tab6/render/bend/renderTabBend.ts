import {BendTypeEnum} from '@/enums/musicScoreEnum';
import {Tab6SkinKeyEnum} from '@/tab6/enums/tab6SkinKeyEnum';
import type {VDom} from '@/types/common';
import type {Bend} from '@/types/MusicScoreType';
import {
  TAB_6_BEND_PERIOD_ONE_HEIGHT_RATIO,
  TAB_6_BEND_PERIOD_TWO_HEIGHT_RATIO,
  TAB_6_BEND_TEXT_OFFSET_RATIO,
  TAB_6_BEND_THICKNESS_RATIO,
} from '../constants';
import {formatBendSemitoneLabel} from './formatBendSemitone';

type Pt = { x: number; y: number };
type BendPeriodSpecial = NonNullable<VDom['special']['bend']>['period_one'];

function isPrebendType(type: BendTypeEnum): boolean {
  return type === BendTypeEnum.Prebend
    || type === BendTypeEnum.PrebendRelease
    || type === BendTypeEnum.PrebendBend;
}

function controlPoints(start: Pt, end: Pt, prebend: boolean): { cp1: Pt; cp2: Pt } {
  if (prebend) {
    const dy = end.y - start.y;
    return {
      cp1: {x: start.x, y: start.y + dy / 3},
      cp2: {x: start.x, y: start.y + (dy * 2) / 3},
    };
  }
  const midX = (start.x + end.x) / 2;
  // 向上（end 在上方）：cp 贴在起点水平线，先横后竖
  //   end
  // cp1  cp2
  // start
  if (end.y <= start.y) {
    return {cp1: {x: midX, y: start.y}, cp2: {x: end.x, y: start.y}};
  }
  // 向下（end 在下方）：cp 同样贴在起点（上方）水平线，再落到 end
  // start  cp1  cp2
  //            end
  return {cp1: {x: midX, y: start.y}, cp2: {x: end.x, y: start.y}};
}

function buildPeriod(
  start: Pt,
  end: Pt,
  prebend: boolean,
  semitone: number | null | undefined,
  measureHeight: number,
): BendPeriodSpecial {
  const {cp1, cp2} = controlPoints(start, end, prebend);
  const textOffset = measureHeight * TAB_6_BEND_TEXT_OFFSET_RATIO;
  return {
    relativeStartPoint: start,
    relativeEndPoint: end,
    relativeStartControlPoint: cp1,
    relativeEndControlPoint: cp2,
    relativeTextPoint: {x: 0, y: -textOffset},
    text: semitone != null ? formatBendSemitoneLabel(semitone) : '',
  };
}

function resolvePeriodOneEnd(
  type: BendTypeEnum,
  noteCenterX: number,
  noteCenterY: number,
  slotEndX: number,
  h1: number,
): Pt {
  // 阶段1均为向上（y 减小）
  if (type === BendTypeEnum.Bend) {
    return {x: slotEndX, y: noteCenterY - h1};
  }
  if (type === BendTypeEnum.BendRelease) {
    return {x: (noteCenterX + slotEndX) / 2, y: noteCenterY - h1};
  }
  return {x: noteCenterX, y: noteCenterY - h1};
}

function resolvePeriodTwoEnd(
  type: BendTypeEnum,
  periodOneEnd: Pt,
  noteCenterY: number,
  slotEndX: number,
  h2: number,
): Pt | null {
  switch (type) {
    case BendTypeEnum.BendRelease:
    case BendTypeEnum.PrebendRelease:
      // 阶段2向下回到音符高度
      return {x: slotEndX, y: noteCenterY};
    case BendTypeEnum.PrebendBend:
      // 阶段2继续向上
      return {x: slotEndX, y: periodOneEnd.y - h2};
    default:
      return null;
  }
}

export function buildTabBendVDom(params: {
  bend: Bend;
  noteCenterX: number;
  noteCenterY: number;
  slotEndX: number;
  measureHeight: number;
  skinName: string;
  zIndex: number;
}): VDom | null {
  const {bend, noteCenterX, noteCenterY, slotEndX, measureHeight, skinName, zIndex} = params;
  const h1 = measureHeight * TAB_6_BEND_PERIOD_ONE_HEIGHT_RATIO;
  const h2 = measureHeight * TAB_6_BEND_PERIOD_TWO_HEIGHT_RATIO;
  const start: Pt = {x: noteCenterX, y: noteCenterY};
  const prebend = isPrebendType(bend.type);
  const periodOneEnd = resolvePeriodOneEnd(bend.type, noteCenterX, noteCenterY, slotEndX, h1);
  const period_one = buildPeriod(start, periodOneEnd, prebend, bend.periodOne, measureHeight);

  let period_two: BendPeriodSpecial | undefined;
  if (bend.periodTwo != null) {
    const periodTwoEnd = resolvePeriodTwoEnd(bend.type, periodOneEnd, noteCenterY, slotEndX, h2);
    if (periodTwoEnd) {
      period_two = buildPeriod(periodOneEnd, periodTwoEnd, false, bend.periodTwo, measureHeight);
    }
  }

  return {
    x: 0,
    y: 0,
    w: 0,
    h: 0,
    startPoint: start,
    endPoint: period_two?.relativeEndPoint ?? period_one.relativeEndPoint,
    zIndex,
    tag: 'bend',
    skinKey: Tab6SkinKeyEnum.Bend,
    skinName,
    targetId: bend.id,
    special: {
      bend: {
        period_one,
        ...(period_two ? {period_two} : {}),
        thickness: Math.max(1, measureHeight * TAB_6_BEND_THICKNESS_RATIO),
        type: bend.type,
      },
    },
    dataComment: '推弦',
  };
}
