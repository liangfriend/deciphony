import type {Component} from 'vue'
import type {SlotConfig, SlotName, VDom} from './common'

/** 传给插槽组件的额外 props（在 node、musicScore 之外） */
export type DrExtensionProps = Record<string, unknown> | (() => Record<string, unknown>)

/** 与 music-score emit 对齐；多个扩展可同时监听同一事件，按 extensions 数组顺序调用 */
export type DrExtensionEvents = {
  renderMusicScore?: (vDom: VDom[]) => void
  'dr-click'?: (event: MouseEvent, vDom: VDom) => void
  'dr-down'?: (event: PointerEvent, vDom: VDom) => void
  'dr-up'?: (event: PointerEvent, vDom: VDom) => void
  'dr-move'?: (event: PointerEvent, vDom: VDom) => void
  'dr-enter'?: (event: PointerEvent, vDom: VDom) => void
  'dr-leave'?: (event: PointerEvent, vDom: VDom) => void
  'top-click'?: (event: MouseEvent, vDom: VDom | null) => void
  'top-down'?: (event: PointerEvent, vDom: VDom | null) => void
  'top-up'?: (event: PointerEvent, vDom: VDom | null) => void
  'top-move'?: (event: PointerEvent, vDom: VDom | null) => void
  'top-enter'?: (event: PointerEvent, vDom: VDom) => void
  'top-leave'?: (event: PointerEvent, vDom: VDom) => void
}

/**
 * 扩展贡献声明。music-score 的 :extensions 消费此结构：
 * 合并 slotConfig、在对应插槽动态渲染 slots、按顺序广播 on 事件。
 */
export type DrExtension = {
  name: string
  slotConfig?: SlotConfig
  slots?: Partial<Record<SlotName, Component>>
  props?: DrExtensionProps
  on?: DrExtensionEvents
}
