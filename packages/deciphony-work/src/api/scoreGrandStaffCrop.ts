import type {MusicScore, Skin, VDom} from '@deciphony/renderer'
import {resolveMusicScoreToVDom} from '@deciphony/renderer'
import type {CropOptions, SCropRect, SPage, SScore} from '../types/types'
import {scoreSlotConfig} from '../render/scoreDisplay'
import {cropScore} from './crop'

/** 纵向条带：0 = 标题区（曲谱顶到第一复谱表之前），1..n = 第几个复谱表 */
export type ScoreVerticalBand = {
  /** 0 = 标题，1..n = 复谱表序号 */
  index: number
  y: number
  height: number
}

export type CropScoreByGrandStaffOptions = CropOptions & {
  /** 排版皮肤；不传则用 renderer 默认（与未设 score.skin 时展示一致） */
  skin?: Skin
  /**
   * true：裁剪后放置框 x/y 不变（只改宽高）。
   * 默认 false：裁出区域留在页面原位，起点下移时 score.y 会变大。
   */
  keepY?: boolean
}

function findGrandStaffSlot(vdoms: VDom[], grandStaffId: string): VDom | undefined {
  const targetId = `g-${grandStaffId}`
  return vdoms.find((n) => n.tag === 'slot' && n.slotName === 'g' && n.targetId === targetId)
}

/**
 * 按与 SJWPDF Score 相同的 slotConfig 排版，得到标题区 + 各复谱表的纵向区间（musicScore 坐标）。
 * index：0 = 标题（含 topSpace / t），1..n = 第几个复谱表。
 */
export function scoreVerticalBands(
  musicScore: MusicScore,
  options: {skin?: Skin} = {},
): ScoreVerticalBand[] {
  const slotConfig = scoreSlotConfig(musicScore)
  const toVDom = resolveMusicScoreToVDom()
  const vdoms = toVDom(musicScore, slotConfig, options.skin ? {skin: options.skin} : undefined)
  const grandStaffs = musicScore.grandStaffs ?? []
  const bands: ScoreVerticalBand[] = []

  const gsRects = grandStaffs.map((gs) => {
    const slot = findGrandStaffSlot(vdoms, gs.id)
    if (!slot || !(slot.h > 0)) {
      throw new Error(`无法定位复谱表布局: ${gs.id}`)
    }
    return {y: slot.y, height: slot.h}
  })

  const firstGsY = gsRects[0]?.y ?? musicScore.height
  const titleH = Math.max(0, firstGsY)
  bands.push({index: 0, y: 0, height: titleH})

  for (let i = 0; i < gsRects.length; i++) {
    const rect = gsRects[i]!
    bands.push({index: i + 1, y: rect.y, height: rect.height})
  }
  return bands
}

function clampBandIndex(index: number, max: number): number {
  if (!Number.isInteger(index)) throw new Error(`复谱表裁剪下标必须是整数: ${index}`)
  if (index < 0 || index > max) {
    throw new Error(`复谱表裁剪下标越界: ${index}（合法范围 0..${max}，0=标题）`)
  }
  return index
}

/**
 * 标题 / 复谱表区间 → 源坐标裁剪矩形（全宽）。
 * @param from 起点：0=标题，1..n=第几个复谱表
 * @param to 终点：同上（先后不限）
 */
export function grandStaffRangeToCropArea(
  musicScore: MusicScore,
  from: number,
  to: number,
  options: {skin?: Skin} = {},
): {startX: number; startY: number; endX: number; endY: number} {
  const n = musicScore.grandStaffs?.length ?? 0
  const a = clampBandIndex(from, n)
  const b = clampBandIndex(to, n)
  const lo = Math.min(a, b)
  const hi = Math.max(a, b)
  const bands = scoreVerticalBands(musicScore, options)
  const start = bands[lo]
  const end = bands[hi]
  if (!start || !end) throw new Error('复谱表裁剪区间无效')
  const startY = start.y
  const endY = end.y + end.height
  if (endY - startY < 1) throw new Error('复谱表裁剪区域高度为空（例如无标题且未选复谱表）')
  return {
    startX: 0,
    startY,
    endX: musicScore.width || 1,
    endY,
  }
}

/** 按标题 / 复谱表区间裁剪曲谱；语义同 cropScore */
export function cropScoreByGrandStaff(
  page: SPage,
  scoreId: string,
  from: number,
  to: number,
  options: CropScoreByGrandStaffOptions = {},
): SCropRect {
  const score = page.scores?.find((s) => s.id === scoreId)
  if (!score) throw new Error(`当前页不存在曲谱: ${scoreId}`)
  const {skin, ...cropOptions} = options
  const area = grandStaffRangeToCropArea(score.musicScore, from, to, {skin})
  return cropScore(page, scoreId, area, cropOptions)
}

/** 查询曲谱各条带（调试 / 属性栏预览） */
export function getScoreVerticalBands(score: SScore, options: {skin?: Skin} = {}): ScoreVerticalBand[] {
  return scoreVerticalBands(score.musicScore, options)
}
