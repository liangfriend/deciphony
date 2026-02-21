import type {StandardStaffSkinPack} from "@/types/common";
import {VDom} from "@/types/common";
import {NoteSymbol} from "@/types/MusicScoreType";
import {NoteSymbolTypeEnum} from "@/enums/musicScoreEnum";
import {StandardStaffSkinKeyEnum} from "@/standardStaff/enums/standardStaffSkinKeyEnum";
import type {NodeIdMap} from "../types";
import {LINE_SPACING_RATIO, MIN_STEM_HEIGHT_RATIO, STEM_Y_OFFSET} from "../constants";
import {getNoteTailSkinKey} from "../utils/skinKey";

function getStemLength(params: {
  direction: 'up' | 'down';
  headCenterY: number;
  measureY: number;
  measureHeight: number;
}): number {
  const {direction, headCenterY, measureY, measureHeight} = params;
  const minStem = MIN_STEM_HEIGHT_RATIO * measureHeight;
  const staffCenterY = measureY + measureHeight / 2;
  const lineSpacing = measureHeight * LINE_SPACING_RATIO;
  const elongationThreshold = lineSpacing * 2;
  if (direction === 'up') {
    if (headCenterY - staffCenterY + elongationThreshold < minStem) {
      return minStem;
    }
    return headCenterY - staffCenterY + elongationThreshold;
  }
  if (direction === 'down') {
    if (staffCenterY - headCenterY + elongationThreshold < minStem) {
      return minStem;
    }
    return staffCenterY - headCenterY + elongationThreshold;
  }
  return minStem;
}

/**
 * 符干与符尾：chronaxie < 256 出符干，≤32 出符尾
 */
export function renderStemAndTail(params: {
  note: NoteSymbol;
  headX: number;
  headY: number;
  headW: number;
  headH: number;
  measureY: number;
  measureHeight: number;
  measureWidth: number;
  skin: StandardStaffSkinPack;
  zIndex: number;
  idMap: NodeIdMap;
  chronaxie?: number;
  direction?: 'up' | 'down';
  stemTargetId?: string;
  headCenterYOther?: number;
  skinName?: string;
}): VDom[] {
  const {
    note,
    headX,
    headY,
    headW,
    headH,
    measureY,
    measureHeight,
    skin,
    zIndex,
    stemTargetId,
    headCenterYOther,
  } = params;
  const skinNameForNodes = params.skinName ?? 'default';
  const chronaxie = params.chronaxie ?? (note as { chronaxie?: number }).chronaxie ?? 64;
  const direction = params.direction ?? note.direction;
  const out: VDom[] = [];
  // 如果是休止符直接返回
  if (note.type === NoteSymbolTypeEnum.Rest || chronaxie >= 256) return out;

  const stemSkin = skin[StandardStaffSkinKeyEnum.NoteStem];
  // 如果没有对应皮肤包直接返回
  if (!stemSkin) return out;

  const headCenterY = headY + headH / 2;
  // 推算出初始的符干高度
  const stemLength = getStemLength({direction, headCenterY, measureY, measureHeight});
  const stemW = stemSkin.w;
  const targetId = stemTargetId ?? note.id ?? '';
  // 符干需要稍微偏移以完美契合倾斜的椭圆音符头
  const stemYOffset = STEM_Y_OFFSET * measureHeight;
  // 如果有和弦的存在，符干要进行延长以覆盖和弦内所有的音符头
  const chordSpan =
      headCenterYOther != null && headCenterYOther !== headCenterY
          ? Math.abs(headCenterYOther - headCenterY)
          : 0;
  // 处理好和弦的符干高度，但是这不一定是最终高度，因为后续因为符杠逻辑还可能会被处理
  const totalStemH = stemLength + chordSpan - stemYOffset;
  // 符干和符尾的渲染
  if (direction === 'up') {
    const stemX = headX + headW - stemW;
    const stemY = headCenterY - stemLength;
    out.push({
      startPoint: {x: 0, y: 0},
      endPoint: {x: 0, y: 0},
      special: {},
      x: stemX,
      y: stemY,
      w: stemW,
      h: totalStemH,
      zIndex,
      tag: 'noteStem',
      skinName: skinNameForNodes,
      targetId,
      skinKey: StandardStaffSkinKeyEnum.NoteStem,
      dataComment: '符干',
    });
    if (chronaxie <= 32) {
      const tailKey = getNoteTailSkinKey(chronaxie, direction);
      const tailSkin = skin[tailKey];
      let noteTailYOffset = 0;
      if (chronaxie === 2) noteTailYOffset = measureHeight / 8;
      if (chronaxie === 1) noteTailYOffset = measureHeight * 2 / 8;
      if (tailSkin) {
        out.push({
          startPoint: {x: 0, y: 0},
          endPoint: {x: 0, y: 0},
          special: {},
          x: stemX,
          y: stemY - noteTailYOffset,
          w: tailSkin.w,
          h: tailSkin.h,
          zIndex,
          tag: 'noteTail',
          skinName: skinNameForNodes,
          targetId,
          skinKey: tailKey,
          dataComment: '符尾',
        });
      }
    }
  } else {
    const stemX = headX;
    const stemYTop = (headCenterYOther ?? headCenterY) + stemYOffset;
    out.push({
      startPoint: {x: 0, y: 0},
      endPoint: {x: 0, y: 0},
      special: {},
      x: stemX,
      y: stemYTop,
      w: stemW,
      h: totalStemH,
      zIndex,
      tag: 'noteStem',
      skinName: skinNameForNodes,
      targetId,
      skinKey: StandardStaffSkinKeyEnum.NoteStem,
      dataComment: '符干',
    });
    if (chronaxie <= 32) {
      const tailKey = getNoteTailSkinKey(chronaxie, direction);
      const tailSkin = skin[tailKey];
      let noteTailYOffset = 0;
      if (chronaxie === 8) noteTailYOffset = measureHeight / 8;
      if (chronaxie === 4) noteTailYOffset = measureHeight * 2 / 8;
      if (chronaxie === 2) noteTailYOffset = measureHeight * 3 / 8;
      if (chronaxie === 1) noteTailYOffset = measureHeight * 4 / 8;
      if (tailSkin) {
        out.push({
          startPoint: {x: 0, y: 0},
          endPoint: {x: 0, y: 0},
          special: {},
          x: stemX,
          y: stemYTop + totalStemH - tailSkin.h + noteTailYOffset,
          w: tailSkin.w,
          h: tailSkin.h,
          zIndex,
          tag: 'noteTail',
          skinName: skinNameForNodes,
          targetId,
          skinKey: tailKey,
          dataComment: '符尾',
        });
      }
    }
  }
  return out;
}
