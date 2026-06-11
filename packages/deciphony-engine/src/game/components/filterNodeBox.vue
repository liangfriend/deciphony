<script lang="ts" setup>
import { computed, PropType, ref, watchEffect } from 'vue'
import { FilterNode } from '@/types'
import { parseJS } from '@/utils/execJS'

const props = defineProps({
  filterNode: {
    type: Object as PropType<FilterNode>,
    required: true
  },
  canvasWidth: { type: Number, required: true },
  canvasHeight: { type: Number, required: true }
})

const filterStyle = computed(() => {
  return parseJS(props.filterNode.filterStyle)
})
// 用户自定义canvas滤镜
const canvasRef = ref<HTMLCanvasElement | null>(null)
watchEffect(() => {
  const script = props.filterNode.filterCanvasScript
  const canvas = canvasRef.value
  if (!script || !canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // 提供一个安全的沙盒环境
  const func = new Function('ctx', 'width', 'height', script)

  func(ctx, props.canvasWidth, props.canvasHeight)
})
</script>

<template>
  <g
    :style="{
      pointerEvents: 'none'
    }"
    class="filter-layer"
  >
    <foreignObject :height="canvasHeight" :width="canvasWidth">
      <!--   基础颜色   -->
      <div :style="filterStyle" class="filter-node">
        <canvas ref="canvasRef" :width="canvasWidth" :height="canvasHeight"></canvas>
      </div>
    </foreignObject>
  </g>
</template>

<style scoped>
.filter-layer {
  will-change: filter;
  mix-blend-mode: normal; /* 或 overlay / soft-light 可根据滤镜需要调整 */
}
.filter-node {
  width: 100%;
  height: 100%;
}
</style>
