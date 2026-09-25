import type {MusicScore, Skin, SkinPack} from '@deciphony/renderer'
import type {ScoreAudioRef, SPage, SScore} from '../types/types'

/** 已解析好的关联音频（写入 SScore） */
export type ScoreAudioInput = ScoreAudioRef

/**
 * SJWPDF.addScore 入参：范唱/伴奏可传已有引用、assetId，或 File（自动入库）。
 */
export type ScoreAudioHostInput =
  | ScoreAudioRef
  | {assetId: string; name?: string; author?: string}
  | {file: File; name?: string; author?: string}

/**
 * 纯函数 addScore：皮肤只接受已入库的资源 id。
 */
export type ScoreSkinInput = string

/**
 * SJWPDF.addScore 皮肤入参（可选）：
 * - 资源 id 字符串 / `{ assetId }`：缓存须已有
 * - `{ file, name? }`：自动 loadAsset
 * - SkinPack / Skin：序列化为 .json 再 loadAsset（每次新文件）
 * - Skin + skinName：从多套中取出一套再入库
 */
export type ScoreSkinHostInput =
  | string
  | {assetId: string; name?: string}
  | {file: File; name?: string}
  | SkinPack
  | Skin
  | {skin: Skin | SkinPack; skinName?: string; name?: string}

/**
 * 添加曲谱时传入范唱/伴奏：
 * - 纯函数 addScore：只接受 ScoreAudioRef；skin 为资源 id
 * - SJWPDF.addScore：可用 ScoreAudioHostInput / ScoreSkinHostInput
 */
export type AddScoreOptions = {
  x: number
  y: number
  /** 完整曲谱 JSON；框宽高取自其 width/height */
  musicScore: MusicScore
  /** 皮肤资源 id（可选）；zip 根目录 .json */
  skin?: ScoreSkinInput
  rotation?: number
  /** 范唱 */
  vocalPerformance?: ScoreAudioInput
  /** 伴奏 */
  accompaniment?: ScoreAudioInput
  id?: string
}

export type AddScoreHostOptions = Omit<
  AddScoreOptions,
  'vocalPerformance' | 'accompaniment' | 'skin'
> & {
  vocalPerformance?: ScoreAudioHostInput
  accompaniment?: ScoreAudioHostInput
  skin?: ScoreSkinHostInput
}

function newId(): string {
  return crypto.randomUUID()
}

function ensureScores(page: SPage): NonNullable<SPage['scores']> {
  if (!page.scores) page.scores = []
  return page.scores
}

function cloneAudioRef(ref: ScoreAudioRef): ScoreAudioRef {
  const out: ScoreAudioRef = {
    src: ref.src,
    name: ref.name,
  }
  if (ref.author !== undefined) out.author = ref.author
  return out
}

/**
 * 添加曲谱：框的 width/height 用 MusicScore.width/height 覆盖写入。
 * musicScore 会 structuredClone；skin 只存资源 id（与图片相同）。
 * 范唱/伴奏只存 ScoreAudioRef（src 指向资源缓存 / zip 根文件名）。
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
  if (options.skin != null && options.skin !== '') el.skin = options.skin
  if (options.rotation !== undefined) el.rotation = options.rotation
  if (options.vocalPerformance) {
    el.vocalPerformance = cloneAudioRef(options.vocalPerformance)
  }
  if (options.accompaniment) {
    el.accompaniment = cloneAudioRef(options.accompaniment)
  }
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

/** 收集曲谱上范唱/伴奏的资源 id（去重） */
export function collectScoreAudioSrcs(score: SScore): string[] {
  const set = new Set<string>()
  if (score.vocalPerformance?.src) set.add(score.vocalPerformance.src)
  if (score.accompaniment?.src) set.add(score.accompaniment.src)
  return [...set]
}

/** 收集曲谱关联资源 id（范唱 / 伴奏 / 皮肤） */
export function collectScoreAssetSrcs(score: SScore): string[] {
  const set = new Set(collectScoreAudioSrcs(score))
  if (score.skin) set.add(score.skin)
  return [...set]
}

/** 读取曲谱上的范唱/伴奏元数据（无则 undefined） */
export function getScoreAudios(score: SScore): {
  vocalPerformance?: ScoreAudioRef
  accompaniment?: ScoreAudioRef
} {
  return {
    vocalPerformance: score.vocalPerformance
      ? cloneAudioRef(score.vocalPerformance)
      : undefined,
    accompaniment: score.accompaniment
      ? cloneAudioRef(score.accompaniment)
      : undefined,
  }
}
