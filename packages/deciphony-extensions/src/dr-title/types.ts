import type {MaybeRef} from 'vue'

export type TitleMode = 'edit' | 'show'

/** drTitle / TitleSlot 可选配置 */
export type DrTitleOptions = {
  mode?: MaybeRef<TitleMode>
  /** 左侧内缩（px），默认 0 */
  paddingLeft?: number
  /** 右侧内缩（px），默认 0 */
  paddingRight?: number
}
