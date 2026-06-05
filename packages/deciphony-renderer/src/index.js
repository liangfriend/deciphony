import MusicScoreVue from './components/musicScore.vue';
export default MusicScoreVue;
/** 曲谱相关枚举 */
export * from './enums/musicScoreEnum';
/** 五线谱 / 简谱皮肤 key 枚举 */
export { StandardStaffSkinKeyEnum } from './standardStaff/enums/standardStaffSkinKeyEnum';
export { NumberNotationSkinKeyEnum } from './numberNotation/enums/numberNotationSkinKeyEnum';
/** 五线谱音符位 / 休止符位判别 */
export { isNoteRest, isNoteSymbol, isStaffSlot } from './standardStaff/render/utils/staffSlot';
/** 顶层 svg 事件：由 DOM 命中解析 VDom */
export { getHitElement, resolveVDomFromEvent } from './render/resolveVDomFromEvent';
/** VDom 顶层 g 的语义键 / DOM id 与查找 */
export { findElementByVdomDomId, findVDomByDomId, findVDomBySelectionKey, vdomDomId, vdomSelectionKey, } from './render/vdomDomId';
