import type {MusicScore, SlotData, TabNote, TabNoteInfo, VDom} from '@deciphony/renderer'
import {isTabHeadInfo, setTabNoteInfoRegion, tabStringCount} from '@deciphony/extensions/dr-edit'
import {locateTabNoteInfoById} from '@deciphony/extensions/dr-edit/score-builder'
import {
    findElementByVdomDomId,
    findVDomBySelectionKey,
    vdomDomId,
    vdomSelectionKey,
} from '@deciphony/renderer'
import type {Ref} from 'vue'
import {computed, onBeforeUnmount, ref, watch} from 'vue'
import {DEFAULT_ADD_NOTE_STATE, type AddNoteState} from '../renderEditAddNoteState'
import {EXCLUDED_INTERACTION_TAGS, HIGHLIGHT_CLASS} from '../constants'
import {createEditHighlight} from '../renderEditHighlight'
import {
    computeSlurHandlePoints,
    createSlurDragSession,
    isSlurSelected,
    isSlurVDom,
    updateSlurDragFromPointer,
    type SlurDragSession,
    type SlurHandleKind,
} from '../renderEditSlurDrag'
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
} from '../renderEditVoltaDrag'
import {deleteSelectedItem} from '../renderEditDelete'
import {resolveNeighborMeasureSlot, type MeasureNavDirection} from '../renderEditMeasureNavigate'
import {resolveInteractionTarget, resolveSvgFromEvent} from '../renderEditPointer'
import {resolvePropertyPanelKind} from '../renderEditPropertyPanel'
import {slotDataFromVDom} from '../renderEditSelection'
import {
    findMeasureElement,
    findMeasureSlotVDom,
    findMeasureVDom,
    isMeasureAddMode,
    isPointerInMeasureAddRange,
    isPointerInMeasureBounds,
    measureBoundsFromVDom,
    pointerToSvg,
    resolveMeasureSlotAtPointer,
} from '../standardStaff/renderEditSymbolAddAction'
import {DEFAULT_ADD_TAB_STATE, type AddTabState} from './renderEditTabAddState'
import {
    applyTabMeasureAddAction,
    resolveGhostTabPreview,
    tabRegionFromRelativeY,
    tabStaffFrame,
    type GhostTabPreview,
} from './renderEditTabAddAction'

type TabHeadDragSession = {
    pointerId: number
    notesInfoId: string
    info: TabNoteInfo
    note: TabNote
    measureId: string
}

export type MusicScoreComponentExpose = {
    vdomDomId: typeof vdomDomId
    vdomSelectionKey: typeof vdomSelectionKey
    findElementByVDom: (node: VDom) => SVGElement | null
}

const TAB_NOTE_TAGS = new Set(['tabNoteNumber', 'arpeggio', 'strumming', 'bend', 'rest'])

function tabInfoTag(info: TabNoteInfo): VDom['tag'] {
    if (info.type === 'arpeggio') return 'arpeggio'
    if (info.type === 'strumming') return 'strumming'
    return 'tabNoteNumber'
}

/**
 * 吉他谱 / 尤克里里谱编辑：选中、幽灵音符、点击落音、连音线拖拽。
 * 数据变更走 dr-edit 的 tab API；弦数随 Tab6 / Tab4 变化。
 */
export function useTabRenderEdit(
    musicScore: MusicScore,
    options?: {musicScoreRef?: Ref<MusicScoreComponentExpose | null>},
) {
    const stringCount = tabStringCount(musicScore.type)
    const scoreRootRef = ref<HTMLElement | null>(null)
    const highlightedEl = ref<SVGElement | null>(null)
    const selectedEl = ref<SVGElement | null>(null)
    const selectedItem = ref<SlotData | null>(null)
    const selectedVdomKey = ref<string | null>(null)
    const ghostNotePreview = ref<GhostTabPreview | null>(null)
    const tabHeadDragSession = ref<TabHeadDragSession | null>(null)
    const slurDragSession = ref<SlurDragSession | null>(null)
    const voltaDragSession = ref<VoltaDragSession | null>(null)
    const relatedHighlightEls = ref<SVGElement[]>([])
    const vDomList = ref<VDom[]>([])
    const addNoteState = ref<AddNoteState>({...DEFAULT_ADD_NOTE_STATE})
    const addTabState = ref<AddTabState>({
        ...DEFAULT_ADD_TAB_STATE,
        regionEnd: stringCount - 1,
    })
    const lastTopPointer = ref<{clientX: number; clientY: number} | null>(null)
    let affiliatedDragListenersAttached = false

    const highlight = createEditHighlight({highlightedEl, selectedEl, selectedItem})
    const isMeasureSelected = computed(() => isMeasureAddMode(selectedItem.value))
    const propertyPanelKind = computed(() => resolvePropertyPanelKind(selectedItem.value))

    const activeGhostPreview = computed((): GhostTabPreview | null => {
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

    function resolveTabInfoElement(infoId: string): SVGElement | null {
        const root = scoreRootRef.value
        if (!root) return null
        const el = root.querySelector(
            `[data-target-id="${infoId}"][data-tag="tabNoteNumber"],[data-target-id="${infoId}"][data-tag="arpeggio"],[data-target-id="${infoId}"][data-tag="strumming"]`,
        )
        return el instanceof SVGElement ? el : null
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
                const el = resolveTabInfoElement(id)
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

    function resolveSlotFromVDom(vdom: VDom): SlotData | null {
        if (vdom.slotData) return vdom.slotData
        return slotDataFromVDom(musicScore, vdom)
    }

    function bindSelectionVdom(vdom: VDom, slot?: SlotData | null) {
        const resolvedSlot = slot ?? resolveSlotFromVDom(vdom)
        const bindingVdom = resolvedSlot && isMeasureAddMode(resolvedSlot)
            ? normalizeMeasureSelectionVdom(vdom)
            : vdom
        const key = vdomSelectionKey(bindingVdom)
        // 重渲染后 slotData 常是新对象；同 key 不再写 selectedItem，避免属性面板/el-select 挂载回写触发 deep watch 递归
        if (selectedVdomKey.value === key) {
            applySelectionDom(resolveSelectionElement(bindingVdom))
            syncRelatedHighlights(selectedItem.value ?? resolvedSlot)
            return
        }
        selectedVdomKey.value = key
        if (resolvedSlot) selectedItem.value = resolvedSlot
        applySelectionDom(resolveSelectionElement(bindingVdom))
        syncRelatedHighlights(resolvedSlot)
        if (isSlurSelected(resolvedSlot) || isVoltaSelected(resolvedSlot)) {
            ghostNotePreview.value = null
        }
    }

    function rebindSelectionAfterRender(list: VDom[]) {
        const session = tabHeadDragSession.value
        const vdom = session
            ? list.find((node) => node.tag === 'tabNoteNumber' && node.targetId === session.notesInfoId)
            : (selectedVdomKey.value ? findVDomBySelectionKey(list, selectedVdomKey.value) : undefined)
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

    function selectTabInfo(notesInfoId: string) {
        const located = locateTabNoteInfoById(musicScore, notesInfoId)
        if (!located) return
        const slot: SlotData = {
            musicScore,
            grandStaff: located.grandStaff,
            singleStaff: located.singleStaff,
            measure: located.measure,
            note: located.note as unknown as SlotData['note'],
            info: located.info as unknown as SlotData['info'],
            self: located.info as unknown as SlotData['self'],
        }
        const tag = tabInfoTag(located.info)
        const vdom = vDomList.value.find((node) => node.tag === tag && node.targetId === notesInfoId)
        highlight.clearHoverHighlight()
        if (vdom) bindSelectionVdom(vdom, slot)
        else {
            selectedItem.value = slot
            selectedVdomKey.value = null
            applySelectionDom(resolveTabInfoElement(notesInfoId))
        }
        ghostNotePreview.value = null
    }

    function updateGhostFromPointer(clientX: number, clientY: number) {
        if (!isMeasureSelected.value) {
            ghostNotePreview.value = null
            return
        }
        const svg = scoreRootRef.value?.querySelector('svg')
        if (!(svg instanceof SVGSVGElement)) return
        const measureId = selectedItem.value?.measure?.id
        if (!measureId) return
        const bounds = measureBoundsFromVDom(vDomList.value, measureId)
        if (!bounds) {
            ghostNotePreview.value = null
            return
        }
        const {x, y} = pointerToSvg(svg, clientX, clientY)
        ghostNotePreview.value = resolveGhostTabPreview({
            selected: selectedItem.value,
            vDomList: vDomList.value,
            svgX: x,
            svgY: y,
            measureBounds: bounds,
            addTabState: addTabState.value,
            stringCount,
        })
    }

    function updateGhostFromTopEvent(event: PointerEvent) {
        lastTopPointer.value = {clientX: event.clientX, clientY: event.clientY}
        updateGhostFromPointer(event.clientX, event.clientY)
    }

    function refreshGhostFromLastPointer() {
        const pointer = lastTopPointer.value
        if (!pointer) return
        updateGhostFromPointer(pointer.clientX, pointer.clientY)
    }

    watch(addTabState, () => {
        refreshGhostFromLastPointer()
    }, {deep: true})

    function updateSlurDragFromEvent(event: PointerEvent) {
        const session = slurDragSession.value
        if (!session || event.pointerId !== session.pointerId) return
        const svg = resolveScoreSvg()
        if (!svg) return
        const vdom = vDomList.value.find((node) => node.targetId === session.slurId && isSlurVDom(node))
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
        if (el instanceof SVGElement) el.setPointerCapture(event.pointerId)
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
        if (el instanceof SVGElement) el.setPointerCapture(event.pointerId)
        event.preventDefault()
    }

    function deleteSelected(): boolean {
        const selected = selectedItem.value
        if (!selected) return false
        if (!deleteSelectedItem(musicScore, selected)) return false
        clearSelection()
        return true
    }

    function navigateSelectedMeasure(direction: MeasureNavDirection): boolean {
        const next = resolveNeighborMeasureSlot(selectedItem.value, direction)
        if (!next) return false
        selectMeasureSlot(next)
        return true
    }

    function addMidiNote(_midi: number): boolean {
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
        updateGhostFromTopEvent(event)
        const preview = ghostNotePreview.value
        const measureSlot = selectedItem.value
        if (!preview || !measureSlot?.measure) return
        const result = applyTabMeasureAddAction(
            measureSlot as SlotData & {measure: NonNullable<SlotData['measure']>},
            preview,
            stringCount,
            musicScore,
        )
        if (result?.type === 'select') selectTabInfo(result.notesInfoId)
    }

    function handleDrClick(event: MouseEvent, vdom: VDom) {
        if (event.button !== 0) return
        if (EXCLUDED_INTERACTION_TAGS.has(vdom.tag)) return
        const el = resolveInteractionTarget(event)
        if (!el) return
        const slot = resolveSlotFromVDom(vdom)
        if (!slot) return
        if (isMeasureAddMode(slot)) {
            const measureId = slot.measure?.id
            if (!measureId) return
            const svg = resolveSvgFromEvent(event)
            const bounds = measureBoundsFromVDom(vDomList.value, measureId)
            if (!svg || !bounds) return
            const {x, y} = pointerToSvg(svg, event.clientX, event.clientY)
            if (!isPointerInMeasureBounds(x, y, bounds)) return
        }
        highlight.clearHoverHighlight()
        if (selectedEl.value === el && selectedVdomKey.value === vdomSelectionKey(vdom)) return
        bindSelectionVdom(vdom, slot)
        if (!isMeasureAddMode(slot)) ghostNotePreview.value = null
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
        if (el && highlightedEl.value === el) highlight.clearHoverHighlight()
    }

    function endTabHeadDrag(event: PointerEvent) {
        if (tabHeadDragSession.value?.pointerId === event.pointerId) {
            tabHeadDragSession.value = null
        }
    }

    function updateTabHeadDragFromEvent(event: PointerEvent) {
        const session = tabHeadDragSession.value
        if (!session || event.pointerId !== session.pointerId) return
        if (!isTabHeadInfo(session.info)) return
        const svg = resolveSvgFromEvent(event)
        if (!svg) return
        const frame = tabStaffFrame(vDomList.value, session.measureId)
        if (!frame) return
        const {y} = pointerToSvg(svg, event.clientX, event.clientY)
        const region = tabRegionFromRelativeY(y - frame.y, frame.h, stringCount)
        if (setTabNoteInfoRegion(session.info, region, stringCount, session.note)) {
            rebindSelectionAfterRender(vDomList.value)
        }
    }

    function handleDrDown(event: PointerEvent, vdom: VDom) {
        if (event.button !== 0) return
        if (EXCLUDED_INTERACTION_TAGS.has(vdom.tag)) return
        if (vdom.tag !== 'tabNoteNumber') return

        const slot = slotDataFromVDom(musicScore, vdom)
        const info = slot?.info as unknown as TabNoteInfo | undefined
        const note = slot?.note as unknown as TabNote | undefined
        if (!slot?.measure || !info || !note || !isTabHeadInfo(info)) return

        const el = resolveInteractionTarget(event)
        if (!el) return

        highlight.clearHoverHighlight()
        if (selectedItem.value?.info?.id !== info.id) {
            bindSelectionVdom(vdom, slot)
            ghostNotePreview.value = null
        }

        tabHeadDragSession.value = {
            pointerId: event.pointerId,
            notesInfoId: info.id,
            info,
            note,
            measureId: slot.measure.id,
        }
        el.setPointerCapture(event.pointerId)
        event.preventDefault()
    }

    function handleDrUp(event: PointerEvent) {
        endTabHeadDrag(event)
        endSlurDrag(event)
        endVoltaDrag(event)
    }

    function handleTopMove(event: PointerEvent, _vdom: VDom | null) {
        if (slurDragSession.value) {
            updateSlurDragFromEvent(event)
            return
        }
        if (voltaDragSession.value) {
            updateVoltaDragFromEvent(event)
            return
        }
        if (tabHeadDragSession.value) {
            updateTabHeadDragFromEvent(event)
            return
        }
        if (isMeasureSelected.value) updateGhostFromTopEvent(event)
    }

    function handleTopUp(event: PointerEvent, vdom: VDom | null) {
        const wasSlurDragging = slurDragSession.value?.pointerId === event.pointerId
        const wasVoltaDragging = voltaDragSession.value?.pointerId === event.pointerId
        const wasDragging = tabHeadDragSession.value?.pointerId === event.pointerId
        endSlurDrag(event)
        endVoltaDrag(event)
        endTabHeadDrag(event)
        if (event.button !== 0) return
        if (wasSlurDragging || wasVoltaDragging || wasDragging) return
        if (vdom && TAB_NOTE_TAGS.has(vdom.tag)) return
        if (vdom != null && vdom.tag !== 'measure') return

        const svg = resolveSvgFromEvent(event)
        if (!svg) return
        const {x, y} = pointerToSvg(svg, event.clientX, event.clientY)
        const slotData = resolveMeasureSlotAtPointer(vDomList.value, x, y, {forSelection: true})

        if (isMeasureAddMode(selectedItem.value)) {
            const selectedId = selectedItem.value?.measure?.id
            const selectedBounds = selectedId ? measureBoundsFromVDom(vDomList.value, selectedId) : null
            const inSelectedAddRange = selectedBounds != null && isPointerInMeasureAddRange(x, y, selectedBounds)
            if (inSelectedAddRange && selectedId) {
                const hitSelected = !slotData?.measure || slotData.measure.id === selectedId
                if (hitSelected) {
                    tryMeasureAddAtEvent(event)
                    return
                }
            }
            if (slotData?.measure) selectMeasureSlot(slotData)
            else ghostNotePreview.value = null
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
        tabHeadDragSession.value = null
        slurDragSession.value = null
        voltaDragSession.value = null
        removeAffiliatedDragWindowListeners()
    })

    return {
        scoreRootRef,
        selectedItem,
        selectedEl,
        addNoteState,
        addTabState,
        stringCount,
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
        navigateSelectedMeasure,
        addMidiNote,
        clearSelection,
    }
}
