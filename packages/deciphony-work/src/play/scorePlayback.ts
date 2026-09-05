import type {MusicScore} from '@deciphony/renderer'
import type {PlaySequence, ToneColor} from '@deciphony/player'
import {NPlayer, activeContext, startJPlayer} from '@deciphony/player'
import {getDrPlaySequence} from '@deciphony/extensions/dr-play'
import type {PlayHighlightProgressData} from '@deciphony/extensions/dr-play-highlight'
import type {SScore} from '../types/types'

/** 单份曲谱在 Page 上注册的播放/高亮句柄 */
export type ScorePlayHost = {
  scoreId: string
  handleProgressStart: (data: PlayHighlightProgressData) => void
  handlePlaybackEnd: () => void
  handlePlaybackStop: () => void
  handlePlaybackPause: () => void
}

export type ScorePlaybackOptions = {
  /** 取当前页曲谱列表 */
  getScores: () => SScore[]
  /** 按 score.id 取已挂载的高亮宿主 */
  getHost: (scoreId: string) => ScorePlayHost | undefined
}

/**
 * 页面级曲谱播放：NPlayer + dr-play 序列 + 对应 Score 的高亮回调。
 */
export function createScorePlayback(options: ScorePlaybackOptions) {
  startJPlayer()
  const nplayer = new NPlayer({checkTime: 50, checkDuration: 500})

  let toneColorName = 'piano'
  let activeScoreId: string | null = null
  let disposed = false

  function requireActiveHost(): ScorePlayHost | undefined {
    if (!activeScoreId) return undefined
    return options.getHost(activeScoreId)
  }

  function buildPlaySequence(musicScore: MusicScore): PlaySequence {
    const drSeq = getDrPlaySequence(musicScore)
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
        toneColor: toneColorName,
        data: {
          note_id: it.note_id,
          duration: it.duration,
          realDuration: it.real_duration,
          playTime: it.playTime,
          start,
        },
        end: false,
      }
    })
    playSeq[playSeq.length - 1]!.end = true
    return playSeq
  }

  function bindPlayerCallbacks() {
    nplayer.onProgressStart = (_progress, data) => {
      requireActiveHost()?.handleProgressStart(data as PlayHighlightProgressData)
    }
    nplayer.onEnd = () => {
      requireActiveHost()?.handlePlaybackEnd()
    }
  }

  bindPlayerCallbacks()

  function resolveScore(scoreIndex = 0): SScore | null {
    const list = options.getScores()
    return list[scoreIndex] ?? null
  }

  /**
   * 播放指定曲谱（默认 scores[0]）。
   * 会重建播放序列并绑定该曲谱的高亮。
   */
  async function play(scoreIndex = 0): Promise<void> {
    if (disposed) return
    const score = resolveScore(scoreIndex)
    if (!score) throw new Error(`scores[${scoreIndex}] 不存在`)

    activeScoreId = score.id
    const bpm = score.musicScore.bpm ?? 120
    nplayer.bpm = bpm

    const seq = buildPlaySequence(score.musicScore)
    if (!seq.length) throw new Error('曲谱无可播放音符')
    nplayer.setPlaySequence(seq)

    await activeContext()
    await nplayer.play()
  }

  function pause(): void {
    if (disposed) return
    nplayer.pause()
    requireActiveHost()?.handlePlaybackPause()
  }

  function stop(): void {
    if (disposed) return
    nplayer.stop()
    requireActiveHost()?.handlePlaybackStop()
  }

  /** 加载/覆盖音色（name 供序列 toneColor 引用，如 'piano'） */
  async function addToneColor(name: string, toneColor: ToneColor): Promise<void> {
    if (disposed) return
    await nplayer.addToneColor(name, toneColor)
  }

  /** 设置后续重建序列时使用的音色名（需已 addToneColor） */
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

  function dispose(): void {
    if (disposed) return
    disposed = true
    try {
      nplayer.stop()
    } catch {
      /* noop */
    }
    nplayer.dispose()
    activeScoreId = null
  }

  return {
    play,
    pause,
    stop,
    addToneColor,
    setToneColorName,
    getToneColorName,
    setBpm,
    getBpm,
    getPlayer,
    dispose,
  }
}

export type ScorePlayback = ReturnType<typeof createScorePlayback>
