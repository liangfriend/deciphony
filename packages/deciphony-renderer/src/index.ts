import MusicScoreVue from './components/musicScore.vue'

export default MusicScoreVue

/** 曲谱数据结构（MusicScore、Measure、NoteSymbol 等） */
export type * from './types/MusicScoreType'

/** 渲染通用类型（VDom、Skin、Frame 等） */
export type * from './types/common'

/** 曲谱相关枚举 */
export * from './enums/musicScoreEnum'

/** 五线谱 / 简谱皮肤 key 枚举 */
export {StandardStaffSkinKeyEnum} from './standardStaff/enums/standardStaffSkinKeyEnum'
export {NumberNotationSkinKeyEnum} from './numberNotation/enums/numberNotationSkinKeyEnum'

/** 五线谱音符位 / 休止符位判别 */
export {isNoteRest, isNoteSymbol, isStaffSlot} from './standardStaff/render/utils/staffSlot'

/** 顶层 svg 事件：由 DOM 命中解析 VDom */
export {getHitElement, resolveVDomFromEvent} from './render/resolveVDomFromEvent'


