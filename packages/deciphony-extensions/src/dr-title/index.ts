import type {DrExtension} from '@deciphony/renderer'
import TitleSlot from './components/TitleSlot.vue'
import type {DrTitleOptions} from './types'

/** t 插槽默认高度（像素），计入 slotConfig */
export const TITLE_SLOT_HEIGHT = 96

export function drTitle(options: DrTitleOptions = {}): DrExtension {
  const paddingLeft = Math.max(0, options.paddingLeft ?? 0)
  const paddingRight = Math.max(0, options.paddingRight ?? 0)
  return {
    name: 'dr-title',
    slotConfig: {t: {h: TITLE_SLOT_HEIGHT}},
    slots: {t: TitleSlot},
    props: () => ({
      mode: options.mode ?? 'show',
      paddingLeft,
      paddingRight,
    }),
  }
}

export {default as TitleSlot} from './components/TitleSlot.vue'
export {readTitleField, writeTitleField, type TitleFieldKey} from './titleFields'
export type {TitleMode, DrTitleOptions} from './types'
