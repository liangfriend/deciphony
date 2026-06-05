import type {MusicScore, SlotData, VDom} from 'deciphony-renderer'
import {computed, onBeforeUnmount, ref} from 'vue'
import {EXCLUDED_INTERACTION_TAGS} from './constants'
import {createEditHighlight} from './renderEditHighlight'
import {
  createNoteHeadDragSession,
  updateNoteHeadDragFromPointer,
  type NoteHeadDragSession,
} from './renderEditNoteHeadDrag'
import {resolveInteractionTarget, resolveSvgFromEvent} from './renderEditPointer'
import {slotDataFromVDom} from './renderEditSelection'
import {
  applyMeasureAddAction,
  findNoteHeadElement,
  isMeasureAddMode,
  pointerToSvg,
  resolveGhostNotePreview,
  resolveMeasureBounds,
  type GhostNotePreview,
} from './renderEditSymbolAddAction'

/**
 * 标准五线谱「点击选中 + 小节加音 + 音符头拖 region」编辑控制器。
 *
 * 分层：
 * - dr-edit：曲谱树增删（edit-util / score-builder），供任意自定义编辑 UI 复用
 * - editHelper（本模块）：与具体页面无关的选中态、指针、ghost、拖拽编排
 * - 页面（如 renderEditTest.vue）：插槽按钮样式、侧栏、快捷键等某一种产品形态
 */
export function useRenderEdit(musicScore: MusicScore) {
  const scoreRootRef = ref<HTMLElement | null>(null)
  const highlightedEl = ref<SVGElement | null>(null)
  const selectedEl = ref<SVGElement | null>(null)
  const selectedItem = ref<SlotData | null>(null)
  const ghostNotePreview = ref<GhostNotePreview | null>(null)
  const noteHeadDragSession = ref<NoteHeadDragSession | null>(null)
  const vDomList = ref<VDom[]>([])

  const highlight = createEditHighlight({highlightedEl, selectedEl, selectedItem})

  const isMeasureSelected = computed(() => isMeasureAddMode(selectedItem.value))

  const activeGhostPreview = computed((): GhostNotePreview | null => {
    const preview = ghostNotePreview.value
    const measureId = selectedItem.value?.measure?.id
    if (!preview || !measureId || preview.measureId !== measureId) return null
    return preview
  })

  function refreshSelectedNoteHeadHighlight(notesInfoId: string) {
    const root = scoreRootRef.value
    const el = root ? findNoteHeadElement(root, notesInfoId) : null
    if (!el) return
    if (selectedEl.value && selectedEl.value !== el) {
      selectedEl.value.classList.remove('dr-selected-highlight')
    }
    selectedEl.value = el
    highlight.applySelectedHighlight(el)
  }

  function selectNoteHeadSlot(slot: SlotData, notesInfoId: string) {
    highlight.clearHoverHighlight()
    if (selectedEl.value) {
      selectedEl.value.classList.remove('dr-selected-highlight')
    }
    const root = scoreRootRef.value
    const el = root ? findNoteHeadElement(root, notesInfoId) : null
    selectedEl.value = el
    selectedItem.value = slot
    ghostNotePreview.value = null
    if (el) highlight.applySelectedHighlight(el)
  }

  function updateGhostNoteFromTopEvent(event: PointerEvent) {
    if (!isMeasureSelected.value || !selectedEl.value) {
      ghostNotePreview.value = null
      return
    }
    const svg = resolveSvgFromEvent(event)
    const root = scoreRootRef.value
    if (!svg || !root) return
    const measureId = selectedItem.value?.measure?.id
    if (!measureId) return
    const bounds = resolveMeasureBounds(root, measureId, vDomList.value, selectedEl.value)
    if (!bounds) {
      ghostNotePreview.value = null
      return
    }
    const {x, y} = pointerToSvg(svg, event.clientX, event.clientY)
    ghostNotePreview.value = resolveGhostNotePreview({
      selected: selectedItem.value,
      vDomList: vDomList.value,
      svgX: x,
      svgY: y,
      measureBounds: bounds,
    })
  }

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
      refreshSelectedNoteHeadHighlight(session.notesInfoId)
    }
  }

  function endNoteHeadDrag(event: PointerEvent) {
    if (noteHeadDragSession.value?.pointerId === event.pointerId) {
      noteHeadDragSession.value = null
    }
  }

  function tryMeasureAddAtEvent(event: PointerEvent) {
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

  // —— dr 事件 ——

  function handleDrClick(event: MouseEvent, vdom: VDom) {
    if (EXCLUDED_INTERACTION_TAGS.has(vdom.tag)) return
    const el = resolveInteractionTarget(event)
    if (!el) return
    const slot = slotDataFromVDom(musicScore, vdom)
    if (!slot) return

    highlight.clearHoverHighlight()
    if (selectedEl.value === el) return

    if (selectedEl.value && selectedEl.value !== el) {
      selectedEl.value.classList.remove('dr-selected-highlight')
    }
    selectedEl.value = el
    selectedItem.value = slot
    highlight.applySelectedHighlight(el)
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
      selectedEl.value?.classList.remove('dr-selected-highlight')
      selectedEl.value = el
      selectedItem.value = slot
      highlight.applySelectedHighlight(el)
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
  }

  // —— top 事件（小节加音 / 音符头拖拽跟指针）——

  function handleTopMove(event: PointerEvent, _vdom: VDom | null) {
    if (noteHeadDragSession.value) {
      updateNoteHeadDragFromEvent(event)
      return
    }
    if (isMeasureSelected.value) {
      updateGhostNoteFromTopEvent(event)
    }
  }

  function handleTopUp(event: PointerEvent, vdom: VDom | null) {
    const wasDragging = noteHeadDragSession.value?.pointerId === event.pointerId
    endNoteHeadDrag(event)
    if (wasDragging) return
    if (!isMeasureAddMode(selectedItem.value)) return
    if (vdom?.tag === 'noteHead') return
    tryMeasureAddAtEvent(event)
  }

  function handleRenderMusicScore(list: VDom[]) {
    vDomList.value = list
    const session = noteHeadDragSession.value
    if (session) {
      refreshSelectedNoteHeadHighlight(session.notesInfoId)
    }
  }

  onBeforeUnmount(() => {
    highlight.clearHoverHighlight()
    highlight.clearSelectedHighlight()
    ghostNotePreview.value = null
    noteHeadDragSession.value = null
  })

  return {
    scoreRootRef,
    selectedItem,
    selectedEl,
    activeGhostPreview,
    isMeasureSelected,
    handleDrClick,
    handleDrEnter,
    handleDrLeave,
    handleDrDown,
    handleDrUp,
    handleTopMove,
    handleTopUp,
    handleRenderMusicScore,
  }
}
