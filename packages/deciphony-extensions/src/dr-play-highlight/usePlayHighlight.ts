import type {VDom} from '@deciphony/renderer'
import type {Ref} from 'vue'
import {onBeforeUnmount} from 'vue'
import {drPlayHighlight, type DrPlayHighlightExtension} from './drPlayHighlight'

export type MusicScoreHighlightExpose = {
  findElementByVDom: (node: VDom) => SVGElement | null
}

export type UsePlayHighlightOptions = {
  musicScoreRef: Ref<MusicScoreHighlightExpose | null>
  getBpm?: () => number
  getBeatUnit?: () => number
  getRate?: () => number
}

/**
 * @deprecated 优先用 `drPlayHighlight` 放进 `:extensions`，经 `on.renderMusicScore` 同步。
 * 本 composable 仍返回可放入 extensions 的扩展实例。
 */
export function usePlayHighlight(options: UsePlayHighlightOptions): DrPlayHighlightExtension {
  const ext = drPlayHighlight({
    findElementByVDom: (node) => options.musicScoreRef.value?.findElementByVDom(node) ?? null,
    getBpm: options.getBpm,
    getBeatUnit: options.getBeatUnit,
    getRate: options.getRate,
  })

  onBeforeUnmount(() => {
    ext.handlePlaybackStop()
  })

  return ext
}
