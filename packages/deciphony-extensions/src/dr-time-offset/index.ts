export {default as TimeOffsetEditor} from './components/TimeOffsetEditor.vue'
export {autoAlignTimeOffsets} from './autoAlign'
export {createAnchorWarp} from './anchorWarp'
export type {AnchorWarp, AnchorWarpItem} from './anchorWarp'
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
  MIN_PX_PER_SECOND,
  MAX_PX_PER_SECOND,
} from './constants'
export type {
  TimeOffsetAction,
  TimeOffsetEditorProps,
  FlattenStaffRow,
  FlattenSlotItem,
  NotePassMap,
} from './types'

