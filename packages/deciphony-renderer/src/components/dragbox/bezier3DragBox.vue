<script lang="ts" setup>
import {computed, onBeforeUnmount, onMounted, PropType, ref} from 'vue'

const props = defineProps({
  boxSize: {type: Number, default: 10},
  modelValue: {
    type: Object as PropType<{
      startPoint: { x: number, y: number },
      endPoint: { x: number, y: number },
      leftSlope: { x: number, y: number },
      rightSlope: { x: number, y: number },
    }>,
    required: true,
  },
  position: {
    type: Object as PropType<{
      startPoint: { x: number, y: number },
      endPoint: { x: number, y: number },
      leftSlope: { x: number, y: number },
      rightSlope: { x: number, y: number },
    }>,
    default: () => ({
      startPoint: {x: 0, y: 0},
      endPoint: {x: 0, y: 0},
      leftSlope: {x: 0, y: 0},
      rightSlope: {x: 0, y: 0}
    }),
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
  emits('update:modelValue', {...props.modelValue})
}

// pointerup
function onPointerUp(e: PointerEvent) {
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
const actualPoints = computed(() => {
  return {
    startPoint: {
      x: props.position.startPoint.x + props.modelValue.startPoint.x,
      y:
          props.position.startPoint.y + props.modelValue.startPoint.y,
    }
    ,
    endPoint: {
      x: props.position.endPoint.x + props.modelValue.endPoint.x,
      y:
          props.position.endPoint.y + props.modelValue.endPoint.y,
    }
    ,
    leftSlope: {
      x: props.position.leftSlope.x + props.modelValue.leftSlope.x,
      y:
          props.position.leftSlope.y + props.modelValue.leftSlope.y,
    }
    ,
    rightSlope: {
      x: props.position.rightSlope.x + props.modelValue.rightSlope.x,
      y:
          props.position.rightSlope.y + props.modelValue.rightSlope.y,
    }
    ,
  }
})

const rectPath = computed(() => {
  const s = actualPoints.value.startPoint
  const e = actualPoints.value.endPoint
  const l = actualPoints.value.leftSlope
  const r = actualPoints.value.rightSlope

  const minX = Math.min(s.x, e.x)
  const maxX = Math.max(s.x, e.x)
  const minY = Math.min(s.y, e.y)
  const maxY = Math.max(s.y, e.y)

  return `
    M ${s.x} ${s.y}
    L ${l.x} ${l.y}
    L ${r.x} ${r.y}
    L ${e.x} ${e.y}
    Z
  `
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
