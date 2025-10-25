<script lang="ts" setup>
import {computed, onBeforeUnmount, onMounted, PropType, ref} from 'vue'

const props = defineProps({
  boxSize: {type: Number, default: 10},
  modelValue: {
    type: Object as PropType<{
      startPoint: { x: number, y: number },
      endPoint: { x: number, y: number },
    }>,
    required: true,
  },
  // 整体偏移位置（不可拖动）
  position: {
    type: Object as PropType<{
      startPoint: { x: number, y: number },
      endPoint: { x: number, y: number },
    }>,
    default: () => ({startPoint: {x: 0, y: 0}, endPoint: {x: 0, y: 0}}),
  },
})
const emits = defineEmits(['update:modelValue'])
let isDragging = false
let currentKey: string = ''

function getMousemodelValueInSvg(e: PointerEvent) {
  // 因为要考虑浏览器滚动，所以用offset直接定位父级svg标签,注意保持svg视图和实际宽高的一致
  return {x: e.offsetX, y: e.offsetY}
}

// pointerdown
function onPointerDown(e: PointerEvent, key: string) {
  isDragging = true
  currentKey = key
  const target = e.target as HTMLElement
  target.setPointerCapture(e.pointerId)
}

// pointermove
function onPointerMove(e: PointerEvent) {
  if (!isDragging || !currentKey) return
  const currentItem = props.modelValue[currentKey]
  const pos = getMousemodelValueInSvg(e)
  const offsetX = props.position[currentKey].x
  const offsetY = props.position[currentKey].y
  currentItem.x = pos.x - offsetX
  currentItem.y = pos.y - offsetY
  // 其实这里不写emits也可以，但是还是标准化操作
  emits('update:modelValue', {...props.modelValue})
}

// pointerup
function onPointerUp() {
  isDragging = false
  currentKey = ''
}

onMounted(() => {
  document.addEventListener('pointermove', onPointerMove)
  document.addEventListener('pointerup', onPointerUp)
})
onBeforeUnmount(() => {
  document.removeEventListener('pointermove', onPointerMove)
  document.removeEventListener('pointerup', onPointerUp)
})
// ✅ 实际绘制坐标 = position + modelValue
const actualPoints = computed(() => ({
  startPoint: {
    x: props.position.startPoint.x + props.modelValue.startPoint.x,
    y: props.position.startPoint.y + props.modelValue.startPoint.y,
  },
  endPoint: {
    x: props.position.endPoint.x + props.modelValue.endPoint.x,
    y: props.position.endPoint.y + props.modelValue.endPoint.y,
  },
}))
// 计算矩形路径
const rectPath = computed(() => {
  const s = actualPoints.value.startPoint
  const e = actualPoints.value.endPoint

  const x = Math.min(s.x, e.x)
  const y = Math.min(s.y, e.y)
  const w = Math.abs(e.x - s.x)
  const h = Math.abs(e.y - s.y)

  return `M ${x} ${y} H ${x + w} V ${y + h} H ${x} Z`
})


</script>

<template>
  <!-- 虚线框 -->
  <path :d="rectPath" stroke="black" fill="transparent" stroke-width="1" stroke-dasharray="4"/>
  <slot></slot>
  <!-- 拖拽点 -->
  <circle
      v-for="(item, key) in actualPoints"
      :key="key"
      :cx="item.x"
      :cy="item.y"
      :r="props.boxSize / 2"
      fill="white"
      stroke="#666"
      stroke-width="1"
      style="cursor: grab;"
      @pointerdown="(e) => onPointerDown(e, key)"
  />
</template>

<style scoped>
svg {
  user-select: none;
}
</style>
