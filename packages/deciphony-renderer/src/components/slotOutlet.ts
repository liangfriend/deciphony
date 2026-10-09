import {defineComponent, h, inject, type PropType} from 'vue'
import type {VDom} from '@/types/common'
import {SCORE_LAYER_CONTEXT} from '@/render/incremental/layerContext'

/** 渲染宿主同名具名插槽；宿主没写就渲染扩展贡献的插槽组件 */
export default defineComponent({
  name: 'DrSlotOutlet',
  props: {
    node: {type: Object as PropType<VDom>, required: true},
  },
  setup(props) {
    const ctx = inject(SCORE_LAYER_CONTEXT)!
    return () => {
      const node = props.node
      const hostSlot = node.slotName ? ctx.slots[node.slotName] : undefined
      if (hostSlot) return hostSlot({node})
      return ctx.extensionsForSlot(node.slotName).map((item) => h(item.component, {
        key: `${item.name}:${node.targetId}`,
        musicScore: ctx.data.value,
        node,
        ...ctx.resolveExtensionProps(item.extension),
      }))
    }
  },
})
