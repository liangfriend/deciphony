import type {Ref} from 'vue'
import type {SlotData} from 'deciphony-renderer'
import {HIGHLIGHT_CLASS} from './constants'

export type EditHighlightRefs = {
  highlightedEl: Ref<SVGElement | null>
  selectedEl: Ref<SVGElement | null>
  selectedItem: Ref<SlotData | null>
}

export function createEditHighlight(refs: EditHighlightRefs) {
  const {highlightedEl, selectedEl, selectedItem} = refs

  function clearHoverHighlight() {
    if (highlightedEl.value && highlightedEl.value !== selectedEl.value) {
      highlightedEl.value.classList.remove(HIGHLIGHT_CLASS.hover)
    }
    highlightedEl.value = null
  }

  function clearSelectedHighlight() {
    selectedEl.value?.classList.remove(HIGHLIGHT_CLASS.selected)
    selectedEl.value = null
    selectedItem.value = null
  }

  function applySelectedHighlight(el: SVGElement) {
    el.style.transition = 'filter 0.2s ease'
    el.classList.add(HIGHLIGHT_CLASS.selected)
  }

  function applyHoverHighlight(el: SVGElement) {
    el.style.transition = 'filter 0.2s ease'
    el.classList.add(HIGHLIGHT_CLASS.hover)
  }

  return {
    clearHoverHighlight,
    clearSelectedHighlight,
    applySelectedHighlight,
    applyHoverHighlight,
  }
}
