import type {GuitarTabSkinPack} from '@/types/common';
import {VDom} from '@/types/common';
import type {NotesInfo, NoteSymbol} from '@/types/MusicScoreType';
import {GuitarTabSkinKeyEnum} from '@/guitarTab/enums/guitarTabSkinKeyEnum';
import type {NodeIdMap} from '../types';
import {
  GUITAR_TAB_STEM_END_OFFSET_RATIO,
  GUITAR_TAB_STEM_END_OFFSET_RATIO_WITH_TAIL,
  GUITAR_TAB_STEM_START_OFFSET_RATIO,
} from '../constants';
import {getNoteTailSkinKey} from '../utils/skinKey';
import {GRACE_NOTE_SCALE} from '@/render/graceNote';

export type RenderGuitarTabStemAndTailParams = {
  note: NoteSymbol;
  allNotesInfo: NotesInfo[];
  idMap: NodeIdMap;
  /** 锚点符头缺失时的 x 回退 */
  slotX: number;
  measureY: number;
  measureHeight: number;
  skin: GuitarTabSkinPack;
  zIndex: number;
  skinName?: string;
  noteCenterY: (region: number) => number;
  isGrace?: boolean;
};

function renderStemFromHeadAnchor(params: {
  headX: number;
  headY: number;
  headW: number;
  headH: number;
  measureY: number;
  measureHeight: number;
  chronaxie: number;
  targetId: string;
  skin: GuitarTabSkinPack;
  zIndex: number;
  skinName: string;
  isGrace?: boolean;
}): VDom[] {
  const {
    headX,
    headY,
    headW,
    headH,
    measureY,
    measureHeight,
    chronaxie,
    targetId,
    skin,
    zIndex,
    skinName,
    isGrace = false,
  } = params;
  const out: VDom[] = [];
  if (chronaxie >= 256) return out;

  const stemSkin = skin[GuitarTabSkinKeyEnum.NoteStem];
  if (!stemSkin) return out;

  const headCenterX = headX + headW / 2;
  const headCenterY = headY + headH / 2;
  const stemStartY = headCenterY + GUITAR_TAB_STEM_START_OFFSET_RATIO * measureHeight;
  const hasTail = chronaxie <= 32;
  const stemEndOffsetRatio = hasTail
    ? GUITAR_TAB_STEM_END_OFFSET_RATIO_WITH_TAIL
    : GUITAR_TAB_STEM_END_OFFSET_RATIO;
  const stemEndY = measureY + measureHeight + stemEndOffsetRatio * measureHeight;
  const stemW = stemSkin.w * (isGrace ? GRACE_NOTE_SCALE : 1);
  const stemX = headCenterX - stemW / 2;
  const stemH = Math.max(0, stemEndY - stemStartY);

  out.push({
    startPoint: {x: 0, y: 0},
    endPoint: {x: 0, y: 0},
    special: {},
    x: stemX,
    y: stemStartY,
    w: stemW,
    h: stemH,
    zIndex,
    tag: 'noteStem',
    skinName,
    targetId,
    skinKey: GuitarTabSkinKeyEnum.NoteStem,
    dataComment: isGrace ? '倚音符干' : '符干',
  });

  if (hasTail) {
    const tailKey = getNoteTailSkinKey(chronaxie, 'down');
    const tailSkin = skin[tailKey];
    if (tailSkin) {
      out.push({
        startPoint: {x: 0, y: 0},
        endPoint: {x: 0, y: 0},
        special: {},
        x: stemX,
        y: stemEndY - tailSkin.h,
        w: tailSkin.w,
        h: tailSkin.h,
        zIndex,
        tag: 'noteTail',
        skinName,
        targetId,
        skinKey: tailKey,
        dataComment: isGrace ? '倚音符尾' : '符尾',
        ...(isGrace ? {scale: GRACE_NOTE_SCALE} : {}),
      });
    }
  }
  return out;
}

/**
 * 吉他谱 slot 符干符尾：锚点 = region 最小的 notesInfo；时值取 notesInfo[0]。
 */
export function renderGuitarTabStemAndTailForSlot(
  params: RenderGuitarTabStemAndTailParams,
): VDom[] {
  const {
    allNotesInfo,
    idMap,
    slotX,
    measureY,
    measureHeight,
    skin,
    zIndex,
    noteCenterY,
    isGrace = false,
  } = params;
  const skinName = params.skinName ?? 'default';
  if (allNotesInfo.length === 0) return [];

  const chronaxie = allNotesInfo[0].chronaxie;
  const targetId = allNotesInfo[0].id;
  const anchorRegion = Math.min(...allNotesInfo.map((n) => n.region));
  const anchor = allNotesInfo.find((n) => n.region === anchorRegion);
  if (!anchor) return [];

  const headVDom = idMap.get(anchor.id)?.noteHead;
  const headW = headVDom?.w ?? 0;
  const headH = headVDom?.h ?? 0;
  const headX = headVDom?.x ?? slotX;
  const headY = headVDom?.y ?? (noteCenterY(anchorRegion) - headH / 2);

  return renderStemFromHeadAnchor({
    headX,
    headY,
    headW,
    headH,
    measureY,
    measureHeight,
    chronaxie,
    targetId,
    skin,
    zIndex,
    skinName,
    isGrace,
  });
}

/** 保留倚音等旧调用签名 */
export type RenderStemAndTailParams = {
  note: NoteSymbol;
  headX: number;
  headY: number;
  headW: number;
  headH: number;
  measureY: number;
  measureHeight: number;
  measureWidth: number;
  skin: GuitarTabSkinPack;
  zIndex: number;
  idMap: NodeIdMap;
  chronaxie?: number;
  direction?: 'up' | 'down';
  stemTargetId?: string;
  headCenterYOther?: number;
  skinName?: string;
  isGrace?: boolean;
};

export function renderStemAndTail(params: RenderStemAndTailParams): VDom[] {
  const chronaxie = params.chronaxie ?? params.note.notesInfo[0]?.chronaxie ?? 64;
  return renderStemFromHeadAnchor({
    headX: params.headX,
    headY: params.headY,
    headW: params.headW,
    headH: params.headH,
    measureY: params.measureY,
    measureHeight: params.measureHeight,
    chronaxie,
    targetId: params.stemTargetId ?? params.note.notesInfo[0]?.id ?? params.note.id ?? '',
    skin: params.skin,
    zIndex: params.zIndex,
    skinName: params.skinName ?? 'default',
    isGrace: params.isGrace,
  });
}

export function renderGraceStemAndTail(
  params: Omit<RenderStemAndTailParams, 'isGrace'>,
): VDom[] {
  return renderStemAndTail({...params, isGrace: true});
}
