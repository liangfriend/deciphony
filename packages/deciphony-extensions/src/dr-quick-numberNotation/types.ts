import type {BarlineTypeEnum, MusicScore, NotesNumberInfo} from '@deciphony/renderer'
import type {CreateMusicScoreOptions} from '../dr-edit/score-builder'

/** 单个音高：唱名 + 八度点（正=高八度，负=低八度） */
export type QuickPitch = {
  syllable: NotesNumberInfo['syllable']
  octaveDot: number
}

/** 倚音：音高 + 减时线条数（`/`） */
export type QuickGrace = QuickPitch & {
  reduceLines: number
}

/** 一组字符（空格分隔）解析出的一个音符位 */
export type QuickNote = {
  /** 主音（写在最前的 notesInfo） */
  pitch: QuickPitch
  /** `(5)` 同 slot 叠音，按书写顺序向上叠 */
  chord: QuickPitch[]
  /** `/` 条数 */
  reduceLines: number
  /** `-` 条数 */
  addLines: number
  /** `,` 个数 */
  dots: number
  /** 音符前 `[]` */
  graceBefore: QuickGrace[]
  /** 音符后 `[]` */
  graceAfter: QuickGrace[]
  /** `<`：连音线开始 */
  slurStart: boolean
  /** `>`：连音线结束 */
  slurEnd: boolean
  /** 原始字符组 */
  source: string
}

export type QuickMeasure = {
  notes: QuickNote[]
  /** `|` → 后置小节线；未写时为普通单小节线 */
  barlineBack?: BarlineTypeEnum
}

/** 一行文本 = 一个单谱表 */
export type QuickStaff = {
  /** 文本行号（1 起） */
  line: number
  measures: QuickMeasure[]
}

/** 连续非空行 = 一个复谱表；空行分隔复谱表 */
export type QuickGrandStaff = {
  staves: QuickStaff[]
}

export type QuickDocument = {
  grandStaffs: QuickGrandStaff[]
}

export type QuickParseResult = {
  document: QuickDocument
  warnings: string[]
}

export type QuickTextToMusicScoreOptions = Omit<CreateMusicScoreOptions, 'type'>

export type QuickTextToMusicScoreResult = {
  musicScore: MusicScore
  warnings: string[]
}

export type MusicScoreToQuickTextResult = {
  text: string
  warnings: string[]
}
