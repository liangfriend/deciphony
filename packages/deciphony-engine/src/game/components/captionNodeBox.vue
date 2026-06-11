<script lang="ts" setup>
import { useCaption } from '@/composables/useCaption'
import { computed, CSSProperties, defineProps, PropType, ref } from 'vue'
import { CaptionNode, CaptionStatus, ConditionNode, LayoutNode, OptionNode } from '@/types'
import { useNodeManager } from '@/composables/useNodeManager'
import { parseJS, runCode } from '@/utils/execJS'

const props = defineProps({
  layout: {
    type: Object as PropType<LayoutNode>,
    required: true
  },
  captionNode: {
    type: Object as PropType<CaptionNode>,
    required: true
  },
  canvasWidth: {
    // 画布宽
    type: Number,
    required: true
  },
  canvasHeight: {
    // 画布高
    type: Number,
    required: true
  }
})
const { editorNodeList, nodeMap, editorNodeMap, groupedNodes, clearNodeManager } = useNodeManager()
const emit = defineEmits<{
  (e: 'statusChange', status: CaptionStatus, captionNode: CaptionNode): void
}>()
const captionRef = ref<SVGAElement>(null!)
const {
  visible,
  x,
  y,
  width,
  height,
  captionTextStyle,
  captionTitleStyle,
  displayText,
  layout,
  status,
  executingAction
} = useCaption(props, emit as (type: string, ...data: any) => void, captionRef)
const boxStyle = computed(() => {
  return parseJS(props.captionNode.boxStyle)
})

const optionNodes = computed((): OptionNode[] => {
  const nodes: OptionNode[] = []
  props.captionNode?.optionIds.forEach((id) => {
    const optionNode = nodeMap.value.get(id) as OptionNode
    let visible = true
    for (let id of optionNode?.visibleConditionIds) {
      const conditionNode = nodeMap.value.get(id) as ConditionNode
      const res = runCode(conditionNode.func)

      if (!res) visible = false
    }
    if (optionNode && visible) {
      nodes.push(optionNode)
    }
  })
  return nodes
})
const optionContainerStyle = computed((): CSSProperties => {
  return parseJS(props.captionNode.optionContainerStyle)
})
const hover = ref(false)
const hoverMap = ref(new Map<number, boolean>())
const optionStyle = computed((): ((node: OptionNode) => CSSProperties) => {
  return (node: OptionNode): CSSProperties => {
    try {
      const isHover = hoverMap.value.get(node.id) || false
      let style: CSSProperties = parseJS(node.normalStyle)

      if (isHover) {
        style = { ...style, ...parseJS(node.hoverStyle) }
      }
      return style
    } catch (e) {
      console.error('选项样式有误', node.nodeName, e)

      let style: CSSProperties = {}

      if (hoverMap.value.get(node.id)) {
        style = { ...style, backgroundColor: '#4096ff' }
      }

      return style
    }
  }
})
</script>

<template>
  <g
    v-if="visible"
    class="pointer-events-auto"
    ref="captionRef"
    :transform="`
        translate(${x}, ${y})
        scale(${layout.scale})
        rotate(${layout.rotation}, ${width / 2}, ${height / 2})
     `"
  >
    <foreignObject :height="height" :width="width">
      <div class="caption stack" :style="boxStyle">
        <div class="caption-text stack-item" :style="captionTextStyle">
          {{ displayText }}
        </div>
        <div class="caption-title stack-item" :style="captionTitleStyle">
          {{ captionNode.title }}
        </div>
        <div
          v-if="status === 'finished' || status === 'done'"
          class="optionContainer stack-item"
          :style="optionContainerStyle"
        >
          <div
            v-for="option in optionNodes"
            :style="optionStyle(option)"
            class="option"
            @click="executingAction(option.activeActionIds)"
            @mouseenter="hoverMap.set(option.id, true)"
            @mouseleave="hoverMap.set(option.id, false)"
          >
            {{ option.text }}
          </div>
        </div>
      </div>
    </foreignObject>
  </g>
</template>

<style scoped></style>
