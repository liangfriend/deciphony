<script setup lang="ts">
import {ref, onMounted, nextTick, computed} from "vue"
import {AudioPlayer} from "deciphony-player";

const canvasRef = ref<HTMLCanvasElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)

const zoom = ref(1) // 缩放因子（横向）
const sampleStep = ref(0) // 采样点步长
const amplitudeScale = ref(1) // 振幅缩放因子


// 上传文件
async function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const arrayBuffer = await file.arrayBuffer()
  // 播放器同步引入source
  await player.value.addAudio(arrayBuffer)
  player.value.current = 0
  await nextTick()
  draw()

}

// 绘制波形 + 播放位置
function draw() {
  if (!canvasRef.value) return
  const ctx = canvasRef.value.getContext("2d")!
  const height = canvasRef.value.height
  const seconds = player.value.duration
  const pxPerSecond = 200 * zoom.value
  const width = Math.floor(seconds * pxPerSecond)

  canvasRef.value.width = width
  ctx.clearRect(0, 0, width, height)
  console.log('chicken', currentChannelNumber.value)
  const data = player.value.getChannelData(currentChannelNumber.value)
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
  if (player.value.current > 0) {
    const x = player.value.current * pxPerSecond
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.strokeStyle = "red"
    ctx.stroke()
  }
}

// ----------------------------------------播放逻辑start
const player = ref(new AudioPlayer())
player.value.onProgress = () => {
  updateProgress()
}
onMounted(() => {

})

// 播放/暂停
function play() {
  player.value.play()
}

function pause() {
  player.value.pause()
  updateProgress()
}

function stop() {
  player.value.stop()
  updateProgress()
}

// ----------------------------------------播放逻辑end
// 更新播放进度
function updateProgress() {
  if (player.value.current > player.value.duration) {
    player.value.current = player.value.duration
  }
  draw()
}

// 拖动进度条
function onProgressChange(e: Event) {
  player.value.current = Number((e.target as HTMLInputElement).value)
  draw()

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

const currentChannelNumber = ref(0)

// 切换声道
function switchChannel(channelNumber: number) {
  currentChannelNumber.value = channelNumber
  draw()
}

onMounted(() => {
  if (canvasRef.value) {
    canvasRef.value.height = 200
  }
})
</script>

<template>
  <div class="p-4 space-y-4">
    <input type="file" accept="audio/*" @change="onFileChange"/>
    <button v-for="(item,index) in player.numberOfChannels" @click="switchChannel(index)">声道{{ index + 1 }}</button>
    <div
        ref="containerRef"
        class="border rounded h-52 w-full"
    >
      <canvas ref="canvasRef" class="h-full"></canvas>
    </div>

    <div class="flex items-center space-x-4">
      <button @click="play" class="px-3 py-1 border rounded">
        播放
      </button>
      <button @click="pause" class="px-3 py-1 border rounded">
        暂停
      </button>
      <button @click="stop" class="px-3 py-1 border rounded">
        停止
      </button>

      <label>缩放：</label>
      <input type="range" min="0.5" max="5" step="0.1"
             v-model="zoom" @input="onZoomChange"/>

      <label>采样步长：</label>
      <input type="range" min="1" max="2000" step="1"
             v-model.number="sampleStep" @input="onStepChange"/>
      <span>{{ sampleStep === 0 ? "自动" : sampleStep }}</span>

      <label>振幅高度：</label>
      <input type="range" min="0.1" max="5" step="0.1"
             v-model.number="amplitudeScale" @input="onAmpChange"/>
      <span>{{ amplitudeScale && amplitudeScale.toFixed(1) }}x</span>
    </div>

    <!-- 播放进度条 -->
    <div>
      <label>进度：</label>
      <input type="range"
             :min="0"
             :max="player?.duration || 0"
             step="0.01"
             v-model.number="player.current"
             @input="onProgressChange"/>
      <span>{{ player.current.toFixed(2) }} / {{ player.duration.toFixed(2) || 0 }} s</span>
    </div>
  </div>
</template>

<style scoped>
canvas {
  display: block;
}
</style>
