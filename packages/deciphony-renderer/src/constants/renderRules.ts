/**
 * 四类附属符号渲染规则：只维护位置/渲染方式，渲染器按 rule.kind 分发，不对每种符号写 if/switch。
 * 偏移量单位为「× measureHeight」。
 * 未实现的符号不写规则即可；不要批量生成占位项。
 */
import {
    DoubleMeasureAffiliatedSymbolNameEnum,
    DoubleNoteAffiliatedSymbolNameEnum,
    SingleMeasureAffiliatedSymbolNameEnum,
    SingleNoteAffiliatedSymbolNameEnum,
} from '@/enums/musicScoreEnum';

/** 相对小节高度的二维偏移 */
export type AffiliatedOffsetRule = {
    vertical: number;
    horizontal: number;
};

/** 渲染策略（固定几种，与符号名解耦） */
export type AffiliatedRenderKind = 'skin' | 'slur' | 'volta';

export type SingleNoteAffiliatedRule = AffiliatedOffsetRule & {
    kind: AffiliatedRenderKind;
    /** kind=skin 时查找皮肤；默认与枚举值同名 */
    skinKey?: string;
};

export type DoubleNoteAffiliatedRule = {
    kind: AffiliatedRenderKind;
    skinKey?: string;
    start: AffiliatedOffsetRule;
    end: AffiliatedOffsetRule;
};

export type DoubleMeasureAffiliatedRule = {
    kind: AffiliatedRenderKind;
    /** 贴小节 upper=上方 lower=下方 */
    type: 'upper' | 'lower';
    /** 与小节顶/底的间距（× measureHeight） */
    span: number;
    start: { horizontal: number };
    end: { horizontal: number };
};

export type SingleMeasureAffiliatedRule = {
    kind: AffiliatedRenderKind;
    placement: 'start' | 'end';
    align: 'center' | 'right';
    vertical: number;
    horizontal: number;
    skinKey?: string;
};

/** 单音符附属：符号中心对齐音符头中心，再按 vertical/horizontal 偏移 */
export const SingleNoteAffiliatedSymbolRenderRule: Partial<
    Record<SingleNoteAffiliatedSymbolNameEnum, SingleNoteAffiliatedRule>
> = {
    // 示例（实现时取消注释并补皮肤）：
    // [SingleNoteAffiliatedSymbolNameEnum.Staccato_above]: {
    //     kind: 'skin',
    //     skinKey: 'staccato_above',
    //     vertical: -1 / 8,
    //     horizontal: 0,
    // },
};

/** 单小节附属（measure.affiliatedSymbols）；反复符号走 measure.startRepeat/endRepeat */
export const SingleMeasureAffiliatedSymbolRenderRule: Partial<
    Record<SingleMeasureAffiliatedSymbolNameEnum, SingleMeasureAffiliatedRule>
> = {};

/** 双音符附属：起点/终点锚定 startId/endId 音符头 */
export const DoubleNoteAffiliatedSymbolRenderRule: Partial<
    Record<DoubleNoteAffiliatedSymbolNameEnum, DoubleNoteAffiliatedRule>
> = {
    [DoubleNoteAffiliatedSymbolNameEnum.slur]: {
        kind: 'slur',
        start: {vertical: 0, horizontal: 0},
        end: {vertical: 0, horizontal: 0},
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
export const DoubleMeasureAffiliatedSymbolRenderRule: Partial<
    Record<DoubleMeasureAffiliatedSymbolNameEnum, DoubleMeasureAffiliatedRule>
> = {
    [DoubleMeasureAffiliatedSymbolNameEnum.volta]: {
        kind: 'volta',
        type: 'upper',
        span: 0,
        start: {horizontal: 0},
        end: {horizontal: 0},
    },
};
