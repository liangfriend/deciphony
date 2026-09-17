export {default as TimeOffsetEditor} from './components/TimeOffsetEditor.vue'
export {autoAlignTimeOffsets} from './autoAlign'
export {
  buildFlattenStaffRows,
  collectHighlightIdsAtTime,
  createNotePassMap,
  hasTimedFlattenSlots,
  readPassTime,
  readTimeArray,
  resetNotePassMap,
  validateFlattenStaffLayout,
  writePassTime,
  writeSlotTime,
} from './flattenSlots'
export {
  MAX_SYNC_SECONDS,
  DEFAULT_PX_PER_SECOND,
  DEFAULT_TIME_PROP,
} from './constants'
export type {
  TimeOffsetAction,
  TimeOffsetEditorProps,
  FlattenStaffRow,
  FlattenSlotItem,
  NotePassMap,
} from './types'
