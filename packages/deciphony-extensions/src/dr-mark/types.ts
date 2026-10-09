/** 标记类型；后续扩展呼吸记号、其它乐器指法等 */
export type DrMarkType = 'flute' | 'ocarina' | 'xiao'

/** 笛子调（筒音作 5 时的 do）；G = 大G 调笛，highG = 小G 调笛 */
export type FluteKey = 'G' | 'A' | 'bB' | 'C' | 'D' | 'E' | 'F' | 'highG'

/**
 * 一个音的指法：6 个字符，从上（吹孔侧，左手食指）到下（右手无名指）。
 * x = 按住，o = 开孔，h = 半孔
 */
export type FluteHolePattern = string

export type FluteFingering = {
  holes: FluteHolePattern
  /** 0 平吹，1 超吹，2 高音超吹；图上方画对应个数的小圆点 */
  register: 0 | 1 | 2
}

export type FluteMarkOptions = {
  /** 笛子调（必填），如 D = D 调笛（筒音 A4） */
  key: FluteKey
  /** 覆盖指法表：键 = 相对筒音的半音数 */
  fingerings?: Record<number, FluteFingering>
  /** 被延音线连过来的同音（tie 后半）不重复画，默认 true */
  skipTieEnd?: boolean
  /** 超出音域时画「?」占位，默认 false（不画） */
  showOutOfRange?: boolean
}

type DrMarkCommonOptions = {
  /** 只在这些单谱表（复谱表内下标）下画，默认全部 */
  staves?: number[]
  /** 缩放，默认 1；m-d 高度同步缩放 */
  scale?: number
  /** 颜色，默认 #303133 */
  color?: string
}

/**
 * 陶笛型号：
 * - transverse12：12 孔（正面 8 指孔 + 2 日式副孔（右食指旁、右中指旁），背面 2 拇指孔画在底部两侧），三角形机身
 * - pendant4：4 孔英式吊坠（只有正面孔），椭圆机身
 * 指法图均为单张、吹口朝下。
 */
export type OcarinaModel = 'transverse12' | 'pendant4'

/** 陶笛调：A = 中音，S = 高音，B = 低音；如 AC = 中音 C 调（do = C5） */
export type OcarinaKey = 'AC' | 'AF' | 'AG' | 'SC' | 'SF' | 'SG' | 'BC'

/**
 * 陶笛指法：按型号孔序排列的字符串（x 按 / o 开 / h 半孔）。
 * transverse12 孔序：左食 左中 左无名 左小 右食 右中 右无名 右小 | 右食副孔 右中副孔 | 左拇 右拇（共 12）
 * pendant4 孔序：左食 左中 右食 右中
 */
export type OcarinaHolePattern = string

export type OcarinaMarkOptions = {
  /** 型号（必填） */
  model: OcarinaModel
  /** 调（必填） */
  key: OcarinaKey
  /** 覆盖指法表：键 = 相对 do 的半音数 */
  fingerings?: Record<number, OcarinaHolePattern>
  /** 被延音线连过来的同音不重复画，默认 true */
  skipTieEnd?: boolean
  /** 超出音域时画「?」占位，默认 false */
  showOutOfRange?: boolean
}

/**
 * 箫型号（背孔与八孔箫第一孔在图上左偏，一张图）：
 * - hole8：八孔箫（背 1 + 正 7）
 * - hole6：六孔箫（背 1 + 正 5）
 */
export type XiaoModel = 'hole8' | 'hole6'

/** 箫调（筒音作 5 时的 do），如 G = G 调箫（筒音 D4） */
export type XiaoKey = 'C' | 'bD' | 'D' | 'bE' | 'E' | 'F' | 'bG' | 'G' | 'bA' | 'A' | 'bB' | 'B'

/**
 * 箫指法：holes 第 1 个字符 = 背孔（左拇），之后正面从上到下（x 按 / o 开 / h 半孔）。
 * register：0 平吹，1 超吹，2 高音超吹；正面图上方画对应个数的小圆点
 */
export type XiaoFingering = {
  holes: string
  register: 0 | 1 | 2
}

export type XiaoMarkOptions = {
  /** 型号（必填） */
  model: XiaoModel
  /** 调（必填） */
  key: XiaoKey
  /** 覆盖指法表：键 = 相对筒音的半音数 */
  fingerings?: Record<number, XiaoFingering>
  /** 被延音线连过来的同音不重复画，默认 true */
  skipTieEnd?: boolean
  /** 超出音域时画「?」占位，默认 false */
  showOutOfRange?: boolean
}

/** 每种 type 带自己的专属参数 */
export type DrMarkOptions = DrMarkCommonOptions & (
  | {type: 'flute'; flute: FluteMarkOptions}
  | {type: 'ocarina'; ocarina: OcarinaMarkOptions}
  | {type: 'xiao'; xiao: XiaoMarkOptions}
)
