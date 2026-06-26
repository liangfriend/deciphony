import {TabNoteInfoTypeEnum} from '@/enums/musicScoreEnum';
import type {TabNoteInfo} from '@/types/MusicScoreType';

export const DEFAULT_TAB_ARROW_THICKNESS = 1;
export const DEFAULT_TAB_ARROW_WIDTH = 8;

export function isTabNoteGeometryInfo(
  info: TabNoteInfo,
): info is TabNoteInfo & {type: TabNoteInfoTypeEnum.Arpeggio | TabNoteInfoTypeEnum.Strumming} {
  return info.type === TabNoteInfoTypeEnum.Arpeggio
    || info.type === TabNoteInfoTypeEnum.Strumming;
}

/** 收集单条 info 参与符干锚点比较的所有 region（含 regionRange 两端） */
export function collectTabNoteInfoRegions(info: TabNoteInfo): number[] {
  if (info.type === TabNoteInfoTypeEnum.Normal) return [info.region];
  return [info.regionRange.start, info.regionRange.end];
}

/** 符干锚线：slot 内所有 info 的 region / regionRange 端点取最小 */
export function getTabNoteStemAnchorRegion(infos: TabNoteInfo[]): number {
  if (!infos.length) return 0;
  return Math.min(...infos.flatMap(collectTabNoteInfoRegions));
}

/** Normal 为 region；琶音 / 扫弦取 regionRange 较小端（单点回退用） */
export function getTabNoteInfoRegion(info: TabNoteInfo): number {
  if (info.type === TabNoteInfoTypeEnum.Normal) return info.region;
  return Math.min(info.regionRange.start, info.regionRange.end);
}

export function resolveTabArrowThickness(info: TabNoteInfo): number {
  if (!isTabNoteGeometryInfo(info)) return DEFAULT_TAB_ARROW_THICKNESS;
  return info.thickness ?? DEFAULT_TAB_ARROW_THICKNESS;
}

export function resolveTabArrowWidth(info: TabNoteInfo): number {
  if (!isTabNoteGeometryInfo(info)) return DEFAULT_TAB_ARROW_WIDTH;
  return info.arrowWidth ?? DEFAULT_TAB_ARROW_WIDTH;
}
