import type {VDom} from 'deciphony-renderer'
import type {Ref} from 'vue'
import {onBeforeUnmount, ref} from 'vue'
import {createPlayHighlight} from './playHighlight'

export type MusicScoreHighlightExpose = {
    findElementByVDom: (node: VDom) => SVGElement | null
}

/**
 * 播放高亮 composable：配合 musicScore 的 renderMusicScore 与 NPlayer onProgressStart / onProgressEnd。
 */
export function usePlayHighlight(options: {musicScoreRef: Ref<MusicScoreHighlightExpose | null>}) {
    const vDomList = ref<VDom[]>([])

    const playHighlight = createPlayHighlight({
        getVDomList: () => vDomList.value,
        findElementByVDom: (node) => options.musicScoreRef.value?.findElementByVDom(node) ?? null,
    })

    function handleRenderMusicScore(list: VDom[]) {
        vDomList.value = list
        playHighlight.rebindAfterRender()
    }

    onBeforeUnmount(() => playHighlight.clearHighlight())

    return {
        vDomList,
        handleRenderMusicScore,
        ...playHighlight,
    }
}
