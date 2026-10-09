import type {Component, ComputedRef, InjectionKey, Slots} from 'vue'
import type {MusicScoreTypeEnum} from '@/enums/musicScoreEnum'
import type {MusicScore} from '@/types/MusicScoreType'
import type {Skin, SlotName, VDom} from '@/types/common'
import type {DrExtension} from '@/types/extension'

export type SlotExtensionItem = {
  name: string
  component: Component
  extension: DrExtension
}

type NodeHandler<E extends Event> = (event: E, node: VDom) => void

/** musicScore → ScoreLayer 共享的渲染上下文 */
export type ScoreLayerContext = {
  data: ComputedRef<MusicScore>
  skin: ComputedRef<Skin>
  notationType: ComputedRef<MusicScoreTypeEnum>
  slots: Slots
  extensionsForSlot: (slotName?: SlotName) => SlotExtensionItem[]
  resolveExtensionProps: (ext: DrExtension) => Record<string, unknown>
  onClick: NodeHandler<MouseEvent>
  onContextMenu: NodeHandler<MouseEvent>
  onDown: NodeHandler<PointerEvent>
  onUp: NodeHandler<PointerEvent>
  onMove: NodeHandler<PointerEvent>
  onEnter: NodeHandler<PointerEvent>
  onLeave: NodeHandler<PointerEvent>
}

export const SCORE_LAYER_CONTEXT: InjectionKey<ScoreLayerContext> = Symbol('dr-score-layer')

/**
 * 插槽组件 inject 这个键拿到所在复谱表的全部 vDom（Ref<VDom[]>，整行重排才换新数组）。
 * 用字符串而非 Symbol：扩展包与 renderer 即使打成两份模块也能对上。
 */
export const DR_ROW_VDOMS_KEY = 'dr-row-vdoms'
