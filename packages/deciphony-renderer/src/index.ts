import MusicScoreVue from './components/musicScore.vue'
import ChordVue from './components/chord.vue'

export default MusicScoreVue
export {ChordVue as Chord}

/** 曲谱数据结构（MusicScore、Measure、NoteSymbol 等） */
export type * from './types/MusicScoreType'

/** 渲染通用类型（VDom、Skin、Frame 等） */
export type * from './types/common'

/** 扩展贡献声明 */
export type * from './types/extension'
export {mergeSlotConfig} from './render/mergeSlotConfig'
export {fanoutExtensionEvent} from './render/fanoutExtensionEvent'

/** 曲谱相关枚举 */
export * from './enums/musicScoreEnum'

/** 五线谱 / 简谱 / 鼓谱皮肤 key 枚举 */
export {StandardStaffSkinKeyEnum} from './standardStaff/enums/standardStaffSkinKeyEnum'
export {NumberNotationSkinKeyEnum} from './numberNotation/enums/numberNotationSkinKeyEnum'
export {DrumNotationSkinKeyEnum} from './drumNotation/enums/drumNotationSkinKeyEnum'

/** 小节音符：扁平数组或鼓谱上下声部 */
export {getMeasureNoteList, getMeasureSlots, getMeasureVoices, isMeasureNoteVoices} from './utils/measureNotes'

/** 默认皮肤与 content 模板 */
export {defaultSkin} from './skins/defaultSkin'
export {applySkinContentTemplate} from './render/skinContent'
export {
  getNoteHeadSkinKey,
  getRestSkinKey,
  getNoteTailSkinKey,
} from './standardStaff/render/utils/skinKey'
export {
  getSyllableSkinKey,
  getReduceLineSkinKey,
} from './numberNotation/render/utils/skinKey'

/** 五线谱音符位 / 休止符位判别 */
export {
  isNoteNumberSymbol,
  isNoteRest,
  isNoteSymbol,
  isStaffSlot,
  slotIsNoteNumber,
  slotIsNoteRest,
  slotIsNoteSymbol,
  slotSymbol,
} from './standardStaff/render/utils/staffSlot'
export type {MeasureNoteSymbol} from './types/MusicScoreType'

/** 顶层 svg 事件：由 DOM 命中解析 VDom */
export {getHitElement, resolveVDomFromEvent} from './render/resolveVDomFromEvent'

/** 简谱连音线几何（两端圆弧 + 中间横线） */
export {isNumberNotationSlur, numberNotationSlurGeom} from './render/slurGeom'

/** Frame / 附属符号 data 到当前 vDom 的即时对照（不跑整谱布局） */
export {
    arpeggioVDomPatch,
    mirrorArpeggioData,
    mirrorBendData,
    mirrorFrame,
    mirrorPedalData,
    mirrorPitchData,
    mirrorSlurData,
    mirrorStrummingData,
    mirrorVoltaData,
    pedalVDomPatch,
    pitchVDomPatch,
    slurVDomPatch,
    strummingVDomPatch,
} from './render/liveMirror'
export type {
    ArpeggioMirror,
    FrameMirror,
    PedalMirror,
    PitchMirror,
    SlurMirror,
    StrummingMirror,
    VoltaMirror,
} from './render/liveMirror'

export {assignVDomPatch, patchVDomByTargetId} from './render/update'

/** VDom 顶层 g 的语义键 / DOM id 与查找 */
export {
  findElementByVdomDomId,
  findVDomByDomId,
  findVDomBySelectionKey,
  vdomDomId,
  vdomSelectionKey,
} from './render/vdomDomId'

/** 拍号工具（beats 换算、标签、MusicXML） */
export {
  beatsToTimeSignatureType,
  FRACTION_TIME_SIGNATURE_KEYS,
  TIME_SIGNATURE_TYPES_ORDERED,
  timeSignatureSymbolToType,
  timeSignatureTypeToBeats,
  timeSignatureTypeToLabel,
  timeSignatureTypeToMusicXml,
} from './utils/timeSignature'
export type {FractionTimeSignatureKey} from './utils/timeSignature'

