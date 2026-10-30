/** 只给生成总谱 .sj 的脚本用，避开 renderer 入口里的 Vue 组件。 */
export * from '../../deciphony-renderer/src/enums/musicScoreEnum.ts'
export {
  getMeasureNoteList,
  getMeasureSlots,
  isMeasureNoteVoices,
} from '../../deciphony-renderer/src/utils/measureNotes.ts'
export {
  isNoteNumberSymbol,
  isNoteRest,
  isNoteSymbol,
  slotSymbol,
} from '../../deciphony-renderer/src/standardStaff/render/utils/staffSlot.ts'
