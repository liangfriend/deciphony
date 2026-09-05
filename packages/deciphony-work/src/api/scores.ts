import type {MusicScore} from '@deciphony/renderer'
import type {SPage, SScore} from '../types/types'

export type AddScoreOptions = {
  x: number
  y: number
  /** 完整曲谱 JSON；框宽高取自其 width/height */
  musicScore: MusicScore
  rotation?: number
  id?: string
}

function newId(): string {
  return crypto.randomUUID()
}

function ensureScores(page: SPage): NonNullable<SPage['scores']> {
  if (!page.scores) page.scores = []
  return page.scores
}

/**
 * 添加曲谱：框的 width/height 用 MusicScore.width/height 覆盖写入。
 * musicScore 会 structuredClone，避免外部引用被意外共享。
 */
export function addScore(page: SPage, options: AddScoreOptions): string {
  const id = options.id ?? newId()
  const musicScore = structuredClone(options.musicScore) as MusicScore
  const el: SScore = {
    id,
    x: options.x,
    y: options.y,
    width: musicScore.width,
    height: musicScore.height,
    musicScore,
  }
  if (options.rotation !== undefined) el.rotation = options.rotation
  ensureScores(page).push(el)
  return id
}

export function removeScore(page: SPage, scoreId: string): boolean {
  const list = page.scores
  if (!list?.length) return false
  const i = list.findIndex((s) => s.id === scoreId)
  if (i < 0) return false
  list.splice(i, 1)
  return true
}
