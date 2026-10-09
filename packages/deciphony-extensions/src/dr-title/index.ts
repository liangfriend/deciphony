import type {DrExtension} from '@deciphony/renderer'
import TitleSlot from './components/TitleSlot.vue'
import type {DrTitleOptions} from './types'

/** t 插槽默认高度（像素），计入 slotConfig；需容纳标题 + 左侧 1=C 元信息行 */
export const TITLE_SLOT_HEIGHT = 110

export function drTitle(options: DrTitleOptions = {}): DrExtension {
  const height = Math.max(0, options.height ?? TITLE_SLOT_HEIGHT)
  const paddingLeft = Math.max(0, options.paddingLeft ?? 0)
  const paddingRight = Math.max(0, options.paddingRight ?? 0)
  return {
    name: 'dr-title',
    slotConfig: {t: {h: height}},
    slots: {t: TitleSlot},
    props: () => ({
      mode: options.mode ?? 'show',
      paddingLeft,
      paddingRight,
      fontFamily: options.fontFamily,
    }),
  }
}

export {default as TitleSlot} from './components/TitleSlot.vue'
export {default as BeatUnitGlyph} from './components/BeatUnitGlyph.vue'
export {default as TimeSignatureGlyph} from './components/TimeSignatureGlyph.vue'
export {readTitleField, writeTitleField, type TitleFieldKey} from './titleFields'
export {
  BEAT_UNIT_OPTIONS,
  beatUnitLabel,
  beatUnitToChronaxie,
  normalizeBeatUnit,
  type BeatUnitValue,
} from './beatUnit'
export {KEY_SIGNATURE_LABEL, keySignatureLabel} from './keySignatureLabel'
export type {TitleMode, DrTitleOptions} from './types'
