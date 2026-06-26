import type {GuitarTabSkinPack} from '@/types/common';
import {VDom} from '@/types/common';
import {TabNoteInfoTypeEnum} from '@/enums/musicScoreEnum';
import type {NoteSymbol, TabNoteInfo} from '@/types/MusicScoreType';
import {getTabNoteStemAnchorRegion} from '../utils/tabNoteInfo';
import {GuitarTabSkinKeyEnum} from '@/guitarTab/enums/guitarTabSkinKeyEnum';
import type {NodeIdMap} from '../types';
import {
  GUITAR_TAB_STEM_END_OFFSET_RATIO,
  GUITAR_TAB_STEM_END_OFFSET_RATIO_WITH_TAIL,
  GUITAR_TAB_STEM_START_OFFSET_RATIO,
} from '../constants';
import {getNoteTailSkinKey} from '../utils/skinKey';
import {GRACE_NOTE_SCALE} from '@/render/graceNote';

/** 符尾相对符干底端的 y 微调（向下符干） */
function getNoteTailYOffset(chronaxie: number, measureHeight: number): number {
  if (chronaxie === 8) return measureHeight / 8;
  if (chronaxie === 4) return measureHeight * 2 / 8;
  if (chronaxie === 2) return measureHeight * 3 / 8;
  if (chronaxie === 1) return measureHeight * 4 / 8;
  return 0;
}

export type RenderGuitarTabStemAndTailParams = {
  note: NoteSymbol;
  allNotesInfo: TabNoteInfo[];
  idMap: NodeIdMap;
  /** slot 列中心 x（符干与箭头对齐） */
  slotCenterX: number;
  measureY: number;
  measureHeight: number;
  skin: GuitarTabSkinPack;
  zIndex: number;
  skinName?: string;
  noteCenterY: (region: number) => number;
  isGrace?: boolean;
};

function renderStemFromHeadAnchor(params: {
  headCenterX: number;
  headCenterY: number;
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
    headCenterX,
    headCenterY,
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
      const noteTailYOffset = getNoteTailYOffset(chronaxie, measureHeight);
      out.push({
        startPoint: {x: 0, y: 0},
        endPoint: {x: 0, y: 0},
        special: {},
        x: stemX,
        y: stemEndY - tailSkin.h + noteTailYOffset,
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
 * 吉他谱 slot 符干符尾：锚 region = 全体 region / regionRange 端点最小；x = slot 中心。
 */
export function renderGuitarTabStemAndTailForSlot(
  params: RenderGuitarTabStemAndTailParams,
): VDom[] {
  const {
    allNotesInfo,
    idMap,
    slotCenterX,
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
  const anchorRegion = getTabNoteStemAnchorRegion(allNotesInfo);
  const headCenterX = slotCenterX;
  let headCenterY = noteCenterY(anchorRegion);
  for (const info of allNotesInfo) {
    const head = idMap.get(info.id)?.tabNoteNumber;
    if (!head || info.type !== TabNoteInfoTypeEnum.Normal) continue;
    if (info.region === anchorRegion) {
      headCenterY = head.y + head.h / 2;
      break;
    }
  }

  return renderStemFromHeadAnchor({
    headCenterX,
    headCenterY,
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
    headCenterX: params.headX + params.headW / 2,
    headCenterY: params.headY + params.headH / 2,
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
