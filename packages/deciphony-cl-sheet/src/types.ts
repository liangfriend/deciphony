/** 歌词上方的和弦 */
export type ClChord = {
  /** 和弦名，如 C / Am / G7 / C/G */
  text: string
  /** 缺省用组件的 chordColor */
  color?: string
}

/** 一个歌词单位（编辑时按字拆分，一个字一个） */
export type ClLyric = {
  id: string
  text: string
  /** 缺省用组件的 color */
  color?: string
  /** 下划线，宽度与文字相同；空格加下划线时占一个字宽 */
  underline?: boolean
  /** 和弦画在这个字的上方、左对齐 */
  chord?: ClChord
}

/** 一行歌词 */
export type ClLyricLine = ClLyric[]

/** 和弦弹唱谱数据 */
export type ClSheetData = {
  title: string
  author: string
  /** 组件宽度（px） */
  width: number
  /** 组件高度（px），内容超出时纵向滚动 */
  height: number
  fontFamily?: string
  /** 多行歌词 */
  lyrics: ClLyricLine[]
  /** 用户自定义数据，组件不读不写 */
  data?: Record<string, unknown>
}

export type ClSheetMode = 'show' | 'edit'

/** 编辑时新加内容写入数据的颜色；缺省不写（按组件 color / chordColor 显示） */
export type ClSheetAddColors = {
  /** 新打的字、新插入 / 粘贴的行 */
  lyric?: string
  /** 给原来没有和弦的字新加的和弦 */
  chord?: string
}

/** 当前选中的歌词单位（只在编辑模式存在） */
export type ClSheetSelection = {
  lineIndex: number
  index: number
  lyric: ClLyric
}
