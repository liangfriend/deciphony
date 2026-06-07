import type {VDom} from 'deciphony-renderer'
import type {Ref} from 'vue'
import {onBeforeUnmount, ref} from 'vue'
import {createPlayHighlight} from './playHighlight'
import {createPlayHighlightScheduler, type PlayHighlightProgressData} from './playHighlightScheduler'

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
 * 播放高亮 composable：配合 musicScore 的 renderMusicScore 与 NPlayer onProgressStart。
 */
export function usePlayHighlight(options: UsePlayHighlightOptions) {
    const vDomList = ref<VDom[]>([])

    const playHighlight = createPlayHighlight({
        getVDomList: () => vDomList.value,
        findElementByVDom: (node) => options.musicScoreRef.value?.findElementByVDom(node) ?? null,
    })

    const scheduler = createPlayHighlightScheduler({
        addNoteHighlight: playHighlight.addNoteHighlight,
        removeNoteHighlight: playHighlight.removeNoteHighlight,
        clearHighlight: playHighlight.clearHighlight,
        getBpm: options.getBpm ?? (() => 120),
        getBeatUnit: options.getBeatUnit,
        getRate: options.getRate,
    })

    function handleRenderMusicScore(list: VDom[]) {
        vDomList.value = list
        playHighlight.rebindAfterRender()
    }

    onBeforeUnmount(() => {
        scheduler.handlePlaybackStop()
    })

    return {
        vDomList,
        handleRenderMusicScore,
        handleProgressStart: scheduler.handleProgressStart,
        handlePlaybackEnd: scheduler.handlePlaybackEnd,
        handlePlaybackStop: scheduler.handlePlaybackStop,
        handlePlaybackPause: scheduler.handlePlaybackPause,
        ...playHighlight,
    }
}

export type {PlayHighlightProgressData}
