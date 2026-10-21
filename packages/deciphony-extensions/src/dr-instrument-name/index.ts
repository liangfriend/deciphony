import type {DrExtension, VDom} from '@deciphony/renderer'
import {shallowRef} from 'vue'
import InstrumentNameSlot from './components/InstrumentNameSlot.vue'
import type {DrInstrumentNameOptions} from './types'

/** s-l 插槽默认宽度（px） */
export const INSTRUMENT_NAME_SLOT_WIDTH = 64

/**
 * 乐器名扩展：挂 s-l，每个单谱表左侧显示乐器名。
 * 乐器名取 singleStaff.data.instrumentName，未设置时显示 options.defaultInstrument；
 * 文字按该谱表首小节的五线区域纵向居中，名称内的 \n 换行。
 */
export function drInstrumentName(options: DrInstrumentNameOptions = {}): DrExtension {
  const measureVDomMap = shallowRef(new Map<string, VDom>())
  return {
    name: 'dr-instrument-name',
    slotConfig: {'s-l': {w: Math.max(0, options.width ?? INSTRUMENT_NAME_SLOT_WIDTH)}},
    slots: {'s-l': InstrumentNameSlot},
    props: () => ({
      defaultInstrument: options.defaultInstrument ?? '',
      measureVDomMap,
      fontSize: options.fontSize ?? 14,
      fontFamily: options.fontFamily,
      align: options.align ?? 'right',
      gap: options.gap ?? 6,
      padding: options.padding ?? 6,
    }),
    on: {
      renderMusicScore(list) {
        const map = new Map<string, VDom>()
        for (const vdom of list) {
          if (vdom.tag === 'measure' && vdom.targetId) map.set(vdom.targetId, vdom)
        }
        measureVDomMap.value = map
      },
    },
  }
}

export {default as InstrumentNameSlot} from './components/InstrumentNameSlot.vue'
export {readInstrumentName, resolveInstrumentName, writeInstrumentName} from './instrumentNameFields'
export type {DrInstrumentNameOptions, InstrumentNameAlign} from './types'
