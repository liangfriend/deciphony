/**
 * 附属符号渲染规则：只维护位置/渲染方式，渲染器按 rule.kind 分发，不对每种符号写 if/switch。
 * 偏移量单位为「× measureHeight」。
 * 未实现的符号不写规则即可；不要批量生成占位项。
 *
 * 锚点约定：
 * - 音符附属：相对音符几何中心；简谱可用 numberNotationAnchor 改到数字包围盒边缘
 *   （top/bottom 含八度点，bottom 还含减时线；bottom/right 再加待绘符号高/宽）
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

/**
 * 简谱音符附属锚点边（相对数字 + 八度点 / 减时线等包围盒；缺省仍用几何中心）。
 * - top / left：贴对应边
 * - bottom：底边 + 待绘符号高度
 * - right：右边 + 待绘符号宽度
 */
export type NumberNotationAnchor = 'top' | 'left' | 'right' | 'bottom';

/** 渲染策略（固定几种，与符号名解耦） */
export type AffiliatedRenderKind =
    | 'skin'
    | 'slur'
    | 'volta'
    | 'arpeggio'
    | 'strumming'
    | 'pedal'
    | 'pitch'
    | 'trill'
    | 'hairpin';

export type SingleNoteAffiliatedRule = AffiliatedOffsetRule & {
  kind: AffiliatedRenderKind;
  /** kind=skin 时查找皮肤；默认与枚举值同名 */
  skinKey?: string;
  /** 仅简谱：相对数字音符包围盒边缘；其它谱种忽略 */
  numberNotationAnchor?: NumberNotationAnchor;
};

export type DoubleNoteAffiliatedRule = {
  kind: AffiliatedRenderKind;
  skinKey?: string;
  start: AffiliatedOffsetRule;
  end: AffiliatedOffsetRule;
  /** 仅简谱：起止共用的包围盒边缘锚点；其它谱种忽略 */
  numberNotationAnchor?: NumberNotationAnchor;
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

/** 单音符附属：符号中心对齐音符头中心，再按 vertical/horizontal 偏移（× measureHeight） */
export const SingleNoteAffiliatedSymbolRenderRule: Partial<
    Record<SingleNoteAffiliatedSymbolNameEnum, SingleNoteAffiliatedRule>
> = {
  // —— 奏法（音符上方）——
  [SingleNoteAffiliatedSymbolNameEnum.Accent_above]: {
    kind: 'skin', skinKey: 'acccent_above', vertical: -0.35, horizontal: 0,
    numberNotationAnchor: 'top',
  },
  [SingleNoteAffiliatedSymbolNameEnum.Staccato_above]: {
    kind: 'skin', skinKey: 'staccato_above', vertical: -0.28, horizontal: 0,
    numberNotationAnchor: 'top',
  },
  [SingleNoteAffiliatedSymbolNameEnum.Staccatissimo_above]: {
    kind: 'skin', skinKey: 'staccatissimo_above', vertical: -0.35, horizontal: 0,
    numberNotationAnchor: 'top',
  },
  [SingleNoteAffiliatedSymbolNameEnum.Tenuto_above]: {
    kind: 'skin', skinKey: 'tenuto_above', vertical: -0.28, horizontal: 0,
    numberNotationAnchor: 'top',
  },
  [SingleNoteAffiliatedSymbolNameEnum.Loure_above]: {
    kind: 'skin', skinKey: 'loure_above', vertical: -0.32, horizontal: 0,
    numberNotationAnchor: 'top',
  },
  [SingleNoteAffiliatedSymbolNameEnum.Marcato_above]: {
    kind: 'skin', skinKey: 'marcato_above', vertical: -0.38, horizontal: 0,
    numberNotationAnchor: 'top',
  },
  [SingleNoteAffiliatedSymbolNameEnum.Accent_staccato_above]: {
    kind: 'skin', skinKey: 'accent_staccato_above', vertical: -0.38, horizontal: 0,
    numberNotationAnchor: 'top',
  },
  [SingleNoteAffiliatedSymbolNameEnum.Marcato_staccato_above]: {
    kind: 'skin', skinKey: 'marcato_staccato_above', vertical: -0.4, horizontal: 0,
    numberNotationAnchor: 'top',
  },
  [SingleNoteAffiliatedSymbolNameEnum.Marcato_tenuto_above]: {
    kind: 'skin', skinKey: 'marcato_tenuto_above', vertical: -0.4, horizontal: 0,
    numberNotationAnchor: 'top',
  },
  [SingleNoteAffiliatedSymbolNameEnum.Staccatissimo_stroke_above]: {
    kind: 'skin', skinKey: 'staccatissimo_stroke_above', vertical: -0.35, horizontal: 0,
    numberNotationAnchor: 'top',
  },
  [SingleNoteAffiliatedSymbolNameEnum.Staccatissimo_wedge_above]: {
    kind: 'skin', skinKey: 'staccatissimo_wedge_above', vertical: -0.35, horizontal: 0,
    numberNotationAnchor: 'top',
  },
  [SingleNoteAffiliatedSymbolNameEnum.Stress_above]: {
    kind: 'skin', skinKey: 'stress_above', vertical: -0.35, horizontal: 0,
    numberNotationAnchor: 'top',
  },
  [SingleNoteAffiliatedSymbolNameEnum.Tenuto_accent_above]: {
    kind: 'skin', skinKey: 'tenuto_accent_above', vertical: -0.38, horizontal: 0,
    numberNotationAnchor: 'top',
  },
  [SingleNoteAffiliatedSymbolNameEnum.Unstress_above]: {
    kind: 'skin', skinKey: 'unstress_above', vertical: -0.35, horizontal: 0,
    numberNotationAnchor: 'top',
  },
  [SingleNoteAffiliatedSymbolNameEnum.Open]: {
    kind: 'skin', skinKey: 'open', vertical: -0.4, horizontal: 0,
    numberNotationAnchor: 'top',
  },
  [SingleNoteAffiliatedSymbolNameEnum.Muted]: {
    kind: 'skin', skinKey: 'muted', vertical: -0.4, horizontal: 0,
    numberNotationAnchor: 'top',
  },
  [SingleNoteAffiliatedSymbolNameEnum.Harmonic]: {
    kind: 'skin', skinKey: 'harmonic', vertical: -0.4, horizontal: 0,
    numberNotationAnchor: 'top',
  },
  [SingleNoteAffiliatedSymbolNameEnum.Up_bow]: {
    kind: 'skin', skinKey: 'up_bow', vertical: -0.45, horizontal: 0,
    numberNotationAnchor: 'top',
  },
  [SingleNoteAffiliatedSymbolNameEnum.Down_bow]: {
    kind: 'skin', skinKey: 'down_bow', vertical: -0.45, horizontal: 0,
    numberNotationAnchor: 'top',
  },
  [SingleNoteAffiliatedSymbolNameEnum.Breath]: {
    kind: 'skin', skinKey: 'breath', vertical: -0.45, horizontal: 0,
    numberNotationAnchor: 'top',
  },
  // —— 装饰音记号 ——
  [SingleNoteAffiliatedSymbolNameEnum.Turn]: {
    kind: 'skin', skinKey: 'turn', vertical: -0.55, horizontal: 0,
    numberNotationAnchor: 'top',
  },
  [SingleNoteAffiliatedSymbolNameEnum.InvertedTurn]: {
    kind: 'skin', skinKey: 'invertedTurn', vertical: -0.55, horizontal: 0,
    numberNotationAnchor: 'top',
  },
  [SingleNoteAffiliatedSymbolNameEnum.Trill]: {
    kind: 'skin', skinKey: 'trill', vertical: -0.55, horizontal: 0,
    numberNotationAnchor: 'top',
  },
  [SingleNoteAffiliatedSymbolNameEnum.ShortTrill]: {
    kind: 'skin', skinKey: 'shortTrill', vertical: -0.5, horizontal: 0,
    numberNotationAnchor: 'top',
  },
  [SingleNoteAffiliatedSymbolNameEnum.Mordent]: {
    kind: 'skin', skinKey: 'mordent', vertical: -0.5, horizontal: 0,
    numberNotationAnchor: 'top',
  },
  // —— 强弱记号（通常在谱表下方；枚举值 ppp，皮肤键 dyn_ppp）——
  [SingleNoteAffiliatedSymbolNameEnum.PPP]: {
    kind: 'skin', skinKey: 'dyn_ppp', vertical: 0.85, horizontal: 0,
    numberNotationAnchor: 'bottom',
  },
  [SingleNoteAffiliatedSymbolNameEnum.PP]: {
    kind: 'skin', skinKey: 'dyn_pp', vertical: 0.85, horizontal: 0,
    numberNotationAnchor: 'bottom',
  },
  [SingleNoteAffiliatedSymbolNameEnum.P]: {
    kind: 'skin', skinKey: 'dyn_p', vertical: 0.85, horizontal: 0,
    numberNotationAnchor: 'bottom',
  },
  [SingleNoteAffiliatedSymbolNameEnum.MP]: {
    kind: 'skin', skinKey: 'dyn_mp', vertical: 0.85, horizontal: 0,
    numberNotationAnchor: 'bottom',
  },
  [SingleNoteAffiliatedSymbolNameEnum.MF]: {
    kind: 'skin', skinKey: 'dyn_mf', vertical: 0.85, horizontal: 0,
    numberNotationAnchor: 'bottom',
  },
  [SingleNoteAffiliatedSymbolNameEnum.F]: {
    kind: 'skin', skinKey: 'dyn_f', vertical: 0.85, horizontal: 0,
    numberNotationAnchor: 'bottom',
  },
  [SingleNoteAffiliatedSymbolNameEnum.FF]: {
    kind: 'skin', skinKey: 'dyn_ff', vertical: 0.85, horizontal: 0,
    numberNotationAnchor: 'bottom',
  },
  [SingleNoteAffiliatedSymbolNameEnum.FFF]: {
    kind: 'skin', skinKey: 'dyn_fff', vertical: 0.85, horizontal: 0,
    numberNotationAnchor: 'bottom',
  },
  [SingleNoteAffiliatedSymbolNameEnum.FP]: {
    kind: 'skin', skinKey: 'dyn_fp', vertical: 0.85, horizontal: 0,
    numberNotationAnchor: 'bottom',
  },
  [SingleNoteAffiliatedSymbolNameEnum.PF]: {
    kind: 'skin', skinKey: 'dyn_pf', vertical: 0.85, horizontal: 0,
    numberNotationAnchor: 'bottom',
  },
  [SingleNoteAffiliatedSymbolNameEnum.SF]: {
    kind: 'skin', skinKey: 'dyn_sf', vertical: 0.85, horizontal: 0,
    numberNotationAnchor: 'bottom',
  },
  [SingleNoteAffiliatedSymbolNameEnum.SFZ]: {
    kind: 'skin', skinKey: 'dyn_sfz', vertical: 0.85, horizontal: 0,
    numberNotationAnchor: 'bottom',
  },
  // SFF：SMuFL 无独立字形，不配规则
  [SingleNoteAffiliatedSymbolNameEnum.SFFZ]: {
    kind: 'skin', skinKey: 'dyn_sffz', vertical: 0.85, horizontal: 0,
    numberNotationAnchor: 'bottom',
  },
  [SingleNoteAffiliatedSymbolNameEnum.SFP]: {
    kind: 'skin', skinKey: 'dyn_sfp', vertical: 0.85, horizontal: 0,
    numberNotationAnchor: 'bottom',
  },
  [SingleNoteAffiliatedSymbolNameEnum.RFZ]: {
    kind: 'skin', skinKey: 'dyn_rfz', vertical: 0.85, horizontal: 0,
    numberNotationAnchor: 'bottom',
  },
  [SingleNoteAffiliatedSymbolNameEnum.RF]: {
    kind: 'skin', skinKey: 'dyn_rf', vertical: 0.85, horizontal: 0,
    numberNotationAnchor: 'bottom',
  },
  [SingleNoteAffiliatedSymbolNameEnum.FZ]: {
    kind: 'skin', skinKey: 'dyn_fz', vertical: 0.85, horizontal: 0,
    numberNotationAnchor: 'bottom',
  },
};

/** 单小节附属（measure.affiliatedSymbols）；反复符号走 measure.startRepeat/endRepeat */
export const SingleMeasureAffiliatedSymbolRenderRule: Partial<
    Record<SingleMeasureAffiliatedSymbolNameEnum, SingleMeasureAffiliatedRule>
> = {};

/** 双音符附属：startId/endId 为 NotesInfo.id / NotesNumberInfo.id */
export const DoubleNoteAffiliatedSymbolRenderRule: Partial<
    Record<DoubleNoteAffiliatedSymbolNameEnum, DoubleNoteAffiliatedRule>
> = {
  /** 起止不在同一单谱表时 split；朝向按符干；简谱 top 两端对齐到更高一侧 */
  [DoubleNoteAffiliatedSymbolNameEnum.Slur]: {
    kind: 'slur',
    start: {vertical: -0.1, horizontal: 0},
    end: {vertical: -0.1, horizontal: 0},
    numberNotationAnchor: 'top',
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
 * 前奏括号 kind=skin：锚点为符号中心；vertical=-1/2 垂直居中于小节；
 * 右侧 horizontal 更大，跨过音符列。
 */
export const SingleSlotAffiliatedSymbolRenderRule: Partial<
    Record<SingleSlotAffiliatedSymbolNameEnum, SingleSlotAffiliatedRule>
> = {
  [SingleSlotAffiliatedSymbolNameEnum.Arpeggio]: {
    kind: 'arpeggio',
    offset: {vertical: 0, horizontal: -1 / 8},
  },
  [SingleSlotAffiliatedSymbolNameEnum.arpeggio_straight]: {
    kind: 'arpeggio',
    offset: {vertical: 0, horizontal: -1 / 8},
  },
  [SingleSlotAffiliatedSymbolNameEnum.Strumming]: {
    kind: 'strumming',
    offset: {vertical: 0, horizontal: -1 / 4},
  },
  [SingleSlotAffiliatedSymbolNameEnum.Prelude_bracket_left]: {
    kind: 'skin',
    skinKey: 'prelude_bracket_left',
    offset: {vertical: -1 / 2, horizontal: -1 / 8},
  },
  [SingleSlotAffiliatedSymbolNameEnum.Prelude_bracket_right]: {
    kind: 'skin',
    skinKey: 'prelude_bracket_right',
    // 右侧间距更大：跨过符头后再落括号中心
    offset: {vertical: -1 / 2, horizontal: 3 / 8},
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
  [DoubleSlotAffiliatedSymbolNameEnum.Trill_line]: {
    kind: 'trill',
    // y = 波浪线中线，谱表上方；终点延到结束音符头右缘
    start: {vertical: -1.3, horizontal: 0},
    end: {vertical: -1.3, horizontal: 0.25},
  },
  [DoubleSlotAffiliatedSymbolNameEnum.Hairpin]: {
    kind: 'hairpin',
    // y = 楔形 / 虚线中线，谱表下方（与力度记号同高）
    start: {vertical: 0.35, horizontal: 0},
    end: {vertical: 0.35, horizontal: 0.25},
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
