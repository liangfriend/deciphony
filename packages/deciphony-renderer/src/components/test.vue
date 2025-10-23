<script lang="ts" setup>
import {computed, onBeforeUnmount, onMounted, ref} from 'vue'

const props = defineProps({
  boxSize: {type: Number, default: 10},
})

const dragableBoxList = ref({
  startPoint: {position: {x: 0, y: 0}},
  endPoint: {position: {x: 100, y: 0}},
  leftSlope: {position: {x: 20, y: 50}},
  rightSlope: {position: {x: 80, y: 50}},
})

let isDragging = false
let currentItem: any = null
const svgRef = ref<SVGSVGElement | null>(null)


function getMousePositionInSvg(e: PointerEvent) {
  if (!svgRef.value) return {x: e.clientX, y: e.clientY}
  const pt = svgRef.value.createSVGPoint()
  pt.x = e.clientX
  pt.y = e.clientY
  const svgP = pt.matrixTransform(svgRef.value.getScreenCTM()?.inverse())
  return {x: svgP.x, y: svgP.y}
}

// pointerdown
function onPointerDown(e: PointerEvent, item: any) {
  isDragging = true
  currentItem = item
  const target = e.target as HTMLElement
  target.setPointerCapture(e.pointerId)
}

// pointermove
function onPointerMove(e: PointerEvent) {
  if (!isDragging || !currentItem) return
  const pos = getMousePositionInSvg(e)
  currentItem.position.x = pos.x
  currentItem.position.y = pos.y
}

// pointerup
function onPointerUp(e: PointerEvent) {
  isDragging = false
  currentItem = null
}

onMounted(() => {
  document.addEventListener('pointermove', onPointerMove)
  document.addEventListener('pointerup', onPointerUp)
})
onBeforeUnmount(() => {
  document.removeEventListener('pointermove', onPointerMove)
  document.removeEventListener('pointerup', onPointerUp)
})

// 路径计算
const path = computed(() => {
  const s = dragableBoxList.value.startPoint.position
  const e = dragableBoxList.value.endPoint.position
  const l = dragableBoxList.value.leftSlope.position
  const r = dragableBoxList.value.rightSlope.position
  return `M ${s.x} ${s.y} C ${l.x} ${l.y}, ${r.x} ${r.y}, ${e.x} ${e.y}`
})

// 计算 SVG 尺寸和边界
const svgBox = computed(() => {
  const allPoints = Object.values(dragableBoxList.value).map((item) => item.position)
  const xs = allPoints.map((p) => p.x)
  const ys = allPoints.map((p) => p.y)
  const minX = Math.min(...xs)
  const minY = Math.min(...ys)
  const maxX = Math.max(...xs)
  const maxY = Math.max(...ys)
  const pad = 50
  return {
    viewBox: `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}`,
    width: maxX - minX + pad * 2,
    height: maxY - minY + pad * 2,
  }
})
</script>

<template>
  <svg
      ref="svgRef"
      :viewBox="svgBox.viewBox"
      :width="svgBox.width"
      :height="svgBox.height"
      style="border: 1px solid #ccc; background: #fafafa;"
  >
    <!-- 辅助线 -->
    <line
        :x1="dragableBoxList.startPoint.position.x"
        :y1="dragableBoxList.startPoint.position.y"
        :x2="dragableBoxList.leftSlope.position.x"
        :y2="dragableBoxList.leftSlope.position.y"
        stroke="#999"
        stroke-dasharray="3 3"
    />
    <line
        :x1="dragableBoxList.endPoint.position.x"
        :y1="dragableBoxList.endPoint.position.y"
        :x2="dragableBoxList.rightSlope.position.x"
        :y2="dragableBoxList.rightSlope.position.y"
        stroke="#999"
        stroke-dasharray="3 3"
    />

    <!-- 曲线 -->
    <path :d="path" stroke="black" fill="none" stroke-width="2"/>

    <!-- 拖拽点 -->
    <circle
        v-for="(item, key) in dragableBoxList"
        :key="key"
        :cx="item.position.x"
        :cy="item.position.y"
        :r="props.boxSize / 2"
        fill="white"
        stroke="#666"
        stroke-width="1"
        style="cursor: grab;"
        @pointerdown="(e) => onPointerDown(e, item)"
    />
  </svg>
</template>

<style scoped>
svg {
  user-select: none;
}
</style>
