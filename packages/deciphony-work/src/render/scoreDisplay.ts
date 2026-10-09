import type {DrExtension, MusicScore, SlotConfig} from '@deciphony/renderer'
import {LYRICS_FONT_SIZE, LYRICS_PAD_BOTTOM, LYRICS_PAD_TOP, LYRICS_ROW_GAP, drLyrics} from '@deciphony/extensions/dr-lyrics'
import {TITLE_SLOT_HEIGHT, drTitle} from '@deciphony/extensions/dr-title'
import {drInstrumentName} from '@deciphony/extensions/dr-instrument-name'
import type {SCropRect, SScore} from '../types/types'
import {visibleSourceRect} from '../api/crop'

/** 音色名与谱表的间距：须大于连谱号宽度（bracket 约 12px，画在 s-l 最右侧），与宿主编辑器一致 */
export const INSTRUMENT_NAME_GAP = 18

/** 与 dr-lyrics 扩展默认 g-d 高度一致（约 4 行） */
const DEFAULT_GD_SLOT_H = LYRICS_PAD_TOP + 4 * LYRICS_ROW_GAP + LYRICS_PAD_BOTTOM

/** 宿主编辑器写在 musicScore.data 上的展示参数 */
type ScoreLayoutData = {
  /** s-l 插槽宽度（左留白） */
  sLSlotW?: unknown
  /** s-r 插槽宽度（右留白） */
  sRSlotW?: unknown
  /** t 插槽高度（标题区） */
  tSlotH?: unknown
  /** g-d 插槽高度（歌词区） */
  gdSlotH?: unknown
  /** 歌词字号（px） */
  lyricsFontSize?: unknown
  /** 歌词字体（CSS font-family） */
  lyricsFontFamily?: unknown
  /** 标题字体（CSS font-family） */
  titleFontFamily?: unknown
  /** 是否在 s-l 显示单谱表音色名（singleStaff.data.instrumentName） */
  showInstrumentName?: unknown
}

function layoutData(musicScore: MusicScore): ScoreLayoutData {
  return (musicScore.data ?? {}) as ScoreLayoutData
}

export function scoreLyricsFontSize(musicScore: MusicScore): number {
  const size = Number(layoutData(musicScore).lyricsFontSize)
  return Number.isFinite(size) && size > 0 ? size : LYRICS_FONT_SIZE
}

export function scoreLyricsFontFamily(musicScore: MusicScore): string | undefined {
  const raw = layoutData(musicScore).lyricsFontFamily
  if (typeof raw !== 'string') return undefined
  const trimmed = raw.trim()
  return trimmed || undefined
}

export function scoreTitleFontFamily(musicScore: MusicScore): string | undefined {
  const raw = layoutData(musicScore).titleFontFamily
  if (typeof raw !== 'string') return undefined
  const trimmed = raw.trim()
  return trimmed || undefined
}

export function scoreShowsInstrumentName(musicScore: MusicScore): boolean {
  return layoutData(musicScore).showInstrumentName === true
}

function slotWidth(raw: unknown): {w: number} | undefined {
  const w = Number(raw)
  return Number.isFinite(w) && w >= 0 ? {w} : undefined
}

function slotHeight(raw: unknown, fallback: number): number {
  const h = Number(raw)
  return Number.isFinite(h) && h >= 0 ? h : fallback
}

export function scoreTitleSlotHeight(musicScore: MusicScore): number {
  return slotHeight(layoutData(musicScore).tSlotH, TITLE_SLOT_HEIGHT)
}

export function scoreLyricsSlotHeight(musicScore: MusicScore): number {
  return slotHeight(layoutData(musicScore).gdSlotH, DEFAULT_GD_SLOT_H)
}

export function scoreSlotConfig(musicScore: MusicScore): SlotConfig {
  const data = layoutData(musicScore)
  const left = slotWidth(data.sLSlotW)
  const right = slotWidth(data.sRSlotW)
  return {
    ...(left ? {'s-l': left} : {}),
    ...(right ? {'s-r': right} : {}),
    // 覆盖扩展默认，与编辑器 data.tSlotH / gdSlotH 一致（裁剪按复谱表也用这份）
    t: {h: scoreTitleSlotHeight(musicScore)},
    'g-d': {h: scoreLyricsSlotHeight(musicScore)},
  } as SlotConfig
}

/** 只读展示用的扩展（标题 / 歌词 / 乐器名）；播放高亮、选段等交互扩展由调用方追加 */
export function scoreDisplayExtensions(musicScore: MusicScore): DrExtension[] {
  const list = [
    drTitle({
      mode: 'show',
      height: scoreTitleSlotHeight(musicScore),
      fontFamily: scoreTitleFontFamily(musicScore),
    }),
    drLyrics({
      mode: 'show',
      fontSize: scoreLyricsFontSize(musicScore),
      fontFamily: scoreLyricsFontFamily(musicScore),
    }),
  ]
  if (scoreShowsInstrumentName(musicScore)) list.push(drInstrumentName({gap: INSTRUMENT_NAME_GAP}))
  return list
}

/** 曲谱在框内显示的源区域（crop 或整份曲谱） */
export function scoreViewRect(score: SScore): SCropRect {
  return visibleSourceRect(score.crop, {
    width: score.musicScore.width || 1,
    height: score.musicScore.height || 1,
  })
}
