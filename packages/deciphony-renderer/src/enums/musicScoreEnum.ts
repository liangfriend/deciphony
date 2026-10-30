// 曲谱展示模式

export enum MusicScoreTypeEnum {
  StandardStaff = 1,        // 五线谱

  NumberNotation = 2,      // 简谱（数字谱）

  /** 吉他 TAB（6 弦）；渲染用 tab6 皮肤。数值 3 兼容旧 Tab6 */
  Guitar = 3,

  DrumNotation = 4,          // 鼓谱

  /** 尤克里里 TAB（4 弦）；渲染用 tab4 皮肤。数值 5 兼容旧 Tab4 */
  Ukulele = 5,

  /** 五弦贝斯 TAB；渲染用 tab5 皮肤。数值 6 兼容旧 Tab5 */
  Bass5 = 6,

  /** 四弦贝斯 TAB；渲染用 tab4 皮肤（与尤克里里同几何，乐器语义不同） */
  Bass4 = 7,

  /** 六弦贝斯 TAB；渲染用 tab6 皮肤（与吉他同几何，乐器语义不同） */
  Bass6 = 8,
}

/** 指板类谱（吉他 / 尤克里里 / 贝斯）——扩展里判断「是不是 tab 谱」用这个 */
export function isFretboardScoreType(type: MusicScoreTypeEnum | undefined | null): boolean {
  return (
      type === MusicScoreTypeEnum.Guitar
      || type === MusicScoreTypeEnum.Ukulele
      || type === MusicScoreTypeEnum.Bass4
      || type === MusicScoreTypeEnum.Bass5
      || type === MusicScoreTypeEnum.Bass6
  )
}

/** 指板谱弦数：决定用哪套 tab 皮肤 / 渲染几何 */
export function fretboardStringCount(type: MusicScoreTypeEnum | undefined | null): 4 | 5 | 6 {
  if (type === MusicScoreTypeEnum.Ukulele || type === MusicScoreTypeEnum.Bass4) return 4
  if (type === MusicScoreTypeEnum.Bass5) return 5
  return 6
}

/** SkinPack 中的 tab 键（按弦数，一几何多用） */
export type TabSkinPackKey = 'tab4' | 'tab5' | 'tab6'

export function tabSkinPackKeyForType(type: MusicScoreTypeEnum | undefined | null): TabSkinPackKey | undefined {
  if (!isFretboardScoreType(type)) return undefined
  const n = fretboardStringCount(type)
  return n === 4 ? 'tab4' : n === 5 ? 'tab5' : 'tab6'
}


// 小节线类型

export enum BarlineTypeEnum {

  Single_barline = 'single_barline',

  Double_barline = 'double_barline',

  StartRepeat_barline = 'startRepeat_barline',

  EndRepeat_barline = 'endRepeat_barline',

  Dashed_barline = 'dashed_barline',

  Final_barline = 'final_barline',

  Start_end_repeat_barline = 'start_end_repeat_barline',

  Dotted_barline = 'dotted_barline',

  Reverse_barline = 'reverse_barline',

  Heavy_barline = 'heavy_barline',

  Heavy_double_barline = 'heavy_double_barline',

}


// 谱号

export enum ClefTypeEnum {

  Treble = 'treble',

  Bass = 'bass',

  Alto = 'alto',

  Tenor = 'tenor', // 次中音谱号，比alto还低一点

  /** 仅展示用：标记为六线/四线 tab 谱，不参与音高换算 */
  Tab = 'tab',

  /** 鼓谱谱号（两个矩形），不参与音高换算 */
  Percussion = 'percussion',

}


// 调号（升号调 / 降号调，与皮肤 Sharp / Flat 对应）

export enum KeySignatureTypeEnum {

  C = 'C',

  C_sharp = 'C_sharp',

  D_flat = 'D_flat',

  D = 'D',

  E_flat = 'E_flat',

  E = 'E',

  F = 'F',

  F_sharp = 'F_sharp',

  G_flat = 'G_flat',

  G = 'G',

  A_flat = 'A_flat',

  A = 'A',

  B_flat = 'B_flat',

  B = 'B',

  C_flat = 'C_flat',

}


// 拍号

export enum TimeSignatureTypeEnum {

  '2_4' = '2_4',

  '3_4' = '3_4',

  '4_4' = '4_4',

  '5_4' = '5_4',

  '6_4' = '6_4',

  '3_8' = '3_8',

  '4_8' = '4_8',

  '5_8' = '5_8',

  '6_8' = '6_8',

  '7_8' = '7_8',

  '9_8' = '9_8',

  '12_8' = '12_8',

  Common = 'common',

  Cut = 'cut',

  '2_2' = '2_2',

  '3_2' = '3_2',

  '4_2' = '4_2',

}


// // 跨小节符号类型
//
// export enum SpanSymbolTypeEnum {
//
//   DoubleNote = 1, // 双音符型 如连音线、通过起始，结束音符定位   符杠beam不属于跨小节符号，beam属于一种特殊逻辑
//
//   DoubleMeasure// 双小节型 如volta(反复房子符号) 通过起始，结束小节定位
//
// }


// 跨小节符号名称

export enum SpanSymbolNameEnum {

  Volta = 1,

  slur,

}


export enum NoteSymbolTypeEnum {

  Note = 1, // 音符

  Rest // 休止符

}


/** 双音符附属型符号名称（如连音线 slur；起止锚定 NotesInfo / NotesNumberInfo） */

export enum DoubleNoteAffiliatedSymbolNameEnum {
  // 连音线/延音线
  Slur = 'slur',

}

/** 单 slot 附属（锚定一个音符列 / 休止符列；如琶音、扫弦、前奏括号） */
export enum SingleSlotAffiliatedSymbolNameEnum {
  // 吉他谱另有音符级琶音/扫弦；此处为五线/简谱等列级附属
  Arpeggio = 'arpeggio',
  arpeggio_straight = 'arpeggio_straight',
  Strumming = 'strumming',
  /** 前奏括号左 `(`：默认在 slot 列左侧（略贴列起点，与右侧跨符头后的间隙接近） */
  Prelude_bracket_left = 'prelude_bracket_left',
  /** 前奏括号右 `)`：默认在 slot 列右侧（间距更大，跨过音符） */
  Prelude_bracket_right = 'prelude_bracket_right',
}

/** 双 slot 附属（锚定起止两列；如踏板、八度记号） */
export enum DoubleSlotAffiliatedSymbolNameEnum {
  Pedal = 'pedal',
  Pitch_down = 'pitch_down',
  Pitch_up = 'pitch_up',
  /** 颤音线；起始符号见 data.trill.type（TrillTypeEnum） */
  Trill_line = 'trill_line',
  /** 渐强 / 渐弱；造型见 data.hairpin.type（HairpinTypeEnum） */
  Hairpin = 'hairpin',
  /** 古筝连续指法（连托 / 连劈 / 连抹 …）；指法见 data.guzhengLian.type（GuzhengLianTypeEnum） */
  Guzheng_lian = 'guzheng_lian',
}

/**
 * 古筝连续指法：画在谱表下方。
 * 连托 = 矩形无上边（底边虚线）；连劈 = 矩形无下边（顶边虚线）；其余 = 起点画该指法符号，后接虚线到结束列。
 */
export enum GuzhengLianTypeEnum {
  Tuo = 'tuo', // 连托
  Pi = 'pi', // 连劈
  Mo = 'mo', // 连抹
  Tiao = 'tiao', // 连挑
  Gou = 'gou', // 连勾
  Ti = 'ti', // 连剔
  Da = 'da', // 连打
  Zhai = 'zhai', // 连摘
}

/** 颤音线起始符号；后面都接 SMuFL 波浪线 */
export enum TrillTypeEnum {
  Trill = 'trill', // tr~~~~
  Upprall = 'upprall',
  Downprall = 'downprall',
  Prallprall = 'prallprall',
}

export enum HairpinTypeEnum {
  Crescendo_hairpin = 'crescendo_hairpin', // 小于号形状
  Diminuendo_hairpin = 'diminuendo_hairpin', // 大于号形状
  Crescendo_line = 'crescendo_line', // cresc._____
  Diminuendo_line = 'diminuendo_line', // dim.____
}

export enum PitchTypeEnum {
  '8va' = '8va',
  '15ma' = '15ma',
  '22ma' = '22ma',
}

export enum ArpeggioTypeEnum {
  Normal = 'normal', // 普通的曲线
  Staright = 'staright', // 直线
}

/** 踏板记号造型；目前仅 normal 占位 */
export enum PedalTypeEnum {
  Normal = 'normal',
}

/** 双小节附属型符号名称（如反复小房子 volta） */

export enum DoubleMeasureAffiliatedSymbolNameEnum {

  Volta = 'volta',

}


/** 单音符附属型符号名称 */

export enum SingleNoteAffiliatedSymbolNameEnum {
  // Articulations
  Accent_above = 'acccent_above',
  Staccato_above = 'staccato_above',
  Staccatissimo_above = 'staccatissimo_above',
  Tenuto_above = 'tenuto_above',
  Loure_above = 'loure_above',
  Marcato_above = 'marcato_above',
  Accent_staccato_above = 'accent_staccato_above',
  Marcato_staccato_above = 'marcato_staccato_above',
  Marcato_tenuto_above = 'marcato_tenuto_above',
  Staccatissimo_stroke_above = 'staccatissimo_stroke_above',
  Staccatissimo_wedge_above = 'staccatissimo_wedge_above',
  Stress_above = 'stress_above',
  Tenuto_accent_above = 'tenuto_accent_above',
  Unstress_above = 'unstress_above',
  Open = 'open',
  Muted = 'muted',
  Harmonic = 'harmonic',
  Up_bow = 'up_bow',
  Down_bow = 'down_bow',
  /** 呼吸记号（SMuFL breathMarkComma） */
  Breath = 'breath',
  // ornaments
  Turn = 'turn',
  InvertedTurn = 'invertedTurn',
  Trill = 'trill',
  ShortTrill = 'shortTrill',
  Mordent = 'mordent',

  // glissandos TODO 这个暂时不做
  // dynamics 强弱记号（skinKey 为 dyn_*，见 renderRules）
  PPP = 'ppp',
  PP = 'pp',
  P = 'p',
  MP = 'mp',
  MF = 'mf',
  F = 'f',
  FF = 'ff',
  FFF = 'fff',
  FP = 'fp',
  PF = 'pf',
  SF = 'sf',
  SFZ = 'sfz',
  /** SMuFL 无独立 sff 字形，暂不配皮肤 / 规则 */
  SFF = 'sff',
  SFFZ = 'sffz',
  SFP = 'sfp',
  RFZ = 'rfz',
  RF = 'rf',
  FZ = 'fz',

  // 古筝指法（无通行英文名的用拼音；剔 / 提同音，用声调数字区分）
  /** 抹：反斜线 \ */
  Guzheng_mo = 'guzheng_mo',
  /** 挑：斜线 / */
  Guzheng_tiao = 'guzheng_tiao',
  /** 勾：上圆弧 ⌒ */
  Guzheng_gou = 'guzheng_gou',
  /** 剔（tī）：下圆弧 ◡ */
  Guzheng_ti1 = 'guzheng_ti1',
  /** 劈：矩形留上边和右边 ┐ */
  Guzheng_pi = 'guzheng_pi',
  /** 托：矩形留下边和左边 └ */
  Guzheng_tuo = 'guzheng_tuo',
  /** 打：三角形去掉底边 ∧ */
  Guzheng_da = 'guzheng_da',
  /** 摘：打上下翻转 ∨ */
  Guzheng_zhai = 'guzheng_zhai',
  /** 提（tí）：闪电形折线 */
  Guzheng_ti2 = 'guzheng_ti2',
  /** 拨：提左右翻转 */
  Guzheng_bo = 'guzheng_bo',
  /** 小撮：托 + 反斜线 */
  Guzheng_xiao_cuo = 'guzheng_xiao_cuo',
  /** 大撮：托 + 勾 */
  Guzheng_da_cuo = 'guzheng_da_cuo',
  /** 扫弦：倾斜的「王」，在音符右下方 */
  Guzheng_sao = 'guzheng_sao',
  /** 摇指：倾斜的「三」（彡） */
  Guzheng_yao = 'guzheng_yao',

}


/** 单小节附属型符号名称 */

export enum SingleMeasureAffiliatedSymbolNameEnum {

}

/**
 *  反复符号枚举(不包含反复小节线和volta)
 */
// 出现在小节前方的反复符号
export enum MeasureStartRepeatEnum {
  Coda = 'coda', // 走到to_coda
  Segno = 'segno',// 走到DS
}

// 出现在小节后方的反复符号
export enum MeasureEndRepeatEnum {
  To_coda = 'to_coda',
  DC = 'DC', // 回到乐曲开头
  DS = 'DS', // 回到segno
  Fine = 'fine', // 终止收尾
  DC_al_fine = 'dc_al_fine',
  DC_al_coda = 'dc_al_coda',
  DS_al_fine = 'ds_al_fine',
  DS_al_coda = 'ds_al_coda',

}

// 变音符号类型

export enum AccidentalTypeEnum {

  Sharp = 'Sharp',

  Flat = 'Flat',

  Double_sharp = 'double_sharp',

  Double_flat = 'double_flat',

  Natural = 'natural',

}


// 符杠类型

export enum BeamTypeEnum {

  None = 'None', // 无符杠

  OnlyRight = 'OnlyRight', // 只连接右侧

  Combined = 'Combined', // 完全连接

}


// 连谱号

export enum BracketTypeEnum {

  Bracket = 'Bracket', // 大括号

  Brace = 'Brace', // 花括号

  Square = 'Square', // 方括号

}

// 音名
export enum NoteName {
  C = "C",

  CSharp = "C#",
  DFlat = "Db",

  D = "D",

  DSharp = "D#",
  EFlat = "Eb",

  E = "E",

  F = "F",

  FSharp = "F#",
  GFlat = "Gb",

  G = "G",

  GSharp = "G#",
  AFlat = "Ab",

  A = "A",

  ASharp = "A#",
  BFlat = "Bb",

  B = "B",
}

// ======================================吉他谱（或者tab谱）================================================
export enum TabNoteInfoTypeEnum {
  Normal = 'normal', // 普通音符
  Arpeggio = 'arpeggio', // 琶音
  Strumming = 'strumming', // 扫弦
  Harmonic = 'harmonic',
}

// 连音线类型,这个有可能是通用的
export enum SlurTypeEnum {
  H = 'h',//击弦H
  S = 's',//滑弦S
  P = 'p',//勾弦P
  HP = 'hp'//击勾弦HP
}

/** 连音线造型：圆润描边 / 尖锐填充月牙；未指定时按谱种 */
export enum SlurStyleEnum {
  /** 圆润：两端圆弧 + 中间横线，圆角描边 */
  Rounded = 'rounded',
  /** 尖锐：填充月牙 */
  Sharp = 'sharp',
}

// 推弦类型，这个有可能是通用的
export enum BendTypeEnum {
  Bend = 'bend', // 推弦
  BendRelease = 'bendRelease', //推弦再回来
  Prebend = 'prebend', //预推弦
  PrebendRelease = 'prebendRelease', //预推弦再回来
  PrebendBend = 'prebendBend', //预推弦再升高
}

// ======================================鼓谱================================================
/**
 * 叉号，叉号加圆，线谱四分音符头，斜线加圆，三角形， 棱形
 */
export enum DrumHeadTypeEnum {
  Cross = 'cross', // 叉号
  CircledCross = 'circledCross', // 叉号加圆
  Normal = 'normal', // 线谱四分音符头
  CircledSlash = 'circledSlash', // 斜线加圆
  Triangle = 'triangle', // 三角形
  Diamond = 'diamond', // 棱形
}