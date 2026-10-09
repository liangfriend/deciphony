import type {DrExtension, VDom, VDomLookup} from '@deciphony/renderer'
import {findElementByVdomDomId} from '@deciphony/renderer'
import {createPlayHighlight} from './playHighlight'
import {
  createPlayHighlightScheduler,
  type PlayHighlightProgressData,
} from './playHighlightScheduler'

export type DrPlayHighlightOptions = {
  getBpm?: () => number
  getBeatUnit?: () => number
  getRate?: () => number
  /**
   * 定位音符 DOM（推荐：musicScoreRef.findElementByVDom）。
   * 与 getSvgRoot 二选一；都未提供则高亮无法落到 DOM。
   */
  findElementByVDom?: (node: VDom) => SVGElement | null
  /** 提供 svg 根时，内部用 findElementByVdomDomId */
  getSvgRoot?: () => ParentNode | null
}

export type DrPlayHighlightExtension = DrExtension & {
  handleProgressStart: (data: PlayHighlightProgressData) => void
  handlePlaybackEnd: () => void
  handlePlaybackStop: () => void
  handlePlaybackPause: () => void
  setBpm: (bpm: number) => void
  clearHighlight: () => void
  addNoteHighlight: (noteId: string) => void
  removeNoteHighlight: (noteId: string) => void
}

/**
 * 播放高亮扩展：经 musicScore `:extensions` 接入，
 * 在 `on.renderMusicScore` 里同步 vDom（勿再写组件上的 @renderMusicScore）。
 *
 * @example
 * ```ts
 * const playHl = drPlayHighlight({
 *   findElementByVDom: (n) => musicScoreRef.value?.findElementByVDom(n) ?? null,
 *   getBpm: () => 120,
 * })
 * const extensions = [drTitle(), drLyrics(), playHl]
 * // nplayer.onProgressStart = (_, d) => playHl.handleProgressStart(d)
 * ```
 */
export function drPlayHighlight(options: DrPlayHighlightOptions = {}): DrPlayHighlightExtension {
  let vDomList: VDom[] = []
  let lookup: VDomLookup | null = null

  function resolveElement(node: VDom): SVGElement | null {
    if (options.findElementByVDom) return options.findElementByVDom(node)
    const root = options.getSvgRoot?.()
    return root ? findElementByVdomDomId(root, node) : null
  }

  const playHighlight = createPlayHighlight({
    getVDomList: () => vDomList,
    getVDomLookup: () => lookup,
    findElementByVDom: resolveElement,
  })

  const scheduler = createPlayHighlightScheduler({
    addNoteHighlight: playHighlight.addNoteHighlight,
    removeNoteHighlight: playHighlight.removeNoteHighlight,
    clearHighlight: playHighlight.clearHighlight,
    getBpm: options.getBpm ?? (() => 120),
    getBeatUnit: options.getBeatUnit,
    getRate: options.getRate,
  })

  return {
    name: 'dr-play-highlight',
    on: {
      renderMusicScore(list, info) {
        vDomList = list
        lookup = info?.lookup ?? null
        playHighlight.rebindAfterRender()
      },
    },
    handleProgressStart: scheduler.handleProgressStart,
    handlePlaybackEnd: scheduler.handlePlaybackEnd,
    handlePlaybackStop: scheduler.handlePlaybackStop,
    handlePlaybackPause: scheduler.handlePlaybackPause,
    setBpm: scheduler.setBpm,
    clearHighlight: playHighlight.clearHighlight,
    addNoteHighlight: (noteId: string) => playHighlight.addNoteHighlight(noteId),
    removeNoteHighlight: (noteId: string) => playHighlight.removeNoteHighlight(noteId),
  }
}
