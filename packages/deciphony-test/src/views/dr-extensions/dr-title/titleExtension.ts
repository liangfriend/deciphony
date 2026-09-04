import type {DrExtension} from 'deciphony-renderer'
import type {MaybeRef} from 'vue'
import TitleSlot from './components/TitleSlot.vue'
import type {TitleMode} from './types'

/** t 插槽默认高度（像素），计入 slotConfig */
export const TITLE_SLOT_HEIGHT = 96

export function drTitle(options: {mode?: MaybeRef<TitleMode>} = {}): DrExtension {
  return {
    name: 'dr-title',
    slotConfig: {t: {h: TITLE_SLOT_HEIGHT}},
    slots: {t: TitleSlot},
    props: () => ({
      mode: options.mode ?? 'show',
    }),
  }
}
