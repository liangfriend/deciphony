<!--宏观编辑器-->
<script setup lang="ts">
import {ref, onMounted, nextTick, computed, watch} from "vue"
import ChannelWindow from "./channelWindow.vue";

const canvasRef = ref<HTMLCanvasElement>(null!)
const channelWindowRef = ref<{ draw: () => void }>(null!)
const zoom = ref(1) // 缩放因子（横向）
const sampleStep = ref(1) // 采样点步长
const sampleRate = ref(44100) // 采样率
const amplitudeScale = ref(1) // 振幅缩放因子
const channelData = ref<number[]>([])
const selectedIndx = ref(0)

// slider 控制项
function onZoomChange(e: Event) {
  zoom.value = Number((e.target as HTMLInputElement).value)
  channelWindowRef.value.draw()
}

// 采样步长
function onStepChange(e: Event) {
  sampleStep.value = Number((e.target as HTMLInputElement).value)
  channelWindowRef.value.draw()
}

// 振幅高度
function onAmpChange(e: Event) {
  amplitudeScale.value = Number((e.target as HTMLInputElement).value)
  channelWindowRef.value.draw()
}

// 生成逻辑
function channelGenerate() {
  channelData.value = Array.from({length: dataLength.value}, (v, i) => 0);
  setTimeout(() => {
    channelWindowRef.value.draw()
  })

}


// 波形时间
const duration = computed(() => {
  return channelData.value.length * copyCount.value / sampleRate.value
})
// 数据长度
const dataLength = ref(169)
// 复制次数
const copyCount = ref(261)
// 当前选中点索引
const currentSelectedDotIndex = ref(0)
// 影响范围
const influenceLength = ref(0)
// 新增：当这些会影响绘制的状态改变时也触发重绘
watch([currentSelectedDotIndex, zoom, sampleStep, amplitudeScale, dataLength], () => {
  channelWindowRef.value?.draw()
})

watch(channelData, () => {
  channelWindowRef.value?.draw()
}, {
  deep: true
})

function getWeight(offset: number, range: number, type: number): number {
  if (range <= 0) return 0
  const d = Math.abs(offset) / (range + 1) // 距离比值 0~1
  switch (type) {
    case 0: {
      // 默认：线性衰减
      return 1 - d
    }

    case 1: {
      return 1 - (d) ** 2
    }

    case 2: {
      return (1 - d) ** 2
    }

    default:
      return 1 - d
  }
}

// 监听选中点高度变化，应用影响范围算法

function changeHeight(val: number) {

  if (val === 0) return
  channelData.value[currentSelectedDotIndex.value] += val
  const center = currentSelectedDotIndex.value
  const range = influenceLength.value
  const len = channelData.value.length

  for (let offset = -range; offset <= range; offset++) {
    const idx = center + offset
    if (idx < 0 || idx >= len) continue
    if (idx === center) continue // 中心点已直接修改过

    // 权重 = 距离反比（越远影响越小）
    const weight = getWeight(offset, range, +influenceType.value)
    channelData.value[idx] += val * weight
  }

  channelWindowRef.value.draw()

}

const influenceType = ref(0) // 默认，向下凹 向上凸

const cacheChannel = ref<{ channel: Array<number>, sampleRate: number }>({
  channel: [], sampleRate: 0
})

function cache() {
  cacheChannel.value.channel = Array(copyCount.value).fill(channelData.value).flat();
  cacheChannel.value.sampleRate = sampleRate.value
}

function getCacheChannelData(): { channel: Array<number>, sampleRate: number } {
  return cacheChannel.value
}

function pointClick(payload) {
}

onMounted(() => {
  if (canvasRef.value) {
    canvasRef.value.height = 200
  }
  channelData.value = []

  // for (let i = 0; i < 400; i++) {
  //   channelData.value.push(Math.sin(i % Math.PI))
  // }
})

defineExpose({getCacheChannelData})
</script>

<template>
  <div class="p-4 space-y-4">
    <div class="text-2xl">宏观编辑</div>
    <div class="flex items-center">
      <label>波形生成：</label>
      <div class="mr-4">
        数据长度：<input type="number" v-model="dataLength"/>
      </div>

      <button @click="channelGenerate">生成</button>
      <div>标准C4(261.63赫兹)，再采样率为444100时，一秒的音频数据需要168.55个数据点</div>
    </div>
    <div class="flex items-center space-x-4 " v-if="channelData.length">
      <label>当前编辑波形信息：</label>
      <div class="mr-4">
        数据长度：{{ channelData.length }}
      </div>
    </div>
    <div
        class="border rounded h-52 w-full overflow-auto hide-scrollbar"
    >
      <channel-window
          :zoom="zoom"
          :channel-data="channelData"
          :sampleStep="sampleStep"
          :amplitude-scale="amplitudeScale"
          @pointClick="pointClick"
          ref="channelWindowRef"></channel-window>
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
    <div class="flex items-center">
      <label>音频生成：</label>
      <div class="">
        采样率：<input type="number" class="w-24" v-model="sampleRate"/>
      </div>
      <div class="w-52">音频时长：{{ duration }}秒</div>
      <div class="w-52">音频音高：{{ duration }}</div>
      <div class="mr-2">
        复制次数：<input type="number" class="w-24" v-model="copyCount"/>
      </div>
      <button class="w-36" @click="cache">缓存波形</button>
      <div class="w-64" v-if="cacheChannel.channel.length">已缓存： 长度：{{ cacheChannel.channel.length }}</div>
    </div>
    <div class="flex items-center" v-if="channelData.length">
      <label>选中点编辑：</label>
      <div class="mr-4">
        选中点索引：<input type="number" v-model="currentSelectedDotIndex"/>
      </div>
      <div class="mr-4 w-64 flex">
        <div class="w-fit">高度：</div>
        <div class="flex justify-between w-52 items-center">
          <button @click="changeHeight(-0.05)">-</button>
          <div>{{ channelData[currentSelectedDotIndex] }}</div>
          <button @click="changeHeight(0.05)">+</button>
        </div>

      </div>
      <div class="mr-4">
        影响范围：<input type="number" step="1" v-model="influenceLength"/>
      </div>

    </div>
    <div class="flex items-center" v-if="channelData.length">
      <div class="mr-4">
        影响模式：
        <label><input type="radio" value="0" v-model.number="influenceType"/> 直线</label>
        <label><input type="radio" value="1" v-model.number="influenceType"/> 圆滑</label>
        <label><input type="radio" value="2" v-model.number="influenceType"/> 尖锐</label>
      </div>
    </div>

  </div>
</template>

<style scoped>
canvas {
  display: block;

}

input[type='number'] {
  outline: 1px solid black;
}

button {
  border-radius: 6px;
  padding: 2px 6px;
  border: 1px solid black;
}
</style>
