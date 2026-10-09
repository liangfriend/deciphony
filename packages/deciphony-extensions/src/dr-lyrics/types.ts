import type {MaybeRef} from 'vue'

export type LyricsMode = 'edit' | 'show'

/** drLyrics / LyricsSlot 可选配置 */
export type DrLyricsOptions = {
  mode?: MaybeRef<LyricsMode>
  /** 最前方是否显示行号（1. 2.），默认 false */
  showRowIndex?: MaybeRef<boolean>
  /** 歌词字号（px），默认 13；行距、输入框高度按比例缩放，g-d 高度仍由宿主控制 */
  fontSize?: MaybeRef<number>
  /** 字体族；未传则沿用宿主 / 浏览器默认 */
  fontFamily?: MaybeRef<string | undefined>
}
