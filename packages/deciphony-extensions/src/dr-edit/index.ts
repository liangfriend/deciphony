/** dr-edit 锚点增删 API（谱表 / 小节） + Tab 音符 API */
export * from './edit-util'
export {
  TAB4_STRING_COUNT,
  TAB6_STRING_COUNT,
  appendTabNoteInfo,
  clampTabFret,
  clampTabRegion,
  createTabNote,
  createTabNoteInfo,
  createTabRest,
  ensureTabNoteChord,
  insertTabNote,
  insertTabRest,
  isTabGeometryInfo,
  isTabHeadInfo,
  locateTabBendById,
  locateTabNoteInfoById,
  setSlurType,
  setTabNoteChord,
  setTabNoteInfoBeamType,
  setTabNoteInfoBend,
  setTabNoteInfoRegion,
  setTabNoteInfoRegionRange,
  setTabNoteInfoValue,
  setTabNoteSlap,
  tabStringCount
} from './score-builder/tabNote'
