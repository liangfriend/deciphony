<script setup lang="ts">
import {onMounted, onBeforeUnmount, ref, watch, PropType} from "vue"

const props = defineProps({
  channelData: {
    type: Float32Array as PropType<Float32Array>,
    required: true
  }
})

const canvasRef = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null

// 绘制波形
function drawWaveform(data: Float32Array) {
  if (!ctx || !canvasRef.value) return
  const canvas = canvasRef.value
  const {width, height} = canvas

  ctx.clearRect(0, 0, width, height)
  ctx.strokeStyle = "#4ade80" // 绿色
  ctx.lineWidth = 1

  ctx.beginPath()
  const step = Math.ceil(data.length / width) // 每个像素多少采样点
  const amp = height / 2

  for (let x = 0; x < width; x++) {
    const i = x * step
    const v = data[i] || 0
    const y = amp + v * amp
    if (x === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  }
  ctx.stroke()
}

onMounted(() => {
  if (canvasRef.value) {
    ctx = canvasRef.value.getContext("2d")
    if (props.channelData) {
      drawWaveform(props.channelData)
    }
  }
})

watch(
    () => props.channelData,
    (newData) => {
      if (newData) drawWaveform(newData)
    },
    {immediate: true}
)
</script>

<template>
  <canvas ref="canvasRef" width="600" height="200" class="border rounded"></canvas>
</template>

<style scoped>
canvas {
  display: block;
  background: #111;
}
</style>
