/**
 * editHelper — 可迁移的编辑编排层（选中、指针、ghost、拖拽、插槽按钮策略）。
 *
 * 分层：
 * - dr-edit：曲谱数据变更
 * - editHelper/shared：两种谱面共用
 * - editHelper/standardStaff：五线谱专有
 * - editHelper/numberNotation：简谱专有
 */

export {EXCLUDED_INTERACTION_TAGS, HIGHLIGHT_CLASS} from './constants'
export {createEditHighlight, type EditHighlightRefs} from './renderEditHighlight'
export {resolveInteractionTarget, resolveSvgFromEvent} from './renderEditPointer'
export {slotDataFromVDom} from './renderEditSelection'
export {
  addGrandStaffFromSlot,
  addMeasureFromSlot,
  addSingleStaffFromSlot,
  deleteGrandStaffFromSlot,
  deleteSingleStaffFromSlot,
} from './renderEditSlotActions'
export {
  ADD_GRAND_STAFF_BTN_H,
  ADD_GRAND_STAFF_BTN_W,
  ADD_MEASURE_BTN_H,
  ADD_MEASURE_BTN_W,
  ADD_SINGLE_STAFF_BTN_H,
  ADD_SINGLE_STAFF_BTN_W,
  DELETE_GRAND_STAFF_BTN_H,
  DELETE_GRAND_STAFF_BTN_W,
  DELETE_SINGLE_STAFF_BTN_H,
  DELETE_SINGLE_STAFF_BTN_W,
  SLOT_BTN_GAP,
  addGrandStaffBtnX,
  addGrandStaffBtnY,
  addMeasureBtnX,
  addMeasureBtnY,
  addSingleStaffBtnX,
  addSingleStaffBtnY,
  deleteGrandStaffBtnX,
  deleteGrandStaffBtnY,
  deleteSingleStaffBtnX,
  deleteSingleStaffBtnY,
} from './renderEditSlotLayout'
export {deleteSelectedItem, isRestSelected} from './renderEditDelete'
export {resolvePropertyPanelKind, type PropertyPanelKind} from './renderEditPropertyPanel'
export {
  ADD_NOTE_KIND_OPTIONS,
  CHRONAXIE_OPTIONS,
  DEFAULT_ADD_NOTE_STATE,
  type AddNoteSlotKind,
  type AddNoteState,
} from './renderEditAddNoteState'
export {findVoltaAtMeasure, findVoltaAtMeasure as findVoltaEndingAt} from './renderEditVoltaAdd'
export {VOLTA_SPAN_OPTIONS, tryAddVoltaFromMeasure, type VoltaSpan} from './renderEditVoltaAdd'
export {
  insertMeasureAfter,
  insertMeasureBefore,
} from './renderEditMeasureProperties'
export {
  computeSlurHandlePoints,
  createSlurDragSession,
  isSlurSelected,
  isSlurVDom,
  updateSlurDragFromPointer,
  type SlurDragSession,
  type SlurHandleKind,
  type SlurHandlePoints,
} from './renderEditSlurDrag'
export {
  computeVoltaHandlePoints,
  createVoltaDragSession,
  isVoltaSelected,
  isVoltaVDom,
  resolveVoltaMeasureIds,
  updateVoltaDragFromPointer,
  type VoltaDragSession,
  type VoltaHandleKind,
  type VoltaHandlePoints,
} from './renderEditVoltaDrag'
export {useRenderEdit, type MusicScoreComponentExpose} from './useRenderEdit'

// —— 五线谱 ——
export {
  applyMeasureAddAction as applyStaffMeasureAddAction,
  findMeasureSlotElement,
  findNoteHeadElement,
  isMeasureAddMode,
  pointerToSvg,
  resolveGhostNotePreview,
  resolveMeasureBounds,
  type GhostNotePreview as StaffGhostNotePreview,
  type MeasureBounds,
} from './standardStaff/renderEditSymbolAddAction'
export {
  createNoteHeadDragSession,
  isNoteHeadSelected,
  updateNoteHeadDragFromPointer,
  type NoteHeadDragSession,
} from './standardStaff/renderEditNoteHeadDrag'
export {SLUR_SPAN_OPTIONS, tryAddSlurFromNoteHead, type SlurSpan} from './standardStaff/renderEditSlurAdd'
export {useStandardStaffRenderEdit} from './standardStaff/useRenderEdit'
export {default as NoteHeadPropertyPanel} from './standardStaff/components/NoteHeadPropertyPanel.vue'
export {default as GhostNotePreview} from './standardStaff/components/GhostNotePreview.vue'

// —— 简谱 ——
export {
  ADD_NUMBER_KIND_OPTIONS,
  DEFAULT_ADD_NUMBER_STATE,
  type AddNumberSlotKind,
  type AddNumberState,
} from './numberNotation/renderEditNumberAddState'
export {
  applyMeasureAddAction as applyNumberMeasureAddAction,
  resolveGhostNumberPreview,
  type GhostNumberPreview as NumberGhostPreview,
} from './numberNotation/renderEditNumberAddAction'
export {
  createNumberHeadDragSession,
  isNumberHeadSelected,
  updateNumberHeadDragFromPointer,
  type NumberHeadDragSession,
} from './numberNotation/renderEditNumberHeadDrag'
export {tryAddSlurFromNumberHead} from './numberNotation/renderEditSlurAdd'
export {useNumberNotationRenderEdit} from './numberNotation/useRenderEdit'
export {default as NumberHeadPropertyPanel} from './numberNotation/components/NumberHeadPropertyPanel.vue'
export {default as GhostNumberPreview} from './numberNotation/components/GhostNumberPreview.vue'
export {default as AddNumberStatePanel} from './numberNotation/components/AddNumberStatePanel.vue'
export type {StaffGhostNotePreview as GhostNotePreviewState}
export type {NumberGhostPreview as GhostNumberPreviewState}

// —— 共用 UI ——
export {default as AddNoteStatePanel} from './components/AddNoteStatePanel.vue'
export {default as PropertyPanel} from './components/PropertyPanel.vue'
export {default as MeasurePropertyPanel} from './components/MeasurePropertyPanel.vue'
export {default as VoltaPropertyPanel} from './components/VoltaPropertyPanel.vue'
export {default as VoltaDragHandles} from './components/VoltaDragHandles.vue'
export {default as SlurDragHandles} from './components/SlurDragHandles.vue'
export {default as AddGrandStaffButton} from './components/AddGrandStaffButton.vue'
export {default as DeleteGrandStaffButton} from './components/DeleteGrandStaffButton.vue'
export {default as EditSlotGdButtons} from './components/EditSlotGdButtons.vue'
export {default as AddSingleStaffButton} from './components/AddSingleStaffButton.vue'
export {default as DeleteSingleStaffButton} from './components/DeleteSingleStaffButton.vue'
export {default as AddMeasureButton} from './components/AddMeasureButton.vue'
export {default as EditSlotSdButtons} from './components/EditSlotSdButtons.vue'
