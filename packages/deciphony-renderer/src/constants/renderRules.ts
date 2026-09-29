/**
 * 附属符号渲染规则：只维护位置/渲染方式，渲染器按 rule.kind 分发，不对每种符号写 if/switch。
 * 偏移量单位为「× measureHeight」。
 * 未实现的符号不写规则即可；不要批量生成占位项。
 *
 * 锚点约定：
 * - 音符附属：相对音符中心（简谱/tab 顶边）
 * - slot 附属：默认 x=slot 列起点，y=小节底边；相对端点为像素偏移（默认琶音/扫弦 end.y=-measureHeight 正好穿过整节）
 * - 小节附属：相对小节框
 */
import {
    DoubleMeasureAffiliatedSymbolNameEnum,
    DoubleNoteAffiliatedSymbolNameEnum,
    DoubleSlotAffiliatedSymbolNameEnum,
    SingleMeasureAffiliatedSymbolNameEnum,
    SingleNoteAffiliatedSymbolNameEnum,
    SingleSlotAffiliatedSymbolNameEnum,
} from '@/enums/musicScoreEnum';

/** 相对小节高度的二维偏移 */
export type AffiliatedOffsetRule = {
    vertical: number;
    horizontal: number;
};

/** 渲染策略（固定几种，与符号名解耦） */
export type AffiliatedRenderKind =
    | 'skin'
    | 'slur'
    | 'volta'
    | 'arpeggio'
    | 'strumming'
    | 'pedal'
    | 'pitch';

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

/** 单 slot：挂在宿主 MeasureNoteSlot.affiliatedSymbols */
export type SingleSlotAffiliatedRule = {
    kind: AffiliatedRenderKind;
    skinKey?: string;
    /** 相对 slot 起点 / 小节底（或 kind 自定 y） */
    offset: AffiliatedOffsetRule;
};

/** 双 slot：起止列；默认 x=各 slot 起点，y=各自小节底 */
export type DoubleSlotAffiliatedRule = {
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

/** 双音符附属：startId/endId 为 NotesInfo.id / NotesNumberInfo.id */
export const DoubleNoteAffiliatedSymbolRenderRule: Partial<
    Record<DoubleNoteAffiliatedSymbolNameEnum, DoubleNoteAffiliatedRule>
> = {
    [DoubleNoteAffiliatedSymbolNameEnum.Slur]: {
        kind: 'slur',
        start: {vertical: 0, horizontal: 0},
        end: {vertical: 0, horizontal: 0},
    },
    // 示例：
    // [DoubleNoteAffiliatedSymbolNameEnum.Crescendo_hairpin]: {
    //     kind: 'skin',
    //     skinKey: 'crescendo_hairpin',
    //     start: {vertical: -1 / 8, horizontal: 0},
    //     end: {vertical: -1 / 8, horizontal: 0},
    // },
};

/**
 * 单 slot 附属：默认 x=slot 列起点，y=小节底；
 * arpeggio/strumming 起止同锚点，默认 relativeEnd.y=-measureHeight 垂直穿过整节。
 */
export const SingleSlotAffiliatedSymbolRenderRule: Partial<
    Record<SingleSlotAffiliatedSymbolNameEnum, SingleSlotAffiliatedRule>
> = {
    [SingleSlotAffiliatedSymbolNameEnum.Arpeggio]: {
        kind: 'arpeggio',
        offset: {vertical: 0, horizontal: -1 / 4},
    },
    [SingleSlotAffiliatedSymbolNameEnum.arpeggio_straight]: {
        kind: 'arpeggio',
        offset: {vertical: 0, horizontal: -1 / 4},
    },
    [SingleSlotAffiliatedSymbolNameEnum.Strumming]: {
        kind: 'strumming',
        offset: {vertical: 0, horizontal: -1 / 4},
    },
};

/** 双 slot 附属：x=各 slot 起点，y=小节底 + vertical */
export const DoubleSlotAffiliatedSymbolRenderRule: Partial<
    Record<DoubleSlotAffiliatedSymbolNameEnum, DoubleSlotAffiliatedRule>
> = {
    [DoubleSlotAffiliatedSymbolNameEnum.Pedal]: {
        kind: 'pedal',
        start: {vertical: 1 / 2, horizontal: 0},
        end: {vertical: 1 / 2, horizontal: 0},
    },
    [DoubleSlotAffiliatedSymbolNameEnum.Pitch_up]: {
        kind: 'pitch',
        // 相对小节底向上（八度记号通常在谱表上方）
        start: {vertical: -1.2, horizontal: 0},
        end: {vertical: -1.2, horizontal: 0},
    },
    [DoubleSlotAffiliatedSymbolNameEnum.Pitch_down]: {
        kind: 'pitch',
        start: {vertical: 1 / 2, horizontal: 0},
        end: {vertical: 1 / 2, horizontal: 0},
    },
};

/** 双小节附属：锚定起止小节 */
export const DoubleMeasureAffiliatedSymbolRenderRule: Partial<
    Record<DoubleMeasureAffiliatedSymbolNameEnum, DoubleMeasureAffiliatedRule>
> = {
    [DoubleMeasureAffiliatedSymbolNameEnum.Volta]: {
        kind: 'volta',
        type: 'upper',
        span: 0,
        start: {horizontal: 0},
        end: {horizontal: 0},
    },
};
