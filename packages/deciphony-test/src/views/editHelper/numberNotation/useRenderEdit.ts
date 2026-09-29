import type {MusicScore, SlotData, VDom} from '@deciphony/renderer'
import {
    findElementByVdomDomId,
    findVDomBySelectionKey,
    vdomDomId,
    vdomSelectionKey,
} from '@deciphony/renderer'
import type {Ref} from 'vue'
import {computed, onBeforeUnmount, ref, watch} from 'vue'
import {DEFAULT_ADD_NUMBER_STATE, type AddNumberState} from './renderEditNumberAddState'
import {EXCLUDED_INTERACTION_TAGS, HIGHLIGHT_CLASS} from '../constants'
import {createEditHighlight} from '../renderEditHighlight'
import {
    createNumberHeadDragSession,
    updateNumberHeadDragFromPointer,
    type NumberHeadDragSession,
} from './renderEditNumberHeadDrag'
import {
    computeSlurHandlePoints,
    createSlurDragSession,
    isSlurSelected,
    isSlurVDom,
    previewSlurDrag,
    type SlurDragSession,
    type SlurHandleKind,
    type SlurHandlePoints,
} from '../renderEditSlurDrag'
import {
    computeArpeggioHandlePoints,
    createArpeggioDragSession,
    isArpeggioSelected,
    isArpeggioVDom,
    previewArpeggioDrag,
    type ArpeggioDragSession,
    type VerticalHandleKind,
    type VerticalHandlePoints,
} from '../renderEditArpeggioDrag'
import {
    computeStrummingHandlePoints,
    createStrummingDragSession,
    isStrummingSelected,
    isStrummingVDom,
    previewStrummingDrag,
    type StrummingDragSession,
} from '../renderEditStrummingDrag'
import {
    computePedalHandlePoints,
    createPedalDragSession,
    isPedalSelected,
    isPedalVDom,
    previewPedalDrag,
    type PedalDragSession,
    type HorizontalHandleKind,
    type HorizontalHandlePoints,
} from '../renderEditPedalDrag'
import {
    computePitchHandlePoints,
    createPitchDragSession,
    isPitchSelected,
    isPitchVDom,
    previewPitchDrag,
    type PitchDragSession,
} from '../renderEditPitchDrag'
import {flushScoreWrites} from '../scoreWriteGate'
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
import {applyMidiNoteToSelectedMeasure} from '../renderEditMidiAdd'
import {resolveInteractionTarget, resolveSvgFromEvent} from '../renderEditPointer'
import {resolvePropertyPanelKind} from '../renderEditPropertyPanel'
import {slotDataFromVDom} from '../renderEditSelection'
import {findMeasureElement, findNoteHeadElement} from '../standardStaff/renderEditSymbolAddAction'
import {
    applyMeasureAddAction,
    isMeasureAddMode,
    isPointerInMeasureAddRange,
    isPointerInMeasureBounds,
    pointerToSvg,
    measureBoundsFromVDom,
    resolveGhostNumberPreview,
    findMeasureSlotVDom,
    findMeasureVDom,
    resolveMeasureSlotAtPointer,
    type GhostNumberPreview,
} from './renderEditNumberAddAction'

export type MusicScoreComponentExpose = {
    vdomDomId: typeof vdomDomId
    vdomSelectionKey: typeof vdomSelectionKey
    findElementByVDom: (node: VDom) => SVGElement | null
    updateVDom: (targetId: string, patch: Partial<VDom>) => boolean
}

/**
 * 简谱「点击选中 + 小节加音 + 音符头拖唱名」编辑控制器。
 *
 * 分层：
 * - dr-edit：曲谱树增删（edit-util / score-builder），供任意自定义编辑 UI 复用
 * - editHelper（本模块）：与具体页面无关的选中态、指针、ghost、拖拽编排
 * - 页面（如 renderEditTest.vue）：插槽按钮样式、侧栏、快捷键等某一种产品形态
 */
export function useNumberNotationRenderEdit(
    musicScore: MusicScore,
    options?: { musicScoreRef?: Ref<MusicScoreComponentExpose | null> },
) {
    const scoreRootRef = ref<HTMLElement | null>(null)
    const highlightedEl = ref<SVGElement | null>(null)
    const selectedEl = ref<SVGElement | null>(null)
    const selectedItem = ref<SlotData | null>(null)
    const selectedVdomKey = ref<string | null>(null)
    const ghostNotePreview = ref<GhostNumberPreview | null>(null)
    const noteHeadDragSession = ref<NumberHeadDragSession | null>(null)
    const slurDragSession = ref<SlurDragSession | null>(null)
    /** 拖拽中把手位置；不写回 vDomList，避免父组件因 computed 换新对象而重渲染 */
    const slurHandleOverride = ref<SlurHandlePoints | null>(null)
    const arpeggioDragSession = ref<ArpeggioDragSession | null>(null)
    const arpeggioHandleOverride = ref<VerticalHandlePoints | null>(null)
    const strummingDragSession = ref<StrummingDragSession | null>(null)
    const strummingHandleOverride = ref<VerticalHandlePoints | null>(null)
    const pedalDragSession = ref<PedalDragSession | null>(null)
    const pedalHandleOverride = ref<HorizontalHandlePoints | null>(null)
    const pitchDragSession = ref<PitchDragSession | null>(null)
    const pitchHandleOverride = ref<HorizontalHandlePoints | null>(null)
    const voltaDragSession = ref<VoltaDragSession | null>(null)
    const relatedHighlightEls = ref<SVGElement[]>([])
    const vDomList = ref<VDom[]>([])
    /** 持续选中的添加状态：决定 ghost 与插入的音符/休止符 */
    const addNoteState = ref<AddNumberState>({...DEFAULT_ADD_NUMBER_STATE})
    const lastTopPointer = ref<{ clientX: number; clientY: number } | null>(null)
    let affiliatedDragListenersAttached = false

    const highlight = createEditHighlight({highlightedEl, selectedEl, selectedItem})

    const isMeasureSelected = computed(() => isMeasureAddMode(selectedItem.value))
    const propertyPanelKind = computed(() => resolvePropertyPanelKind(selectedItem.value))

    const activeGhostPreview = computed((): GhostNumberPreview | null => {
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
        if (slurHandleOverride.value) return slurHandleOverride.value
        const vdom = selectedSlurVdom.value
        return vdom ? computeSlurHandlePoints(vdom, musicScore.type) : null
    })

    const selectedArpeggioVdom = computed(() => {
        if (!isArpeggioSelected(selectedItem.value)) return null
        const id = selectedItem.value.self.id
        return vDomList.value.find((node) => node.targetId === id && isArpeggioVDom(node)) ?? null
    })

    const arpeggioHandlePoints = computed(() => {
        if (arpeggioHandleOverride.value) return arpeggioHandleOverride.value
        const vdom = selectedArpeggioVdom.value
        return vdom ? computeArpeggioHandlePoints(vdom) : null
    })

    const selectedStrummingVdom = computed(() => {
        if (!isStrummingSelected(selectedItem.value)) return null
        const id = selectedItem.value.self.id
        return vDomList.value.find((node) => node.targetId === id && isStrummingVDom(node)) ?? null
    })

    const strummingHandlePoints = computed(() => {
        if (strummingHandleOverride.value) return strummingHandleOverride.value
        const vdom = selectedStrummingVdom.value
        return vdom ? computeStrummingHandlePoints(vdom) : null
    })

    const selectedPedalVdom = computed(() => {
        if (!isPedalSelected(selectedItem.value)) return null
        const id = selectedItem.value.self.id
        return vDomList.value.find((node) => node.targetId === id && isPedalVDom(node)) ?? null
    })

    const pedalHandlePoints = computed(() => {
        if (pedalHandleOverride.value) return pedalHandleOverride.value
        const vdom = selectedPedalVdom.value
        return vdom ? computePedalHandlePoints(vdom) : null
    })

    const selectedPitchVdom = computed(() => {
        if (!isPitchSelected(selectedItem.value)) return null
        const id = selectedItem.value.self.id
        return vDomList.value.find((node) => node.targetId === id && isPitchVDom(node)) ?? null
    })

    const pitchHandlePoints = computed(() => {
        if (pitchHandleOverride.value) return pitchHandleOverride.value
        const vdom = selectedPitchVdom.value
        return vdom ? computePitchHandlePoints(vdom) : null
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

    /** 重渲染后按 domId 找回 vDom / SlotData / DOM，避免旧节点引用残留高亮 */
    function rebindSelectionAfterRender(list: VDom[]) {
        const session = noteHeadDragSession.value
        let vdom: VDom | undefined

        if (session) {
            vdom = list.find((node) => node.tag === 'noteHead' && node.targetId === session.notesNumberInfoId)
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
        ghostNotePreview.value = resolveGhostNumberPreview({
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
        const changed = updateNumberHeadDragFromPointer(
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
        const points = previewSlurDrag(
            musicScore,
            () => options?.musicScoreRef?.value?.updateVDom,
            session,
            vdom,
            x,
            y,
            musicScore.type,
        )
        if (points) slurHandleOverride.value = points
    }

    function endSlurDrag(event: PointerEvent) {
        if (slurDragSession.value?.pointerId === event.pointerId) {
            slurDragSession.value = null
            slurHandleOverride.value = null
            removeAffiliatedDragWindowListeners()
        }
    }

    function updateArpeggioDragFromEvent(event: PointerEvent) {
        const session = arpeggioDragSession.value
        if (!session || event.pointerId !== session.pointerId) return
        const svg = resolveScoreSvg()
        if (!svg) return
        const vdom = vDomList.value.find(
            (node) => node.targetId === session.symbolId && isArpeggioVDom(node),
        )
        if (!vdom) return
        const {x, y} = pointerToSvg(svg, event.clientX, event.clientY)
        const points = previewArpeggioDrag(
            musicScore,
            () => options?.musicScoreRef?.value?.updateVDom,
            session,
            vdom,
            x,
            y,
        )
        if (points) arpeggioHandleOverride.value = points
    }

    function endArpeggioDrag(event: PointerEvent) {
        if (arpeggioDragSession.value?.pointerId === event.pointerId) {
            arpeggioDragSession.value = null
            arpeggioHandleOverride.value = null
            removeAffiliatedDragWindowListeners()
        }
    }

    function updateStrummingDragFromEvent(event: PointerEvent) {
        const session = strummingDragSession.value
        if (!session || event.pointerId !== session.pointerId) return
        const svg = resolveScoreSvg()
        if (!svg) return
        const vdom = vDomList.value.find(
            (node) => node.targetId === session.symbolId && isStrummingVDom(node),
        )
        if (!vdom) return
        const {x, y} = pointerToSvg(svg, event.clientX, event.clientY)
        const points = previewStrummingDrag(
            musicScore,
            () => options?.musicScoreRef?.value?.updateVDom,
            session,
            vdom,
            x,
            y,
        )
        if (points) strummingHandleOverride.value = points
    }

    function endStrummingDrag(event: PointerEvent) {
        if (strummingDragSession.value?.pointerId === event.pointerId) {
            strummingDragSession.value = null
            strummingHandleOverride.value = null
            removeAffiliatedDragWindowListeners()
        }
    }

    function updatePedalDragFromEvent(event: PointerEvent) {
        const session = pedalDragSession.value
        if (!session || event.pointerId !== session.pointerId) return
        const svg = resolveScoreSvg()
        if (!svg) return
        const vdom = vDomList.value.find(
            (node) => node.targetId === session.symbolId && isPedalVDom(node),
        )
        if (!vdom) return
        const {x, y} = pointerToSvg(svg, event.clientX, event.clientY)
        const points = previewPedalDrag(
            musicScore,
            () => options?.musicScoreRef?.value?.updateVDom,
            session,
            vdom,
            x,
            y,
        )
        if (points) pedalHandleOverride.value = points
    }

    function endPedalDrag(event: PointerEvent) {
        if (pedalDragSession.value?.pointerId === event.pointerId) {
            pedalDragSession.value = null
            pedalHandleOverride.value = null
            removeAffiliatedDragWindowListeners()
        }
    }

    function updatePitchDragFromEvent(event: PointerEvent) {
        const session = pitchDragSession.value
        if (!session || event.pointerId !== session.pointerId) return
        const svg = resolveScoreSvg()
        if (!svg) return
        const vdom = vDomList.value.find(
            (node) => node.targetId === session.symbolId && isPitchVDom(node),
        )
        if (!vdom) return
        const {x, y} = pointerToSvg(svg, event.clientX, event.clientY)
        const points = previewPitchDrag(
            musicScore,
            () => options?.musicScoreRef?.value?.updateVDom,
            session,
            vdom,
            x,
            y,
        )
        if (points) pitchHandleOverride.value = points
    }

    function endPitchDrag(event: PointerEvent) {
        if (pitchDragSession.value?.pointerId === event.pointerId) {
            pitchDragSession.value = null
            pitchHandleOverride.value = null
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
        if (arpeggioDragSession.value) updateArpeggioDragFromEvent(event)
        if (strummingDragSession.value) updateStrummingDragFromEvent(event)
        if (pedalDragSession.value) updatePedalDragFromEvent(event)
        if (pitchDragSession.value) updatePitchDragFromEvent(event)
        if (voltaDragSession.value) updateVoltaDragFromEvent(event)
    }

    function onAffiliatedDragWindowUp(event: PointerEvent) {
        endSlurDrag(event)
        endArpeggioDrag(event)
        endStrummingDrag(event)
        endPedalDrag(event)
        endPitchDrag(event)
        endVoltaDrag(event)
    }

    function attachAffiliatedDragWindowListeners() {
        if (affiliatedDragListenersAttached) return
        affiliatedDragListenersAttached = true
        window.addEventListener('pointermove', onAffiliatedDragWindowMove)
        window.addEventListener('pointerup', onAffiliatedDragWindowUp)
    }

    function removeAffiliatedDragWindowListeners() {
        if (
            slurDragSession.value
            || arpeggioDragSession.value
            || strummingDragSession.value
            || pedalDragSession.value
            || pitchDragSession.value
            || voltaDragSession.value
        ) return
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

    function handleArpeggioHandleDown(handle: VerticalHandleKind, event: PointerEvent) {
        const vdom = selectedArpeggioVdom.value
        if (!vdom?.targetId) return
        const svg = resolveScoreSvg()
        if (!svg) return
        const {x} = pointerToSvg(svg, event.clientX, event.clientY)
        arpeggioDragSession.value = createArpeggioDragSession(
            event,
            vdom.targetId,
            handle,
            vdom,
            x,
        )
        attachAffiliatedDragWindowListeners()
        const el = event.currentTarget
        if (el instanceof SVGElement) {
            el.setPointerCapture(event.pointerId)
        }
        event.preventDefault()
    }

    function handleStrummingHandleDown(handle: VerticalHandleKind, event: PointerEvent) {
        const vdom = selectedStrummingVdom.value
        if (!vdom?.targetId) return
        const svg = resolveScoreSvg()
        if (!svg) return
        const {x} = pointerToSvg(svg, event.clientX, event.clientY)
        strummingDragSession.value = createStrummingDragSession(
            event,
            vdom.targetId,
            handle,
            vdom,
            x,
        )
        attachAffiliatedDragWindowListeners()
        const el = event.currentTarget
        if (el instanceof SVGElement) {
            el.setPointerCapture(event.pointerId)
        }
        event.preventDefault()
    }

    function handlePedalHandleDown(handle: HorizontalHandleKind, event: PointerEvent) {
        const vdom = selectedPedalVdom.value
        if (!vdom?.targetId) return
        const svg = resolveScoreSvg()
        if (!svg) return
        const {y} = pointerToSvg(svg, event.clientX, event.clientY)
        pedalDragSession.value = createPedalDragSession(
            event,
            vdom.targetId,
            handle,
            vdom,
            y,
        )
        attachAffiliatedDragWindowListeners()
        const el = event.currentTarget
        if (el instanceof SVGElement) {
            el.setPointerCapture(event.pointerId)
        }
        event.preventDefault()
    }

    function handlePitchHandleDown(handle: HorizontalHandleKind, event: PointerEvent) {
        const vdom = selectedPitchVdom.value
        if (!vdom?.targetId) return
        const svg = resolveScoreSvg()
        if (!svg) return
        const {y} = pointerToSvg(svg, event.clientX, event.clientY)
        pitchDragSession.value = createPitchDragSession(
            event,
            vdom.targetId,
            handle,
            vdom,
            y,
        )
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
        if (!selected) return false
        if (!deleteSelectedItem(musicScore, selected)) return false
        clearSelection()
        return true
    }

    /** 小节选中态方向键导航；成功选中邻接小节返回 true */
    function navigateSelectedMeasure(direction: MeasureNavDirection): boolean {
        const next = resolveNeighborMeasureSlot(selectedItem.value, direction)
        if (!next) return false
        selectMeasureSlot(next)
        return true
    }

    /** MIDI note-on：小节选中时在末尾追加音符（时值用添加面板） */
    function addMidiNote(midi: number): boolean {
        return applyMidiNoteToSelectedMeasure(
            selectedItem.value,
            midi,
            addNoteState.value.chronaxie,
        )
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
            selectNoteHeadSlot(result.slot, result.notesNumberInfoId)
        }
    }

    function resolveSlotFromVDom(vdom: VDom): SlotData | null {
        if (vdom.slotData) return vdom.slotData
        return slotDataFromVDom(musicScore, vdom)
    }

    // —— dr 事件 ——

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
        if (event.button !== 0) return
        if (EXCLUDED_INTERACTION_TAGS.has(vdom.tag)) return
        if (vdom.tag !== 'noteHead' && vdom.tag !== 'noteNumber' && vdom.tag !== 'rest') return

        const slot = slotDataFromVDom(musicScore, vdom)
        if (!slot?.info || !slot.note || !slot.measure) return
        if (!('syllable' in slot.info)) return

        const el = resolveInteractionTarget(event)
        if (!el) return

        highlight.clearHoverHighlight()
        if (selectedItem.value?.info?.id !== slot.info.id) {
            bindSelectionVdom(vdom, slot)
            ghostNotePreview.value = null
        }

        noteHeadDragSession.value = createNumberHeadDragSession(
            event,
            slot as SlotData & {
                info: import('@deciphony/renderer').NotesNumberInfo
                note: import('@deciphony/renderer').NoteNumber
                measure: import('@deciphony/renderer').Measure
            },
        )
        el.setPointerCapture(event.pointerId)
        event.preventDefault()
    }

    function handleDrUp(event: PointerEvent) {
        endNoteHeadDrag(event)
        endSlurDrag(event)
        endArpeggioDrag(event)
        endStrummingDrag(event)
        endPedalDrag(event)
        endPitchDrag(event)
        endVoltaDrag(event)
    }

    // —— top 事件（小节加音 / 音符头拖拽跟指针）——

    function handleTopMove(event: PointerEvent, _vdom: VDom | null) {
        if (slurDragSession.value) {
            updateSlurDragFromEvent(event)
            return
        }
        if (arpeggioDragSession.value) {
            updateArpeggioDragFromEvent(event)
            return
        }
        if (strummingDragSession.value) {
            updateStrummingDragFromEvent(event)
            return
        }
        if (pedalDragSession.value) {
            updatePedalDragFromEvent(event)
            return
        }
        if (pitchDragSession.value) {
            updatePitchDragFromEvent(event)
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
        const wasArpeggioDragging = arpeggioDragSession.value?.pointerId === event.pointerId
        const wasStrummingDragging = strummingDragSession.value?.pointerId === event.pointerId
        const wasPedalDragging = pedalDragSession.value?.pointerId === event.pointerId
        const wasPitchDragging = pitchDragSession.value?.pointerId === event.pointerId
        const wasVoltaDragging = voltaDragSession.value?.pointerId === event.pointerId
        endSlurDrag(event)
        endArpeggioDrag(event)
        endStrummingDrag(event)
        endPedalDrag(event)
        endPitchDrag(event)
        endVoltaDrag(event)
        const wasDragging = noteHeadDragSession.value?.pointerId === event.pointerId
        endNoteHeadDrag(event)
        if (event.button !== 0) return
        if (
            wasSlurDragging
            || wasArpeggioDragging
            || wasStrummingDragging
            || wasPedalDragging
            || wasPitchDragging
            || wasVoltaDragging
            || wasDragging
        ) return
        if (vdom?.tag === 'noteHead' || vdom?.tag === 'noteNumber' || vdom?.tag === 'rest') return
        if (!canProceedMeasureTopUp(vdom)) return

        const svg = resolveSvgFromEvent(event)
        if (!svg) return
        const {x, y} = pointerToSvg(svg, event.clientX, event.clientY)
        const slotData = resolveMeasureSlotAtPointer(vDomList.value, x, y, {forSelection: true})

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
        flushScoreWrites(musicScore)
        clearSelection()
        noteHeadDragSession.value = null
        slurDragSession.value = null
        slurHandleOverride.value = null
        arpeggioDragSession.value = null
        arpeggioHandleOverride.value = null
        strummingDragSession.value = null
        strummingHandleOverride.value = null
        pedalDragSession.value = null
        pedalHandleOverride.value = null
        pitchDragSession.value = null
        pitchHandleOverride.value = null
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
        arpeggioHandlePoints,
        strummingHandlePoints,
        pedalHandlePoints,
        pitchHandlePoints,
        voltaHandlePoints,
        handleDrClick,
        handleDrEnter,
        handleDrLeave,
        handleDrDown,
        handleDrUp,
        handleSlurHandleDown,
        handleArpeggioHandleDown,
        handleStrummingHandleDown,
        handlePedalHandleDown,
        handlePitchHandleDown,
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
