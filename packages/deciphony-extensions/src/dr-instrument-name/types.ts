import type {MaybeRef} from 'vue'

export type InstrumentNameAlign = 'left' | 'center' | 'right'

/** drInstrumentName 可选配置 */
export type DrInstrumentNameOptions = {
  /** 单谱表未设置 data.instrumentName 时显示的默认乐器名 */
  defaultInstrument?: MaybeRef<string>
  /** s-l 插槽宽度（px），默认 64 */
  width?: number
  /** 字号（px），默认 14 */
  fontSize?: number
  /** 字体族（CSS font-family）；未传则沿用宿主 / 浏览器默认 */
  fontFamily?: MaybeRef<string | undefined>
  /** 水平对齐，默认 right（贴近谱表） */
  align?: InstrumentNameAlign
  /** 文本与曲谱（插槽右缘）的间距（px），默认 6 */
  gap?: MaybeRef<number>
  /** 插槽左侧内缩（px），默认 6 */
  padding?: number
}
