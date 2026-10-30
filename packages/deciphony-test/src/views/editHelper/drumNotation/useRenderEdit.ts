import type {MusicScore, RenderMusicScoreInfo, SlotData, VDom, VDomLookup} from '@deciphony/renderer'
import {
    locateDrumNotesInfoById,
    locateDrumRestById,
    setDrumNotesInfoRegion,
    setDrumRestRegion,
} from '@deciphony/extensions/dr-edit'
import {
    findElementByVdomDomId,
    findVDomBySelectionKey,
    primaryStaffType,
    vdomDomId,
    vdomSelectionKey,
} from '@deciphony/renderer'
import type {Ref} from 'vue'
import {computed, onBeforeUnmount, ref, shallowRef, watch} from 'vue'
import {findVDomByTarget, findVDomByTargetTag} from '../findVDomByTarget'
import {DEFAULT_ADD_NOTE_STATE, type AddNoteState} from '../renderEditAddNoteState'
import {EXCLUDED_INTERACTION_TAGS, HIGHLIGHT_CLASS} from '../constants'
import {createEditHighlight} from '../renderEditHighlight'
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
import {
    computeLineHandlePoints,
    createLineDragSession,
    isLineSelected,
    isLineVDom,
    previewLineDrag,
    type LineDragSession,
} from '../renderEditLineDrag'
import {
    computeNoteAffiliatedBox,
    createNoteAffiliatedDragSession,
    isNoteAffiliatedSelected,
    isNoteAffiliatedVDom,
    previewNoteAffiliatedDrag,
    type FrameBox,
    type NoteAffiliatedDragSession,
} from '../renderEditNoteAffiliatedDrag'
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
import {tabStaffFrame} from '../tab/renderEditTabAddAction'
import type {MusicScoreComponentExpose} from '../tab/useRenderEdit'
import {DEFAULT_ADD_DRUM_STATE, type AddDrumState} from './renderEditDrumAddState'
import {
    applyDrumMeasureAddAction,
    drumRegionFromRelativeY,
    resolveGhostDrumPreview,
    type GhostDrumPreview,
} from './renderEditDrumAddAction'

/** 拖动音符头 / 休止符上下改线位 */
type DrumDragSession = {
    pointerId: number
    kind: 'head' | 'rest'
    /** 音符头为 notesInfo.id，休止符为 rest.id */
    id: string
    measureId: string
}

const DRUM_SYMBOL_TAGS = new Set(['noteHead', 'noteStem', 'noteTail', 'rest', 'augmentationDot', 'addLine_g', 'addLine_u'])

/**
 * 鼓谱编辑：选中、幽灵音符、点击落音、音符头 / 休止符上下拖动、连音线等附属拖拽。
 * 落音走 dr-edit 的鼓谱 API，按 addDrumState.voice 写入 up / down 声部。
 */
export function useDrumRenderEdit(
    musicScore: MusicScore,
    options?: {musicScoreRef?: Ref<MusicScoreComponentExpose | null>},
) {
    const scoreRootRef = ref<HTMLElement | null>(null)
    const highlightedEl = ref<SVGElement | null>(null)
    const selectedEl = ref<SVGElement | null>(null)
    const selectedItem = ref<SlotData | null>(null)
    const selectedVdomKey = ref<string | null>(null)
    const ghostNotePreview = ref<GhostDrumPreview | null>(null)
    const drumDragSession = ref<DrumDragSession | null>(null)
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
    const lineDragSession = ref<LineDragSession | null>(null)
    const lineHandleOverride = ref<HorizontalHandlePoints | null>(null)
    const noteAffiliatedDragSession = ref<NoteAffiliatedDragSession | null>(null)
    const noteAffiliatedBoxOverride = ref<FrameBox | null>(null)
    const voltaDragSession = ref<VoltaDragSession | null>(null)
    const relatedHighlightEls = ref<SVGElement[]>([])
    const vDomList = shallowRef<VDom[]>([])
    const vDomLookup = shallowRef<VDomLookup | null>(null)
    const findByTarget = (targetId: string, pred?: (node: VDom) => boolean) =>
        findVDomByTarget(vDomList.value, vDomLookup.value, targetId, pred)
    const findByTargetTag = (targetId: string, tag: VDom['tag']) =>
        findVDomByTargetTag(vDomList.value, vDomLookup.value, targetId, tag)
    const addNoteState = ref<AddNoteState>({...DEFAULT_ADD_NOTE_STATE})
    const addDrumState = ref<AddDrumState>({...DEFAULT_ADD_DRUM_STATE})
    const lastTopPointer = ref<{clientX: number; clientY: number} | null>(null)
    let affiliatedDragListenersAttached = false

    const highlight = createEditHighlight({highlightedEl, selectedEl, selectedItem})
    const isMeasureSelected = computed(() => isMeasureAddMode(selectedItem.value))
    const propertyPanelKind = computed(() => resolvePropertyPanelKind(selectedItem.value))

    const activeGhostPreview = computed((): GhostDrumPreview | null => {
        const preview = ghostNotePreview.value
        const measureId = selectedItem.value?.measure?.id
        if (!preview || !measureId || preview.measureId !== measureId) return null
        return preview
    })

    const selectedSlurVdom = computed(() => {
        if (!isSlurSelected(selectedItem.value)) return null
        const slurId = selectedItem.value.self.id
        return findByTarget(slurId, isSlurVDom) ?? null
    })

    const slurHandlePoints = computed(() => {
        if (slurHandleOverride.value) return slurHandleOverride.value
        const vdom = selectedSlurVdom.value
        return vdom ? computeSlurHandlePoints(vdom) : null
    })

    const selectedArpeggioVdom = computed(() => {
        if (!isArpeggioSelected(selectedItem.value)) return null
        const id = selectedItem.value.self.id
        return findByTarget(id, isArpeggioVDom) ?? null
    })

    const arpeggioHandlePoints = computed(() => {
        if (arpeggioHandleOverride.value) return arpeggioHandleOverride.value
        const vdom = selectedArpeggioVdom.value
        return vdom ? computeArpeggioHandlePoints(vdom) : null
    })

    const selectedStrummingVdom = computed(() => {
        if (!isStrummingSelected(selectedItem.value)) return null
        const id = selectedItem.value.self.id
        return findByTarget(id, isStrummingVDom) ?? null
    })

    const strummingHandlePoints = computed(() => {
        if (strummingHandleOverride.value) return strummingHandleOverride.value
        const vdom = selectedStrummingVdom.value
        return vdom ? computeStrummingHandlePoints(vdom) : null
    })

    const selectedPedalVdom = computed(() => {
        if (!isPedalSelected(selectedItem.value)) return null
        const id = selectedItem.value.self.id
        return findByTarget(id, isPedalVDom) ?? null
    })

    const pedalHandlePoints = computed(() => {
        if (pedalHandleOverride.value) return pedalHandleOverride.value
        const vdom = selectedPedalVdom.value
        return vdom ? computePedalHandlePoints(vdom) : null
    })

    const selectedPitchVdom = computed(() => {
        if (!isPitchSelected(selectedItem.value)) return null
        const id = selectedItem.value.self.id
        return findByTarget(id, isPitchVDom) ?? null
    })

    const pitchHandlePoints = computed(() => {
        if (pitchHandleOverride.value) return pitchHandleOverride.value
        const vdom = selectedPitchVdom.value
        return vdom ? computePitchHandlePoints(vdom) : null
    })

    const selectedLineVdom = computed(() => {
        if (!isLineSelected(selectedItem.value)) return null
        const id = selectedItem.value.self.id
        return findByTarget(id, isLineVDom) ?? null
    })

    const lineHandlePoints = computed(() => {
        if (lineHandleOverride.value) return lineHandleOverride.value
        const vdom = selectedLineVdom.value
        return vdom ? computeLineHandlePoints(vdom) : null
    })

    const selectedNoteAffiliatedVdom = computed(() => {
        if (!isNoteAffiliatedSelected(selectedItem.value)) return null
        const id = selectedItem.value.self.id
        return findByTarget(id, (node) => isNoteAffiliatedVDom(node, id)) ?? null
    })

    const noteAffiliatedBox = computed(() => {
        if (noteAffiliatedBoxOverride.value) return noteAffiliatedBoxOverride.value
        const vdom = selectedNoteAffiliatedVdom.value
        return vdom ? computeNoteAffiliatedBox(vdom) : null
    })

    const selectedVoltaVdom = computed(() => {
        if (!isVoltaSelected(selectedItem.value)) return null
        const voltaId = selectedItem.value.self.id
        return findByTarget(voltaId, isVoltaVDom) ?? null
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

    function resolveDrumHeadElement(infoId: string): SVGElement | null {
        const root = scoreRootRef.value
        if (!root) return null
        const el = root.querySelector(`[data-target-id="${infoId}"][data-tag="noteHead"]`)
        return el instanceof SVGElement ? el : null
    }

    function resolveMeasureElement(measureId: string): SVGElement | null {
        const root = scoreRootRef.value
        if (root) {
            const fromDom = findMeasureElement(root, measureId)
            if (fromDom) return fromDom
        }
        const vdom = findMeasureVDom(vDomList.value, measureId, vDomLookup.value)
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
                const el = resolveDrumHeadElement(id)
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
            const slotVdom = findMeasureSlotVDom(vDomList.value, vdom.targetId, vDomLookup.value)
            if (slotVdom) return slotVdom
        }
        const measureId = selectedItem.value?.measure?.id
        if (measureId) {
            const slotVdom = findMeasureSlotVDom(vDomList.value, measureId, vDomLookup.value)
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
        const session = drumDragSession.value
        const sessionTag = session?.kind === 'rest' ? 'rest' : 'noteHead'
        const vdom = session
            ? findByTargetTag(session.id, sessionTag)
            : (selectedVdomKey.value ? findVDomBySelectionKey(list, selectedVdomKey.value) : undefined)
        if (!vdom) return
        bindSelectionVdom(vdom)
    }

    function selectMeasureSlot(slot: SlotData) {
        highlight.clearHoverHighlight()
        const measureId = slot.measure?.id
        const vdom = measureId ? findMeasureSlotVDom(vDomList.value, measureId, vDomLookup.value) : undefined
        if (vdom) {
            bindSelectionVdom(vdom, vdom.slotData ?? slot)
        } else {
            selectedVdomKey.value = null
            applySelectionDom(null)
            selectedItem.value = slot
        }
        ghostNotePreview.value = null
    }

    function selectDrumInfo(notesInfoId: string) {
        const located = locateDrumNotesInfoById(musicScore, notesInfoId)
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
        const vdom = findByTargetTag(notesInfoId, 'noteHead')
        highlight.clearHoverHighlight()
        if (vdom) bindSelectionVdom(vdom, slot)
        else {
            selectedItem.value = slot
            selectedVdomKey.value = null
            applySelectionDom(resolveDrumHeadElement(notesInfoId))
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
        ghostNotePreview.value = resolveGhostDrumPreview({
            selected: selectedItem.value,
            vDomList: vDomList.value,
            svgX: x,
            svgY: y,
            measureBounds: bounds,
            addDrumState: addDrumState.value,
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

    watch(addDrumState, () => {
        refreshGhostFromLastPointer()
    }, {deep: true})

    function updateSlurDragFromEvent(event: PointerEvent) {
        const session = slurDragSession.value
        if (!session || event.pointerId !== session.pointerId) return
        const svg = resolveScoreSvg()
        if (!svg) return
        const vdom = findByTarget(session.slurId, isSlurVDom)
        if (!vdom) return
        const {x, y} = pointerToSvg(svg, event.clientX, event.clientY)
        const points = previewSlurDrag(
            musicScore,
            () => options?.musicScoreRef?.value?.updateVDom,
            session,
            vdom,
            x,
            y,
            primaryStaffType(musicScore),
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
        const vdom = findByTarget(session.symbolId, isArpeggioVDom)
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
        const vdom = findByTarget(session.symbolId, isStrummingVDom)
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
        const vdom = findByTarget(session.symbolId, isPedalVDom)
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
        const vdom = findByTarget(session.symbolId, isPitchVDom)
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

    function updateLineDragFromEvent(event: PointerEvent) {
        const session = lineDragSession.value
        if (!session || event.pointerId !== session.pointerId) return
        const svg = resolveScoreSvg()
        if (!svg) return
        const vdom = findByTarget(session.symbolId, isLineVDom)
        if (!vdom) return
        const {x, y} = pointerToSvg(svg, event.clientX, event.clientY)
        const points = previewLineDrag(
            musicScore,
            () => options?.musicScoreRef?.value?.updateVDom,
            session,
            vdom,
            x,
            y,
        )
        if (points) lineHandleOverride.value = points
    }

    function endLineDrag(event: PointerEvent) {
        if (lineDragSession.value?.pointerId === event.pointerId) {
            lineDragSession.value = null
            lineHandleOverride.value = null
            removeAffiliatedDragWindowListeners()
        }
    }

    function updateNoteAffiliatedDragFromEvent(event: PointerEvent) {
        const session = noteAffiliatedDragSession.value
        if (!session || event.pointerId !== session.pointerId) return
        const svg = resolveScoreSvg()
        if (!svg) return
        const {x, y} = pointerToSvg(svg, event.clientX, event.clientY)
        noteAffiliatedBoxOverride.value = previewNoteAffiliatedDrag(
            musicScore,
            () => options?.musicScoreRef?.value?.updateVDom,
            session,
            x,
            y,
        )
    }

    function endNoteAffiliatedDrag(event: PointerEvent) {
        if (noteAffiliatedDragSession.value?.pointerId === event.pointerId) {
            noteAffiliatedDragSession.value = null
            noteAffiliatedBoxOverride.value = null
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
        if (lineDragSession.value) updateLineDragFromEvent(event)
        if (noteAffiliatedDragSession.value) updateNoteAffiliatedDragFromEvent(event)
        if (voltaDragSession.value) updateVoltaDragFromEvent(event)
    }

    function onAffiliatedDragWindowUp(event: PointerEvent) {
        endSlurDrag(event)
        endArpeggioDrag(event)
        endStrummingDrag(event)
        endPedalDrag(event)
        endPitchDrag(event)
        endLineDrag(event)
        endNoteAffiliatedDrag(event)
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
            || lineDragSession.value
            || noteAffiliatedDragSession.value
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
        if (el instanceof SVGElement) el.setPointerCapture(event.pointerId)
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
        if (el instanceof SVGElement) el.setPointerCapture(event.pointerId)
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
        if (el instanceof SVGElement) el.setPointerCapture(event.pointerId)
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
        if (el instanceof SVGElement) el.setPointerCapture(event.pointerId)
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

    function handleLineHandleDown(handle: HorizontalHandleKind, event: PointerEvent) {
        const vdom = selectedLineVdom.value
        if (!vdom?.targetId) return
        const svg = resolveScoreSvg()
        if (!svg) return
        const {y} = pointerToSvg(svg, event.clientX, event.clientY)
        const session = createLineDragSession(event, vdom.targetId, handle, vdom, y)
        if (!session) return
        lineDragSession.value = session
        attachAffiliatedDragWindowListeners()
        const el = event.currentTarget
        if (el instanceof SVGElement) {
            el.setPointerCapture(event.pointerId)
        }
        event.preventDefault()
    }

    function handleNoteAffiliatedBoxDown(event: PointerEvent) {
        const vdom = selectedNoteAffiliatedVdom.value
        if (!vdom) return
        const svg = resolveScoreSvg()
        if (!svg) return
        const {x, y} = pointerToSvg(svg, event.clientX, event.clientY)
        const session = createNoteAffiliatedDragSession(event, musicScore, vdom, x, y)
        if (!session) return
        noteAffiliatedDragSession.value = session
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
        const result = applyDrumMeasureAddAction(
            measureSlot as SlotData & {measure: NonNullable<SlotData['measure']>},
            preview,
        )
        if (result?.type === 'select') selectDrumInfo(result.notesInfoId)
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

    function endDrumDrag(event: PointerEvent) {
        if (drumDragSession.value?.pointerId === event.pointerId) {
            drumDragSession.value = null
        }
    }

    function updateDrumDragFromEvent(event: PointerEvent) {
        const session = drumDragSession.value
        if (!session || event.pointerId !== session.pointerId) return
        const svg = resolveSvgFromEvent(event)
        if (!svg) return
        const frame = tabStaffFrame(vDomList.value, session.measureId)
        if (!frame) return
        const {y} = pointerToSvg(svg, event.clientX, event.clientY)
        const region = drumRegionFromRelativeY(y - frame.y, frame.h)
        let changed = false
        if (session.kind === 'head') {
            const located = locateDrumNotesInfoById(musicScore, session.id)
            if (located) changed = setDrumNotesInfoRegion(located.info, region, located.note)
        } else {
            const located = locateDrumRestById(musicScore, session.id)
            if (located) changed = setDrumRestRegion(located.rest, region)
        }
        if (changed) rebindSelectionAfterRender(vDomList.value)
    }

    function handleDrDown(event: PointerEvent, vdom: VDom) {
        if (event.button !== 0) return
        if (EXCLUDED_INTERACTION_TAGS.has(vdom.tag)) return
        if (vdom.tag !== 'noteHead' && vdom.tag !== 'rest') return
        if (!vdom.targetId) return

        const slot = slotDataFromVDom(musicScore, vdom)
        if (!slot?.measure) return
        const kind = vdom.tag === 'rest' ? 'rest' : 'head'
        const located = kind === 'head'
            ? locateDrumNotesInfoById(musicScore, vdom.targetId)
            : locateDrumRestById(musicScore, vdom.targetId)
        if (!located) return

        const el = resolveInteractionTarget(event)
        if (!el) return

        highlight.clearHoverHighlight()
        const selfId = (selectedItem.value?.self as {id?: string} | undefined)?.id
        if (selfId !== vdom.targetId) {
            bindSelectionVdom(vdom, slot)
            ghostNotePreview.value = null
        }

        drumDragSession.value = {
            pointerId: event.pointerId,
            kind,
            id: vdom.targetId,
            measureId: slot.measure.id,
        }
        el.setPointerCapture(event.pointerId)
        event.preventDefault()
    }

    function handleDrUp(event: PointerEvent) {
        endDrumDrag(event)
        endSlurDrag(event)
        endArpeggioDrag(event)
        endStrummingDrag(event)
        endPedalDrag(event)
        endPitchDrag(event)
        endLineDrag(event)
        endNoteAffiliatedDrag(event)
        endVoltaDrag(event)
    }

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
        if (lineDragSession.value) {
            updateLineDragFromEvent(event)
            return
        }
        if (noteAffiliatedDragSession.value) {
            updateNoteAffiliatedDragFromEvent(event)
            return
        }
        if (voltaDragSession.value) {
            updateVoltaDragFromEvent(event)
            return
        }
        if (drumDragSession.value) {
            updateDrumDragFromEvent(event)
            return
        }
        if (isMeasureSelected.value) updateGhostFromTopEvent(event)
    }

    function handleTopUp(event: PointerEvent, vdom: VDom | null) {
        const wasSlurDragging = slurDragSession.value?.pointerId === event.pointerId
        const wasArpeggioDragging = arpeggioDragSession.value?.pointerId === event.pointerId
        const wasStrummingDragging = strummingDragSession.value?.pointerId === event.pointerId
        const wasPedalDragging = pedalDragSession.value?.pointerId === event.pointerId
        const wasPitchDragging = pitchDragSession.value?.pointerId === event.pointerId
        const wasLineDragging = lineDragSession.value?.pointerId === event.pointerId
        const wasNoteAffiliatedDragging = noteAffiliatedDragSession.value?.pointerId === event.pointerId
        const wasVoltaDragging = voltaDragSession.value?.pointerId === event.pointerId
        const wasDragging = drumDragSession.value?.pointerId === event.pointerId
        endSlurDrag(event)
        endArpeggioDrag(event)
        endStrummingDrag(event)
        endPedalDrag(event)
        endPitchDrag(event)
        endLineDrag(event)
        endNoteAffiliatedDrag(event)
        endVoltaDrag(event)
        endDrumDrag(event)
        if (event.button !== 0) return
        if (
            wasSlurDragging
            || wasArpeggioDragging
            || wasStrummingDragging
            || wasPedalDragging
            || wasPitchDragging
            || wasLineDragging
            || wasNoteAffiliatedDragging
            || wasVoltaDragging
            || wasDragging
        ) return
        if (vdom && DRUM_SYMBOL_TAGS.has(vdom.tag)) return
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

    function handleRenderMusicScore(list: VDom[], info?: RenderMusicScoreInfo) {
        vDomList.value = list
        vDomLookup.value = info?.lookup ?? null
        rebindSelectionAfterRender(list)
        refreshGhostFromLastPointer()
    }

    onBeforeUnmount(() => {
        flushScoreWrites(musicScore)
        clearSelection()
        drumDragSession.value = null
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
        lineDragSession.value = null
        lineHandleOverride.value = null
        noteAffiliatedDragSession.value = null
        noteAffiliatedBoxOverride.value = null
        voltaDragSession.value = null
        removeAffiliatedDragWindowListeners()
    })

    return {
        scoreRootRef,
        selectedItem,
        selectedEl,
        addNoteState,
        addDrumState,
        activeGhostPreview,
        isMeasureSelected,
        propertyPanelKind,
        selectedSlurVdom,
        slurHandlePoints,
        arpeggioHandlePoints,
        strummingHandlePoints,
        pedalHandlePoints,
        pitchHandlePoints,
        lineHandlePoints,
        noteAffiliatedBox,
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
        handleLineHandleDown,
        handleNoteAffiliatedBoxDown,
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
