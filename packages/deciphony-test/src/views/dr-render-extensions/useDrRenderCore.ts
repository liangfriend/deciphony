/**
 * deciphony-renderer 扩展核心
 * 提供共享状态，及各扩展注册 pointer / render 事件的处理函数
 */

import {nextTick, ref, type Ref} from 'vue'
import type {MusicScore} from 'deciphony-renderer'

export type MusicScoreRef = MusicScore

export type MsRefValue = {
    updateVDom: (updater: (vDom: { skinName?: string; targetId?: string }[]) => void) => void
    $el?: SVGSVGElement
}

export type PointerContext = {
    targetId: string
    tag: string
    /** 将事件坐标转为 SVG 坐标 */
    getSvgPoint: (e: PointerEvent) => { x: number; y: number } | null
}

export type PointerHandler = (e: PointerEvent, ctx: PointerContext) => void
export type RenderMusicScoreHandler = (vdom: unknown) => void

export type DrRenderCoreOptions = {
    initialData: MusicScoreRef
}

export function useDrRenderCore(options: DrRenderCoreOptions) {
    const {initialData} = options

    const msRef = ref<MsRefValue | null>(null)
    const musicScoreData = ref<MusicScoreRef>(initialData)
    const highlightTargetId = ref('')
    const highlightTag = ref('')

    const pointerDownHandlers: PointerHandler[] = []
    const pointerMoveHandlers: PointerHandler[] = []
    const pointerUpHandlers: PointerHandler[] = []
    const renderMusicScoreHandlers: RenderMusicScoreHandler[] = []

    function getSvgPoint(e: PointerEvent): { x: number; y: number } | null {
        const svg = msRef.value?.$el
        if (!svg?.createSVGPoint) return null
        const pt = svg.createSVGPoint()
        pt.x = e.clientX
        pt.y = e.clientY
        const m = svg.getScreenCTM()?.inverse()
        if (!m) return null
        return pt.matrixTransform(m)
    }

    function buildPointerContext(e: PointerEvent): PointerContext {
        const el = (e.target as Element).closest?.('[data-target-id][data-tag]') ?? e.target
        const targetId = (el as Element).getAttribute?.('data-target-id') ?? ''
        const tag = (el as Element).getAttribute?.('data-tag') ?? ''
        return {targetId, tag, getSvgPoint}
    }

    function handlePointerDown(e: PointerEvent) {
        console.log('chicken',)
        const ctx = buildPointerContext(e)
        highlightTargetId.value = ctx.targetId
        highlightTag.value = ctx.tag
        pointerDownHandlers.forEach((h) => h(e, ctx))
    }

    function handlePointerMove(e: PointerEvent) {
        const ctx = buildPointerContext(e)
        pointerMoveHandlers.forEach((h) => h(e, ctx))
    }

    function handlePointerUp(e: PointerEvent) {
        const ctx = buildPointerContext(e)
        pointerUpHandlers.forEach((h) => h(e, ctx))
    }

    function renderMusicScore(vdom: unknown) {
        renderMusicScoreHandlers.forEach((h) => h(vdom))
    }

    function applyHighlight() {
        const tid = highlightTargetId.value
        if (!tid) return
        msRef.value?.updateVDom((vdom) => {
            vdom.forEach((item) => {
                item.skinName = item.targetId === tid ? 'red' : 'default'
            })
        })
    }

    return {
        msRef,
        musicScoreData,
        highlightTargetId,
        highlightTag,

        handlePointerDown,
        handlePointerMove,
        handlePointerUp,
        renderMusicScore,

        registerPointerDown(fn: PointerHandler) {
            pointerDownHandlers.push(fn)
        },
        registerPointerMove(fn: PointerHandler) {
            pointerMoveHandlers.push(fn)
        },
        registerPointerUp(fn: PointerHandler) {
            pointerUpHandlers.push(fn)
        },
        registerRenderMusicScore(fn: RenderMusicScoreHandler) {
            renderMusicScoreHandlers.push(fn)
        },

        applyHighlight,
        getSvgPoint,
        nextTick,
    }
}

export type DrRenderCore = ReturnType<typeof useDrRenderCore>
