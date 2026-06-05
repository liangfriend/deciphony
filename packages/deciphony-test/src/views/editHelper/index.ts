/**
 * editHelper — 可迁移的编辑编排层（选中、指针、ghost、拖拽、插槽按钮策略）。
 *
 * 依赖 dr-edit 做曲谱数据变更；不绑定某一种页面 UI。
 * 具体产品形态（renderEditTest 等）只消费本层 composable / 工具。
 *
 * @example
 * import { useRenderEdit, addGrandStaffBtnX } from './editHelper'
 * const edit = useRenderEdit(musicScoreData)
 */

export {EXCLUDED_INTERACTION_TAGS, HIGHLIGHT_CLASS} from './constants'
export {createEditHighlight, type EditHighlightRefs} from './renderEditHighlight'
export {resolveInteractionTarget, resolveSvgFromEvent} from './renderEditPointer'
export {slotDataFromVDom} from './renderEditSelection'
export {
  addGrandStaffFromSlot,
  addMeasureFromSlot,
  addSingleStaffFromSlot,
} from './renderEditSlotActions'
export {
  ADD_GRAND_STAFF_BTN_H,
  ADD_GRAND_STAFF_BTN_W,
  ADD_MEASURE_BTN_H,
  ADD_MEASURE_BTN_W,
  ADD_SINGLE_STAFF_BTN_H,
  ADD_SINGLE_STAFF_BTN_W,
  addGrandStaffBtnX,
  addGrandStaffBtnY,
  addMeasureBtnX,
  addMeasureBtnY,
  addSingleStaffBtnX,
  addSingleStaffBtnY,
} from './renderEditSlotLayout'
export {
  applyMeasureAddAction,
  findMeasureSlotElement,
  findNoteHeadElement,
  isMeasureAddMode,
  pointerToSvg,
  resolveGhostNotePreview,
  resolveMeasureBounds,
  type GhostNotePreview,
  type MeasureBounds,
} from './renderEditSymbolAddAction'
export {
  createNoteHeadDragSession,
  isNoteHeadSelected,
  updateNoteHeadDragFromPointer,
  type NoteHeadDragSession,
} from './renderEditNoteHeadDrag'
export {resolvePropertyPanelKind, type PropertyPanelKind} from './renderEditPropertyPanel'
export {
  ADD_NOTE_KIND_OPTIONS,
  CHRONAXIE_OPTIONS,
  DEFAULT_ADD_NOTE_STATE,
  type AddNoteSlotKind,
  type AddNoteState,
} from './renderEditAddNoteState'
export {
  addVoltaEndingAtMeasure,
  findVoltaEndingAt,
  insertMeasureAfter,
  insertMeasureBefore,
} from './renderEditMeasureProperties'
export {useRenderEdit} from './useRenderEdit'

export {default as AddNoteStatePanel} from './components/AddNoteStatePanel.vue'
export {default as PropertyPanel} from './components/PropertyPanel.vue'
export {default as MeasurePropertyPanel} from './components/MeasurePropertyPanel.vue'
export {default as AddGrandStaffButton} from './components/AddGrandStaffButton.vue'
export {default as AddSingleStaffButton} from './components/AddSingleStaffButton.vue'
export {default as AddMeasureButton} from './components/AddMeasureButton.vue'
export {default as EditSlotSdButtons} from './components/EditSlotSdButtons.vue'
export {default as GhostNotePreview} from './components/GhostNotePreview.vue'
