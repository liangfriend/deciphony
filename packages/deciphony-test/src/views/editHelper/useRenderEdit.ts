import type {MusicScore, SlotData, VDom} from 'deciphony-renderer'
import {
    findElementByVdomDomId,
    findVDomBySelectionKey,
    vdomDomId,
    vdomSelectionKey,
} from 'deciphony-renderer'
import type {Ref} from 'vue'
import {computed, onBeforeUnmount, ref, watch} from 'vue'
import {DEFAULT_ADD_NOTE_STATE, type AddNoteState} from './renderEditAddNoteState'
import {EXCLUDED_INTERACTION_TAGS, HIGHLIGHT_CLASS} from './constants'
import {createEditHighlight} from './renderEditHighlight'
import {
    createNoteHeadDragSession,
    updateNoteHeadDragFromPointer,
    type NoteHeadDragSession,
} from './renderEditNoteHeadDrag'
import {
    computeSlurHandlePoints,
    createSlurDragSession,
    isSlurSelected,
    isSlurVDom,
    updateSlurDragFromPointer,
    type SlurDragSession,
    type SlurHandleKind,
} from './renderEditSlurDrag'
import {
    computeVoltaHandlePoints,
    createVoltaDragSession,
    findVoltaSymbol,
    isVoltaSelected,
    isVoltaVDom,
    resolveVoltaMeasureIds,
    updateVoltaDragFromPointer,
    type VoltaDragSession,
    type VoltaHandleKind,
} from './renderEditVoltaDrag'
import {removeVolta} from './renderEditMeasureProperties'
import {resolveInteractionTarget, resolveSvgFromEvent} from './renderEditPointer'
import {resolvePropertyPanelKind} from './renderEditPropertyPanel'
import {slotDataFromVDom} from './renderEditSelection'
import {
    applyMeasureAddAction,
    findMeasureElement,
    findNoteHeadElement,
    isMeasureAddMode,
    isPointerInMeasureAddRange,
    pointerToSvg,
    measureBoundsFromVDom,
    resolveGhostNotePreview,
    findMeasureSlotVDom,
    findMeasureVDom,
    resolveMeasureSlotAtPointer,
    type GhostNotePreview,
} from './renderEditSymbolAddAction'

export type MusicScoreComponentExpose = {
    vdomDomId: typeof vdomDomId
    vdomSelectionKey: typeof vdomSelectionKey
    findElementByVDom: (node: VDom) => SVGElement | null
}

/**
 * 标准五线谱「点击选中 + 小节加音 + 音符头拖 region」编辑控制器。
 *
 * 分层：
 * - dr-edit：曲谱树增删（edit-util / score-builder），供任意自定义编辑 UI 复用
 * - editHelper（本模块）：与具体页面无关的选中态、指针、ghost、拖拽编排
 * - 页面（如 renderEditTest.vue）：插槽按钮样式、侧栏、快捷键等某一种产品形态
 */
export function useRenderEdit(
    musicScore: MusicScore,
    options?: { musicScoreRef?: Ref<MusicScoreComponentExpose | null> },
) {
    const scoreRootRef = ref<HTMLElement | null>(null)
    const highlightedEl = ref<SVGElement | null>(null)
    const selectedEl = ref<SVGElement | null>(null)
    const selectedItem = ref<SlotData | null>(null)
    const selectedVdomKey = ref<string | null>(null)
    const ghostNotePreview = ref<GhostNotePreview | null>(null)
    const noteHeadDragSession = ref<NoteHeadDragSession | null>(null)
    const slurDragSession = ref<SlurDragSession | null>(null)
    const voltaDragSession = ref<VoltaDragSession | null>(null)
    const relatedHighlightEls = ref<SVGElement[]>([])
    const vDomList = ref<VDom[]>([])
    /** 持续选中的添加状态：决定 ghost 与插入的音符/休止符 */
    const addNoteState = ref<AddNoteState>({...DEFAULT_ADD_NOTE_STATE})
    const lastTopPointer = ref<{ clientX: number; clientY: number } | null>(null)
    let affiliatedDragListenersAttached = false

    const highlight = createEditHighlight({highlightedEl, selectedEl, selectedItem})

    const isMeasureSelected = computed(() => isMeasureAddMode(selectedItem.value))
    const propertyPanelKind = computed(() => resolvePropertyPanelKind(selectedItem.value))

    const activeGhostPreview = computed((): GhostNotePreview | null => {
        const preview = ghostNotePreview.value
        const measureId = selectedItem.value?.measure?.id
        if (!preview || !measureId || preview.measureId !== measureId) return null
        return preview
    })

    const selectedSlurVdom = computed(() => {
        if (!isSlurSelected(selectedItem.value)) return null
        const slurId = selectedItem.value.self.id
        return vDomList.value.find((node) => node.targetId === slurId && isSlurVDom(node)) ?? null
    })

    const slurHandlePoints = computed(() => {
        const vdom = selectedSlurVdom.value
        return vdom ? computeSlurHandlePoints(vdom) : null
    })

    const selectedVoltaVdom = computed(() => {
        if (!isVoltaSelected(selectedItem.value)) return null
        const voltaId = selectedItem.value.self.id
        return vDomList.value.find((node) => node.targetId === voltaId && isVoltaVDom(node)) ?? null
    })

    const voltaHandlePoints = computed(() => {
        const vdom = selectedVoltaVdom.value
        return vdom ? computeVoltaHandlePoints(vdom) : null
    })

    function resolveScoreSvg(): SVGSVGElement | null {
        const root = scoreRootRef.value
        if (!root) return null
        const svg = root.querySelector('svg')
        return svg instanceof SVGSVGElement ? svg : null
    }

    function resolveSelectionElement(vdom: VDom): SVGElement | null {
        return (
            options?.musicScoreRef?.value?.findElementByVDom(vdom)
            ?? (scoreRootRef.value ? findElementByVdomDomId(scoreRootRef.value, vdom) : null)
        )
    }

    /** 小节选中态统一绑定到 m 插槽顶层 g（与模板 measure-selection-frame 一致） */
    function resolveNoteHeadElement(notesInfoId: string): SVGElement | null {
        const root = scoreRootRef.value
        if (root) {
            const fromDom = findNoteHeadElement(root, notesInfoId)
            if (fromDom) return fromDom
        }
        const vdom = vDomList.value.find(
            (node) => node.tag === 'noteHead' && node.targetId === notesInfoId,
        )
        return vdom ? resolveSelectionElement(vdom) : null
    }

    function resolveMeasureElement(measureId: string): SVGElement | null {
        const root = scoreRootRef.value
        if (root) {
            const fromDom = findMeasureElement(root, measureId)
            if (fromDom) return fromDom
        }
        const vdom = findMeasureVDom(vDomList.value, measureId)
        return vdom ? resolveSelectionElement(vdom) : null
    }

    function clearRelatedHighlights() {
        for (const el of relatedHighlightEls.value) {
            el.classList.remove(HIGHLIGHT_CLASS.related)
        }
        relatedHighlightEls.value = []
    }

    function addRelatedHighlight(el: SVGElement) {
        el.style.transition = 'filter 0.2s ease'
        el.classList.add(HIGHLIGHT_CLASS.related)
        relatedHighlightEls.value.push(el)
    }

    function syncRelatedHighlights(slot: SlotData | null | undefined) {
        clearRelatedHighlights()
        if (!slot) return
        if (isVoltaSelected(slot)) {
            for (const measureId of resolveVoltaMeasureIds(musicScore, slot.self)) {
                const el = resolveMeasureElement(measureId)
                if (el) addRelatedHighlight(el)
            }
            return
        }
        if (isSlurSelected(slot)) {
            const {startId, endId} = slot.self
            const ids = startId === endId ? [startId] : [startId, endId]
            for (const id of ids) {
                const el = resolveNoteHeadElement(id)
                if (el) addRelatedHighlight(el)
            }
        }
    }

    function clearSelection() {
        clearRelatedHighlights()
        highlight.clearHoverHighlight()
        if (selectedEl.value) {
            selectedEl.value.classList.remove(HIGHLIGHT_CLASS.selected)
            selectedEl.value = null
        }
        selectedVdomKey.value = null
        selectedItem.value = null
        ghostNotePreview.value = null
    }

    /** 小节选中态统一绑定到 m 插槽顶层 g（与模板 measure-selection-frame 一致） */
    function normalizeMeasureSelectionVdom(vdom: VDom): VDom {
        if (vdom.tag === 'slot' && vdom.slotName === 'm') return vdom
        if (vdom.tag === 'measure' && vdom.targetId) {
            const slotVdom = findMeasureSlotVDom(vDomList.value, vdom.targetId)
            if (slotVdom) return slotVdom
        }
        const measureId = selectedItem.value?.measure?.id
        if (measureId) {
            const slotVdom = findMeasureSlotVDom(vDomList.value, measureId)
            if (slotVdom) return slotVdom
        }
        return vdom
    }

    function applySelectionDom(el: SVGElement | null) {
        if (selectedEl.value && selectedEl.value !== el) {
            selectedEl.value.classList.remove(HIGHLIGHT_CLASS.selected)
        }
        selectedEl.value = el
        if (el) highlight.applySelectedHighlight(el)
    }

    function bindSelectionVdom(vdom: VDom, slot?: SlotData | null) {
        const resolvedSlot = slot ?? resolveSlotFromVDom(vdom)
        const bindingVdom = resolvedSlot && isMeasureAddMode(resolvedSlot)
            ? normalizeMeasureSelectionVdom(vdom)
            : vdom
        selectedVdomKey.value = vdomSelectionKey(bindingVdom)
        if (resolvedSlot) selectedItem.value = resolvedSlot
        applySelectionDom(resolveSelectionElement(bindingVdom))
        syncRelatedHighlights(resolvedSlot)
        if (isSlurSelected(resolvedSlot) || isVoltaSelected(resolvedSlot)) {
            ghostNotePreview.value = null
        }
    }

    /** 重渲染后按 domId 找回 vDom / SlotData / DOM，避免旧节点引用残留高亮 */
    function rebindSelectionAfterRender(list: VDom[]) {
        const session = noteHeadDragSession.value
        let vdom: VDom | undefined

        if (session) {
            vdom = list.find((node) => node.tag === 'noteHead' && node.targetId === session.notesInfoId)
        } else {
            const key = selectedVdomKey.value
            if (!key) return
            vdom = findVDomBySelectionKey(list, key)
        }

        if (!vdom) return
        bindSelectionVdom(vdom)
    }

    function selectMeasureSlot(slot: SlotData) {
        highlight.clearHoverHighlight()
        const measureId = slot.measure?.id
        const vdom = measureId ? findMeasureSlotVDom(vDomList.value, measureId) : undefined
        if (vdom) {
            bindSelectionVdom(vdom, vdom.slotData ?? slot)
        } else {
            selectedVdomKey.value = null
            applySelectionDom(null)
            selectedItem.value = slot
        }
        ghostNotePreview.value = null
    }

    function selectNoteHeadSlot(slot: SlotData, notesInfoId: string) {
        highlight.clearHoverHighlight()
        const vdom = vDomList.value.find(
            (node) => node.tag === 'noteHead' && node.targetId === notesInfoId,
        )
        if (vdom) {
            bindSelectionVdom(vdom, slot)
        } else {
            selectedVdomKey.value = null
            const root = scoreRootRef.value
            const el = root ? findNoteHeadElement(root, notesInfoId) : null
            applySelectionDom(el)
            selectedItem.value = slot
        }
        ghostNotePreview.value = null
    }

    function updateGhostNoteFromPointer(clientX: number, clientY: number) {
        if (!isMeasureSelected.value) {
            ghostNotePreview.value = null
            return
        }
        const svg = scoreRootRef.value?.querySelector('svg')
        if (!(svg instanceof SVGSVGElement)) return
        const measureId = selectedItem.value?.measure?.id
        if (!measureId) return
        // 用 vDom 布局坐标，避免 ghost 画在 m 插槽内时 getBBox 随 ghost 移动而抖动
        const bounds = measureBoundsFromVDom(vDomList.value, measureId)
        if (!bounds) {
            ghostNotePreview.value = null
            return
        }
        const {x, y} = pointerToSvg(svg, clientX, clientY)
        ghostNotePreview.value = resolveGhostNotePreview({
            selected: selectedItem.value,
            vDomList: vDomList.value,
            svgX: x,
            svgY: y,
            measureBounds: bounds,
            addNoteState: addNoteState.value,
        })
    }

    function updateGhostNoteFromTopEvent(event: PointerEvent) {
        lastTopPointer.value = {clientX: event.clientX, clientY: event.clientY}
        updateGhostNoteFromPointer(event.clientX, event.clientY)
    }

    function refreshGhostFromLastPointer() {
        const pointer = lastTopPointer.value
        if (!pointer) return
        updateGhostNoteFromPointer(pointer.clientX, pointer.clientY)
    }

    watch(addNoteState, () => {
        refreshGhostFromLastPointer()
    }, {deep: true})

    function updateNoteHeadDragFromEvent(event: PointerEvent) {
        const session = noteHeadDragSession.value
        if (!session || event.pointerId !== session.pointerId) return
        const svg = resolveSvgFromEvent(event)
        const root = scoreRootRef.value
        if (!svg || !root) return
        const changed = updateNoteHeadDragFromPointer(
            session,
            svg,
            root,
            vDomList.value,
            event.clientX,
            event.clientY,
        )
        if (changed != null) {
            rebindSelectionAfterRender(vDomList.value)
        }
    }

    function endNoteHeadDrag(event: PointerEvent) {
        if (noteHeadDragSession.value?.pointerId === event.pointerId) {
            noteHeadDragSession.value = null
        }
    }

    function updateSlurDragFromEvent(event: PointerEvent) {
        const session = slurDragSession.value
        if (!session || event.pointerId !== session.pointerId) return
        const svg = resolveScoreSvg()
        if (!svg) return
        const vdom = vDomList.value.find(
            (node) => node.targetId === session.slurId && isSlurVDom(node),
        )
        if (!vdom) return
        const {x, y} = pointerToSvg(svg, event.clientX, event.clientY)
        updateSlurDragFromPointer(session, musicScore, vdom, x, y)
    }

    function endSlurDrag(event: PointerEvent) {
        if (slurDragSession.value?.pointerId === event.pointerId) {
            slurDragSession.value = null
            removeAffiliatedDragWindowListeners()
        }
    }

    function updateVoltaDragFromEvent(event: PointerEvent) {
        const session = voltaDragSession.value
        if (!session || event.pointerId !== session.pointerId) return
        const svg = resolveScoreSvg()
        if (!svg) return
        const {x, y} = pointerToSvg(svg, event.clientX, event.clientY)
        updateVoltaDragFromPointer(session, musicScore, x, y)
    }

    function endVoltaDrag(event: PointerEvent) {
        if (voltaDragSession.value?.pointerId === event.pointerId) {
            voltaDragSession.value = null
            removeAffiliatedDragWindowListeners()
        }
    }

    function onAffiliatedDragWindowMove(event: PointerEvent) {
        if (slurDragSession.value) updateSlurDragFromEvent(event)
        if (voltaDragSession.value) updateVoltaDragFromEvent(event)
    }

    function onAffiliatedDragWindowUp(event: PointerEvent) {
        endSlurDrag(event)
        endVoltaDrag(event)
    }

    function attachAffiliatedDragWindowListeners() {
        if (affiliatedDragListenersAttached) return
        affiliatedDragListenersAttached = true
        window.addEventListener('pointermove', onAffiliatedDragWindowMove)
        window.addEventListener('pointerup', onAffiliatedDragWindowUp)
    }

    function removeAffiliatedDragWindowListeners() {
        if (slurDragSession.value || voltaDragSession.value) return
        if (!affiliatedDragListenersAttached) return
        affiliatedDragListenersAttached = false
        window.removeEventListener('pointermove', onAffiliatedDragWindowMove)
        window.removeEventListener('pointerup', onAffiliatedDragWindowUp)
    }

    function handleSlurHandleDown(handle: SlurHandleKind, event: PointerEvent) {
        const vdom = selectedSlurVdom.value
        if (!vdom?.targetId) return
        slurDragSession.value = createSlurDragSession(event, vdom.targetId, handle, vdom)
        attachAffiliatedDragWindowListeners()
        const el = event.currentTarget
        if (el instanceof SVGElement) {
            el.setPointerCapture(event.pointerId)
        }
        event.preventDefault()
    }

    function handleVoltaHandleDown(handle: VoltaHandleKind, event: PointerEvent) {
        const slot = selectedItem.value
        if (!isVoltaSelected(slot)) return
        const sym = findVoltaSymbol(musicScore, slot.self.id)
        if (!sym) return
        const svg = resolveScoreSvg()
        if (!svg) return
        const {x, y} = pointerToSvg(svg, event.clientX, event.clientY)
        voltaDragSession.value = createVoltaDragSession(event, sym.id, handle, sym, x, y)
        attachAffiliatedDragWindowListeners()
        const el = event.currentTarget
        if (el instanceof SVGElement) {
            el.setPointerCapture(event.pointerId)
        }
        event.preventDefault()
    }

    function deleteSelected(): boolean {
        const selected = selectedItem.value
        if (isVoltaSelected(selected)) {
            removeVolta(musicScore, selected.self.id)
            clearSelection()
            return true
        }
        return false
    }

    function tryMeasureAddAtEvent(event: PointerEvent) {
        const measureId = selectedItem.value?.measure?.id
        if (!measureId) return
        const bounds = measureBoundsFromVDom(vDomList.value, measureId)
        const svg = resolveSvgFromEvent(event)
        if (!bounds || !svg) return
        const {x, y} = pointerToSvg(svg, event.clientX, event.clientY)
        if (!isPointerInMeasureAddRange(x, y, bounds)) {
            ghostNotePreview.value = null
            return
        }
        updateGhostNoteFromTopEvent(event)
        const preview = ghostNotePreview.value
        const measureSlot = selectedItem.value
        if (!preview || !measureSlot?.measure) return

        const result = applyMeasureAddAction(
            measureSlot as SlotData & { measure: typeof measureSlot.measure },
            preview,
            musicScore,
        )
        if (!result) return

        if (result.type === 'selectNote') {
            selectNoteHeadSlot(result.slot, result.notesInfoId)
        }
    }

    function resolveSlotFromVDom(vdom: VDom): SlotData | null {
        if (vdom.slotData) return vdom.slotData
        return slotDataFromVDom(musicScore, vdom)
    }

    // —— dr 事件 ——

    function handleDrClick(event: MouseEvent, vdom: VDom) {
        if (EXCLUDED_INTERACTION_TAGS.has(vdom.tag)) return
        const el = resolveInteractionTarget(event)
        if (!el) return
        const slot = resolveSlotFromVDom(vdom)
        if (!slot) return

        highlight.clearHoverHighlight()
        if (selectedEl.value === el && selectedVdomKey.value === vdomSelectionKey(vdom)) return

        bindSelectionVdom(vdom, slot)
        if (!isMeasureAddMode(slot)) {
            ghostNotePreview.value = null
        }
    }

    function handleDrEnter(event: PointerEvent, vdom: VDom) {
        if (EXCLUDED_INTERACTION_TAGS.has(vdom.tag)) return
        const el = resolveInteractionTarget(event)
        if (!el || el === selectedEl.value || highlightedEl.value === el) return
        highlight.clearHoverHighlight()
        highlight.applyHoverHighlight(el)
        highlightedEl.value = el
    }

    function handleDrLeave(event: PointerEvent, vdom: VDom) {
        if (EXCLUDED_INTERACTION_TAGS.has(vdom.tag)) return
        const el = resolveInteractionTarget(event)
        if (el && highlightedEl.value === el) {
            highlight.clearHoverHighlight()
        }
    }

    function handleDrDown(event: PointerEvent, vdom: VDom) {
        if (EXCLUDED_INTERACTION_TAGS.has(vdom.tag)) return
        if (vdom.tag !== 'noteHead') return

        const slot = slotDataFromVDom(musicScore, vdom)
        if (!slot?.info || !slot.note || !slot.measure) return
        if (!('region' in slot.info)) return

        const el = resolveInteractionTarget(event)
        if (!el) return

        highlight.clearHoverHighlight()
        if (selectedItem.value?.info?.id !== slot.info.id) {
            bindSelectionVdom(vdom, slot)
            ghostNotePreview.value = null
        }

        noteHeadDragSession.value = createNoteHeadDragSession(
            event,
            slot as SlotData & {
                info: import('deciphony-renderer').NotesInfo
                note: import('deciphony-renderer').NoteSymbol
                measure: import('deciphony-renderer').Measure
            },
        )
        el.setPointerCapture(event.pointerId)
        event.preventDefault()
    }

    function handleDrUp(event: PointerEvent) {
        endNoteHeadDrag(event)
        endSlurDrag(event)
        endVoltaDrag(event)
    }

    // —— top 事件（小节加音 / 音符头拖拽跟指针）——

    function handleTopMove(event: PointerEvent, _vdom: VDom | null) {
        if (slurDragSession.value) {
            updateSlurDragFromEvent(event)
            return
        }
        if (voltaDragSession.value) {
            updateVoltaDragFromEvent(event)
            return
        }
        if (noteHeadDragSession.value) {
            updateNoteHeadDragFromEvent(event)
            return
        }
        if (isMeasureSelected.value) {
            updateGhostNoteFromTopEvent(event)
        }
    }

    /** top-up 可穿透：空白、五线谱底 measure；小节已选中时仅允许这两者触发 */
    function canProceedMeasureTopUp(vdom: VDom | null): boolean {
        if (vdom == null) return true
        if (vdom.tag === 'measure') return true
        return false
    }

    function handleTopUp(event: PointerEvent, vdom: VDom | null) {
        const wasSlurDragging = slurDragSession.value?.pointerId === event.pointerId
        const wasVoltaDragging = voltaDragSession.value?.pointerId === event.pointerId
        endSlurDrag(event)
        endVoltaDrag(event)
        const wasDragging = noteHeadDragSession.value?.pointerId === event.pointerId
        endNoteHeadDrag(event)
        if (wasSlurDragging || wasVoltaDragging || wasDragging) return
        if (vdom?.tag === 'noteHead') return
        if (!canProceedMeasureTopUp(vdom)) return

        const svg = resolveSvgFromEvent(event)
        if (!svg) return
        const {x, y} = pointerToSvg(svg, event.clientX, event.clientY)
        const slotData = resolveMeasureSlotAtPointer(vDomList.value, x, y)

        if (isMeasureAddMode(selectedItem.value)) {
            const selectedId = selectedItem.value?.measure?.id
            const selectedBounds = selectedId
                ? measureBoundsFromVDom(vDomList.value, selectedId)
                : null
            const inSelectedAddRange = selectedBounds != null
                && isPointerInMeasureAddRange(x, y, selectedBounds)

            if (inSelectedAddRange && selectedId) {
                const hitSelected = !slotData?.measure || slotData.measure.id === selectedId
                if (hitSelected) {
                    tryMeasureAddAtEvent(event)
                    return
                }
            }
            if (slotData?.measure) {
                selectMeasureSlot(slotData)
            } else {
                ghostNotePreview.value = null
            }
            return
        }

        if (!slotData?.measure) return
        selectMeasureSlot(slotData)
    }

    function handleRenderMusicScore(list: VDom[]) {
        vDomList.value = list
        rebindSelectionAfterRender(list)
        refreshGhostFromLastPointer()
    }

    onBeforeUnmount(() => {
        clearSelection()
        noteHeadDragSession.value = null
        slurDragSession.value = null
        voltaDragSession.value = null
        removeAffiliatedDragWindowListeners()
    })

    return {
        scoreRootRef,
        selectedItem,
        selectedEl,
        addNoteState,
        activeGhostPreview,
        isMeasureSelected,
        propertyPanelKind,
        selectedSlurVdom,
        slurHandlePoints,
        voltaHandlePoints,
        handleDrClick,
        handleDrEnter,
        handleDrLeave,
        handleDrDown,
        handleDrUp,
        handleSlurHandleDown,
        handleVoltaHandleDown,
        handleTopMove,
        handleTopUp,
        handleRenderMusicScore,
        deleteSelected,
    }
}
