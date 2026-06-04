/**
 * 四类附属符号渲染规则：只维护位置/渲染方式，渲染器按 rule.kind 分发，不对每种符号写 if/switch。
 * 偏移量单位为「× measureHeight」。
 * 未实现的符号不写规则即可；不要批量生成占位项。
 */
import { DoubleMeasureAffiliatedSymbolNameEnum, DoubleNoteAffiliatedSymbolNameEnum, } from '@/enums/musicScoreEnum';
/** 单音符附属：符号中心对齐音符头中心，再按 vertical/horizontal 偏移 */
export const SingleNoteAffiliatedSymbolRenderRule = {
// 示例（实现时取消注释并补皮肤）：
// [SingleNoteAffiliatedSymbolNameEnum.Staccato_above]: {
//     kind: 'skin',
//     skinKey: 'staccato_above',
//     vertical: -1 / 8,
//     horizontal: 0,
// },
};
/** 单小节附属（measure.affiliatedSymbols）；反复符号走 measure.startRepeat/endRepeat */
export const SingleMeasureAffiliatedSymbolRenderRule = {};
/** 双音符附属：startId/endId 为 NotesInfo.id（五线谱）或 NotesNumberInfo.id（简谱），与 noteHead.targetId 一致 */
export const DoubleNoteAffiliatedSymbolRenderRule = {
    [DoubleNoteAffiliatedSymbolNameEnum.slur]: {
        kind: 'slur',
        start: { vertical: 0, horizontal: 0 },
        end: { vertical: 0, horizontal: 0 },
    },
    // 示例（实现时取消注释并补皮肤）：
    // [DoubleNoteAffiliatedSymbolNameEnum.Crescendo_hairpin]: {
    //     kind: 'skin',
    //     skinKey: 'crescendo_hairpin',
    //     start: {vertical: -1 / 8, horizontal: 0},
    //     end: {vertical: -1 / 8, horizontal: 0},
    // },
};
/** 双小节附属：锚定起止小节 */
export const DoubleMeasureAffiliatedSymbolRenderRule = {
    [DoubleMeasureAffiliatedSymbolNameEnum.volta]: {
        kind: 'volta',
        type: 'upper',
        span: 0,
        start: { horizontal: 0 },
        end: { horizontal: 0 },
    },
};
