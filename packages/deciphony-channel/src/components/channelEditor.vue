<script setup lang="ts">
import {ref, onMounted, nextTick, computed} from "vue"

const canvasRef = ref<HTMLCanvasElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)

const zoom = ref(1) // 缩放因子（横向）
const sampleStep = ref(1) // 采样点步长
const sampleRate = ref(40000) // 采样率
const amplitudeScale = ref(1) // 振幅缩放因子
const channelData = ref<number[]>([])
const selectedIndx = ref(0)

const duration = computed(() => {
  return channelData.value.length / sampleRate.value * 1000
})

// 绘制波形 + 播放位置
function draw() {
  if (!canvasRef.value) return
  const ctx = canvasRef.value.getContext("2d")!
  const height = canvasRef.value.height
  const seconds = duration.value
  const pxPerSecond = 200 * zoom.value
  const width = Math.floor(seconds * pxPerSecond)

  canvasRef.value.width = width
  ctx.clearRect(0, 0, width, height)
  const data = channelData.value
  const step = sampleStep.value > 0
      ? sampleStep.value
      : Math.max(1, Math.floor(data.length / width))

  const amp = (height / 2) * amplitudeScale.value
  ctx.beginPath()
  ctx.moveTo(0, height / 2)
  for (let i = 0; i < data.length; i += step) {
    const x = (i / data.length) * width
    const y = height / 2 - data[i] * amp
    ctx.lineTo(x, y)
  }
  ctx.strokeStyle = "#333"
  ctx.stroke()

  // 绘制播放位置指示线
  // if (selectedIndx > 0) {
  //   const x = selectedIndx * pxPerSecond
  //   ctx.beginPath()
  //   ctx.moveTo(x, 0)
  //   ctx.lineTo(x, height)
  //   ctx.strokeStyle = "red"
  //   ctx.stroke()
  // }
}


// slider 控制项
function onZoomChange(e: Event) {
  zoom.value = Number((e.target as HTMLInputElement).value)
  draw()
}

// 采样步长
function onStepChange(e: Event) {
  sampleStep.value = Number((e.target as HTMLInputElement).value)
  draw()
}

// 振幅高度
function onAmpChange(e: Event) {
  amplitudeScale.value = Number((e.target as HTMLInputElement).value)
  draw()
}


onMounted(() => {
  if (canvasRef.value) {
    canvasRef.value.height = 200
  }
  channelData.value = []

  for (let i = 0; i < 400; i++) {
    channelData.value.push(Math.sin(i % Math.PI))
  }
  draw()
})
</script>

<template>
  <div class="p-4 space-y-4">
    <div
        ref="containerRef"
        class="border rounded h-52 w-full overflow-auto hide-scrollbar"
    >
      <canvas ref="canvasRef" class="h-full"></canvas>
    </div>

    <div class="flex items-center space-x-4 ">
      <label>缩放：</label>
      <input type="range" min="0.5" max="5" step="0.1"
             v-model="zoom" @input="onZoomChange"/>

      <label>采样步长：</label>
      <input type="range" min="1" max="2000" step="1"
             v-model.number="sampleStep" @input="onStepChange"/>
      <span>{{ sampleStep }}</span>

      <label>振幅高度：</label>
      <input type="range" min="0.1" max="5" step="0.1"
             v-model.number="amplitudeScale" @input="onAmpChange"/>
      <span>{{ amplitudeScale && amplitudeScale.toFixed(1) }}x</span>
    </div>


  </div>
</template>

<style scoped>
canvas {
  display: block;

}
</style>
