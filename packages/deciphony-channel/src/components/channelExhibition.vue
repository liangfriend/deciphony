<script setup lang="ts">
import {ref, onMounted, nextTick, computed, watchEffect} from "vue"
import {PlayerManager, Player} from "deciphony-player";
import ChannelWindow from "./channelWindow.vue";
import {ChannlWindowRef} from "@core/types";

const playerManager = ref<PlayerManager>();
const channelWindowRef = ref<ChannlWindowRef>(null!)
const zoom = ref(1) // 缩放因子（横向）
const sampleStep = ref(1) // 采样点步长
const amplitudeScale = ref(1) // 振幅缩放因子
const channelData = ref<Array<number>>([]) // 波形数据
const sampleRate = ref(1) // 采样率

// 上传文件
async function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const arrayBuffer = await file.arrayBuffer()

  // 播放器同步引入source
  await player.value.addAudio(arrayBuffer)
  channelData.value = player.value.getChannelData()
  await nextTick()
  channelWindowRef.value.draw()
}


async function addAudioBuffer(audioBuffer: AudioBuffer) {
  await player.value.addAudio(audioBuffer)
  channelData.value = player.value.getChannelData()
  await nextTick()
  channelWindowRef.value.draw()
}


// ----------------------------------------播放逻辑start
const player = ref<Player>(null)


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

}

const highlightList = ref([{color: 'red', index: 0, name: 'progress'}])

// 拖动进度条
function onProgressChange(e: Event) {
  player.value.current = Number((e.target as HTMLInputElement).value)
  channelWindowRef.value.draw()

}

watchEffect(() => {
  const progressLine = highlightList.value.find(e => e.name === 'progress')

  if (progressLine && player.value) {

    progressLine.index
        = Math.round(player.value.current / player.value.duration * player.value.getChannelData(0)?.length)
    channelWindowRef.value.draw()
  }

})

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

const currentChannelNumber = ref(0)

// 切换声道
function switchChannel(channelNumber: number) {
  currentChannelNumber.value = channelNumber
  channelWindowRef.value.draw()
}

const numberOfChannels = computed(() => {
  return player.value?.numberOfChannels || []
})
onMounted(() => {
  playerManager.value = new PlayerManager()
  player.value = playerManager.value.addPlayer('audio', 'audio')
  player.value.onProgress = () => {
    updateProgress()
  }
})
defineExpose({addAudioBuffer})
</script>

<template>
  <div class="p-4 space-y-4">
    <input type="file" accept="audio/*" @change="onFileChange"/>
    <button v-for="(item,index) in numberOfChannels" @click="switchChannel(index)">声道{{ index + 1 }}</button>
    <div
        class="border rounded h-52 w-full overflow-auto hide-scrollbar"
    >
      <channel-window
          :zoom="zoom"
          :channel-data="channelData"
          :sampleStep="sampleStep"
          :amplitude-scale="amplitudeScale"
          :highlight-list="highlightList"
          ref="channelWindowRef"></channel-window>
    </div>

    <div class="flex items-center space-x-4 ">
      <button @click="play">
        播放
      </button>
      <button @click="pause">
        暂停
      </button>
      <button @click="stop">
        停止
      </button>

      <label>缩放：</label>
      <input type="range" min="0.5" max="100" step="0.1"
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

    <!-- 播放进度条 -->
    <div v-if="player">
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

button {
  border-radius: 6px;
  padding: 2px 6px;
  border: 1px solid black;
}
</style>
