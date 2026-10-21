import type {MusicScore} from '@deciphony/renderer'
import type {PlaySequence, ToneColor} from '@deciphony/player'
import {APlayer, NPlayer, activeContext, startJPlayer} from '@deciphony/player'
import {getDrPlaySequence, type DrPlayRange} from '@deciphony/extensions/dr-play'
import type {PlayHighlightProgressData} from '@deciphony/extensions/dr-play-highlight'
import {
  buildFlattenStaffRows,
  collectHighlightIdsAtTime,
  createNotePassMap,
  resetNotePassMap,
  type NotePassMap,
} from '@deciphony/extensions/dr-time-offset'
import type {SScore} from '../types/types'

/** 槽位 data 上伴奏时间字段（与未命名作品.sjw 一致） */
export const ACCOMPANIMENT_TIME_PROP = 'accompaniment'
/** 槽位 data 上范唱时间字段 */
export const VOCAL_TIME_PROP = 'vocalPerformance'

/** SJWPDF 曲谱 MIDI 播放默认包络：A/D 在音符 duration 内，R 在 duration 之后 */
export const PLAY_SMOOTH_ENVELOPE = {
  attack: 0.05,
  decay: 0.1,
  peakVolume: 1.2,
  release: 0.2,
} as const

export type PlaybackMode = 'score' | 'accompaniment' | 'vocal' | null

export type ScorePlayOptions = {
  /** 选段：起止音符 id（任一缺省 = 从头 / 到尾）；裁剪规则见 dr-play cropDrPlaySequence */
  range?: DrPlayRange | null
}

function rangeKey(range: DrPlayRange | null | undefined): string {
  return `${range?.startNoteId?.trim() ?? ''}|${range?.endNoteId?.trim() ?? ''}`
}

/** 单份曲谱在 Page 上注册的播放/高亮句柄 */
export type ScorePlayHost = {
  scoreId: string
  handleProgressStart: (data: PlayHighlightProgressData) => void
  handlePlaybackEnd: () => void
  handlePlaybackStop: () => void
  handlePlaybackPause: () => void
  addNoteHighlight: (noteId: string) => void
  removeNoteHighlight: (noteId: string) => void
  clearHighlight: () => void
}

export type ScorePlaybackOptions = {
  /** 取当前页曲谱列表 */
  getScores: () => SScore[]
  /** 按 score.id 取已挂载的高亮宿主 */
  getHost: (scoreId: string) => ScorePlayHost | undefined
  /** 资源 id → 可播放 url（范唱/伴奏） */
  resolveSrc: (src: string) => string
  /** 伴奏高亮时间属性，默认 accompaniment */
  accompanimentTimeProp?: string
  /** 范唱高亮时间属性，默认 vocalPerformance */
  vocalTimeProp?: string
}

/**
 * 页面级播放：MIDI 曲谱（NPlayer）与范唱/伴奏（APlayer）互斥。
 */
export function createScorePlayback(options: ScorePlaybackOptions) {
  startJPlayer()
  const nplayer = new NPlayer({checkTime: 50, checkDuration: 500})
  const aplayer = new APlayer()

  let toneColorName = 'piano'
  let activeScoreId: string | null = null
  /** 当前 MIDI 播放的选段，续播时须一致 */
  let activeRangeKey = rangeKey(null)
  let mode: PlaybackMode = null
  /** 当前模式已 pause，再次同模式 play 应续播而非重头 */
  let isPaused = false
  let disposed = false
  let lastHighlightIds: string[] = []
  let notePassMap: NotePassMap = createNotePassMap()

  const accompanimentTimeProp =
    options.accompanimentTimeProp?.trim() || ACCOMPANIMENT_TIME_PROP
  const vocalTimeProp = options.vocalTimeProp?.trim() || VOCAL_TIME_PROP

  function requireActiveHost(): ScorePlayHost | undefined {
    if (!activeScoreId) return undefined
    return options.getHost(activeScoreId)
  }

  function applyHighlightIds(ids: string[]) {
    const host = requireActiveHost()
    if (!host) {
      lastHighlightIds = ids
      return
    }
    const prev = new Set(lastHighlightIds)
    const next = new Set(ids)
    for (const id of prev) {
      if (!next.has(id)) host.removeNoteHighlight(id)
    }
    for (const id of next) {
      if (!prev.has(id)) host.addNoteHighlight(id)
    }
    lastHighlightIds = ids
  }

  function clearAudioHighlights() {
    const host = requireActiveHost()
    if (host) {
      for (const id of lastHighlightIds) host.removeNoteHighlight(id)
      host.clearHighlight()
    }
    lastHighlightIds = []
    resetNotePassMap(notePassMap)
  }

  function buildPlaySequence(musicScore: MusicScore, range?: DrPlayRange | null): PlaySequence {
    const drSeq = getDrPlaySequence(musicScore, {
      defaultToneColor: toneColorName,
      ...(range ? {range} : {}),
    })
    if (!drSeq.length) return []

    let curPlayTime = -Infinity
    const playSeq: PlaySequence = drSeq.map((it) => {
      let start = false
      if (curPlayTime !== it.playTime) {
        start = true
        curPlayTime = it.playTime
      }
      return {
        id: it.note_id,
        midi: it.real_duration === 0 ? 0 : it.midi,
        duration: it.real_duration ? it.real_duration : it.duration,
        playTime: it.playTime,
        velocity: it.volume ?? 1,
        toneColor: it.toneColor ?? toneColorName,
        data: {
          note_id: it.note_id,
          duration: it.duration,
          realDuration: it.real_duration,
          playTime: it.playTime,
          start,
          ...(it.lyric ? {lyric: it.lyric} : {}),
        },
        end: false,
      }
    })
    playSeq[playSeq.length - 1]!.end = true
    return playSeq
  }

  function bindNPlayerCallbacks() {
    nplayer.onProgressStart = (_progress, data) => {
      if (mode !== 'score') return
      requireActiveHost()?.handleProgressStart(data as PlayHighlightProgressData)
    }
    nplayer.onEnd = () => {
      if (mode !== 'score') return
      requireActiveHost()?.handlePlaybackEnd()
      mode = null
      isPaused = false
    }
  }

  function bindAPlayerCallbacks() {
    aplayer.onEnd = () => {
      if (mode !== 'accompaniment' && mode !== 'vocal') return
      clearAudioHighlights()
      requireActiveHost()?.handlePlaybackEnd()
      mode = null
      isPaused = false
    }
  }

  bindNPlayerCallbacks()
  bindAPlayerCallbacks()

  function resolveScore(scoreIndex = 0): SScore | null {
    const list = options.getScores()
    return list[scoreIndex] ?? null
  }

  /** 停掉当前任一播放源（互斥切换前调用） */
  function stopCurrentSource(): void {
    try {
      nplayer.stop()
    } catch {
      /* noop */
    }
    try {
      aplayer.stop()
    } catch {
      /* noop */
    }
    clearAudioHighlights()
    requireActiveHost()?.handlePlaybackStop()
    mode = null
    isPaused = false
  }

  function canResume(score: SScore, nextMode: Exclude<PlaybackMode, null>): boolean {
    return isPaused && mode === nextMode && activeScoreId === score.id
  }

  /**
   * 播放指定曲谱 MIDI（默认 scores[0]）。
   * 暂停后再点同曲谱、同选段播放会续播；与范唱/伴奏互斥时会先停止其它播放。
   * options.range：选段播放（起点平移到 0，高亮只看 playTime 差值不受影响）。
   */
  async function play(scoreIndex = 0, playOptions: ScorePlayOptions = {}): Promise<void> {
    if (disposed) return
    const score = resolveScore(scoreIndex)
    if (!score) throw new Error(`scores[${scoreIndex}] 不存在`)
    const key = rangeKey(playOptions.range)

    if (canResume(score, 'score') && activeRangeKey === key) {
      await activeContext()
      await nplayer.play(PLAY_SMOOTH_ENVELOPE)
      isPaused = false
      return
    }

    stopCurrentSource()
    activeScoreId = score.id
    activeRangeKey = key
    mode = 'score'
    isPaused = false

    const bpm = score.musicScore.bpm ?? 120
    nplayer.bpm = bpm

    const seq = buildPlaySequence(score.musicScore, playOptions.range)
    if (!seq.length) {
      mode = null
      throw new Error(playOptions.range ? '选段内无可播放音符' : '曲谱无可播放音符')
    }
    nplayer.setPlaySequence(seq)

    await activeContext()
    await nplayer.play(PLAY_SMOOTH_ENVELOPE)
  }

  async function playSyncedAudio(
    scoreIndex: number,
    kind: 'accompaniment' | 'vocal',
  ): Promise<void> {
    if (disposed) return
    const score = resolveScore(scoreIndex)
    if (!score) throw new Error(`scores[${scoreIndex}] 不存在`)

    const ref =
      kind === 'accompaniment' ? score.accompaniment : score.vocalPerformance
    if (!ref?.src) {
      throw new Error(
        kind === 'accompaniment'
          ? `scores[${scoreIndex}] 无伴奏音频`
          : `scores[${scoreIndex}] 无范唱音频`,
      )
    }

    if (canResume(score, kind)) {
      await activeContext()
      await aplayer.play()
      isPaused = false
      return
    }

    const url = options.resolveSrc(ref.src)
    if (!url) throw new Error(`无法解析音频资源: ${ref.src}`)

    const timeProp =
      kind === 'accompaniment' ? accompanimentTimeProp : vocalTimeProp

    stopCurrentSource()
    activeScoreId = score.id
    mode = kind
    isPaused = false
    notePassMap = createNotePassMap()
    lastHighlightIds = []

    const rows = buildFlattenStaffRows(score.musicScore, timeProp)
    aplayer.onProgress = (current) => {
      if (mode !== kind) return
      applyHighlightIds(collectHighlightIdsAtTime(rows, current, notePassMap))
    }

    await activeContext()
    await aplayer.setAudio(url)
    await aplayer.play()
  }

  /** 播放伴奏 + 按 slot.data[accompaniment] 高亮 */
  async function playAccompaniment(scoreIndex = 0): Promise<void> {
    await playSyncedAudio(scoreIndex, 'accompaniment')
  }

  /** 播放范唱 + 按 slot.data[vocalPerformance] 高亮 */
  async function playVocal(scoreIndex = 0): Promise<void> {
    await playSyncedAudio(scoreIndex, 'vocal')
  }

  function pause(): void {
    if (disposed) return
    if (mode === 'score') {
      nplayer.pause()
      isPaused = true
      requireActiveHost()?.handlePlaybackPause()
      return
    }
    if (mode === 'accompaniment' || mode === 'vocal') {
      aplayer.pause()
      isPaused = true
      requireActiveHost()?.handlePlaybackPause()
    }
  }

  function stop(): void {
    if (disposed) return
    stopCurrentSource()
  }

  /** 加载/覆盖音色（name 供序列 toneColor 引用，如 'piano'） */
  async function addToneColor(name: string, toneColor: ToneColor): Promise<void> {
    if (disposed) return
    await nplayer.addToneColor(name, toneColor)
  }

  /** 设置默认音色名（需已 addToneColor）；单谱表 data.instrumentValue 有值时优先用谱表的 */
  function setToneColorName(name: string): void {
    toneColorName = name.trim() || 'piano'
  }

  function getToneColorName(): string {
    return toneColorName
  }

  function setBpm(bpm: number): void {
    nplayer.bpm = bpm
  }

  function getBpm(): number {
    return nplayer.bpm
  }

  function getPlayer(): NPlayer {
    return nplayer
  }

  function getAPlayer(): APlayer {
    return aplayer
  }

  function getMode(): PlaybackMode {
    return mode
  }

  function dispose(): void {
    if (disposed) return
    disposed = true
    stopCurrentSource()
    nplayer.dispose()
    aplayer.dispose()
    activeScoreId = null
    mode = null
  }

  return {
    play,
    playAccompaniment,
    playVocal,
    pause,
    stop,
    addToneColor,
    setToneColorName,
    getToneColorName,
    setBpm,
    getBpm,
    getPlayer,
    getAPlayer,
    getMode,
    dispose,
  }
}

export type ScorePlayback = ReturnType<typeof createScorePlayback>
