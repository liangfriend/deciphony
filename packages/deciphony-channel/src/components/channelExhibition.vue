<script setup lang="ts">
import {ref, onMounted, nextTick, computed, watchEffect} from "vue"
import {PlayerManager,} from "@deciphony-player";
import ChannelWindow from "./channelWindow.vue";
import {ChannlWindowRef, HighlightItem} from "@core/types";
import Player from "deciphony-player/dist/class/Player";

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
  cacheChannelData.value.name = file.name
  // 播放器同步引入source
  await player.value.addAudio(arrayBuffer)
  const floatArray = player.value.getChannelData()

  channelData.value = Array.from(floatArray);
  await nextTick()
}

// 清空已添加的文件
function clearFile() {
  const input = document.getElementById("channelExhibitionFileInput") as HTMLInputElement
  input.value = "" //  清空文件
}

async function addAudioBuffer(audioBuffer: AudioBuffer) {
  await player.value.addAudio(audioBuffer)
  channelData.value = player.value.getChannelData()
  clearFile()
  await nextTick()
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

const highlightList = ref([{color: 'red', index: 0, name: 'progress', key: 'progress', show: true}])

// 拖动进度条
function onProgressChange(e: Event) {
  player.value.current = Number((e.target as HTMLInputElement).value)

}

watchEffect(() => {
  const progressLine = highlightList.value.find(e => e.name === 'progress')

  if (progressLine && player.value) {

    progressLine.index
        = Math.round(player.value.current / player.value.duration * player.value.getChannelData(0)?.length)
  }

})

// slider 控制项
function onZoomChange(e: Event) {
  zoom.value = Number((e.target as HTMLInputElement).value)
}

// 采样步长
function onStepChange(e: Event) {
  sampleStep.value = Number((e.target as HTMLInputElement).value)
}

// 振幅高度
function onAmpChange(e: Event) {
  amplitudeScale.value = Number((e.target as HTMLInputElement).value)
}

const currentChannelNumber = ref(0)

// 切换声道
function switchChannel(channelNumber: number) {
  currentChannelNumber.value = channelNumber
}

const numberOfChannels = computed(() => {
  return player.value?.numberOfChannels || []
})

function pointClick(payload: { index: number, value: number }) {
  highlightList.value.push({
    index: payload.index,
    key: '' + Date.now(),
    name: '新标记',
    color: 'orange',
    show: true
  })
}

const selectedMarkKey = ref('')

function activeMark(item: HighlightItem) {
  const target = highlightList.value.find(e => e === item)!
  target.color = '#4096ff'
}

function deactiveMark(item: HighlightItem) {
  const target = highlightList.value.find(e => e === item)!
  if (target.key !== selectedMarkKey.value) {
    target.color = 'orange'
  } else {
    target.color = 'green'
  }

}

function selectMark(item: HighlightItem) {
  // 取消之前的高亮
  const preTarget = highlightList.value.find(e => e.key === selectedMarkKey.value)
  if (preTarget) {
    preTarget.color = 'orange'
  }
  const target = highlightList.value.find(e => e === item)!
  selectedMarkKey.value = target.key
  target.color = 'green'
}

function deleteMark(item: HighlightItem) {
  const targetIndex = highlightList.value.findIndex(e => e === item)
  highlightList.value.splice(targetIndex, 1)
}

function addMark(item: { index: number, key: string, name: string }) {
  highlightList.value.push({
    show: true,
    color: 'orange',
    index: item.index,
    key: item.key,
    name: item.name
  })
}

const markAddInfo = ref({
  index: 0,
  key: '',
  name: ''
})
// 区域编辑
const selectRange = ref({
  startIndex: 0,
  endIndex: 0,
  relativeMove: 0
})

function clipChannelData(
    startIndex: number,
    endIndex: number,
    type: 'outside' | 'inside' = 'inside'
) {
  if (endIndex < startIndex) {
    throw new Error("endIndex 必须 >= startIndex")
  }

  // 取消高亮的标记线
  selectedMarkKey.value = ''

  if (type === 'inside') {
    // === 内裁剪：删掉 [startIndex, endIndex]
    const deleteCount = endIndex + 1 - startIndex
    channelData.value.splice(startIndex, deleteCount)

    highlightList.value = highlightList.value
        .filter(item => item.index < startIndex || item.index > endIndex || item.key === 'selection')
        .map(item => {
          // 操作当前选择标记线
          if (!(item.index < startIndex || item.index > endIndex) && item.key === 'selection') {
            return {...item, index: 0}
          }
          if (item.index > endIndex) {
            return {...item, index: item.index - deleteCount}
          }
          return item
        })
  } else {
    // === 外裁剪：保留 [startIndex, endIndex]
    channelData.value = channelData.value.slice(startIndex, endIndex + 1)

    highlightList.value = highlightList.value
        .filter(item => (item.index >= startIndex && item.index <= endIndex) || item.key === 'selection')
        .map(item => {
          // 操作当前选择标记线
          if (!(item.index >= startIndex && item.index <= endIndex) && item.key === 'selection') {
            return {...item, index: 0}
          }
          // 索引重新映射到新的数组 (从 0 开始)
          return {...item, index: item.index - startIndex}
        })
  }
}

// 波形导出
const cacheChannelData = ref<{ channel: Array<number>, sampleRate: number, name: string }>({
  channel: [], sampleRate: 44100, name: ''
})
const emits = defineEmits(['cacheChannel'])

function cacheChannel() {
  cacheChannelData.value.channel = channelData.value
  cacheChannelData.value.sampleRate = player.value.sampleRate
  emits('cacheChannel', JSON.parse(JSON.stringify(cacheChannelData.value)));
}


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
    <div class="text-2xl">音频波形展示</div>
    <input type="file" accept="audio/*" id="channelExhibitionFileInput" @change="onFileChange"/>
    <span v-if="player">采样率：{{ player.sampleRate }}</span>
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
          @pointClick="pointClick"
          ref="channelWindowRef"></channel-window>
    </div>

    <div class="flex items-center space-x-4 ">


      <label>缩放：</label>{{ zoom }}
      <input type="range" min="0.5" :max="Math.max(5,channelData.length/1000)" step="0.1"
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
      <button @click="play">
        播放
      </button>
      <button @click="pause">
        暂停
      </button>
      <button @click="stop">
        停止
      </button>
      <label>进度：</label>
      <input type="range"
             :min="0"
             :max="player?.duration || 0"
             step="0.01"
             v-model.number="player.current"
             @input="onProgressChange"/>
      <span>{{ player.current.toFixed(2) }} / {{ player.duration.toFixed(2) || 0 }} s</span>
    </div>
    <div comment="编辑区" class="region" v-if="channelData.length">
      <div comment="标记点位编辑" class="tag">
        <div>标记列表：</div>
        <div class="overscroll-x-auto flex p-2 bg-amber-100 h-10">
          <div class="hover:bg-[#4096ff] flex  items-center mr-4 bg-amber-200 w-fit px-2"
               @mouseenter="activeMark(item)"
               @mouseleave="deactiveMark(item)"
               @click="selectMark(item)"
               :style="{backgroundColor: item.key === selectedMarkKey?'green':'#fee685'}"
               v-for="(item,index) in highlightList"
               v-show="item.key !=='progress'">
            {{ item.name }}
            <div @click.stop="deleteMark(item) "
                 class="ml-2 bg-white w-4 h-4 flex justify-center items-center text-xs rounded-[50%]">X
            </div>
          </div>
        </div>
        <div class="flex justify-between">
          <div comment="左侧" v-if="highlightList.find(e => e.key === selectedMarkKey)">
            <div>当前选择标记信息：</div>
            <div>索引：<input type="number" v-model="highlightList.find(e=>e.key===selectedMarkKey)!.index"/>
            </div>
            <div>高度：{{ channelData[highlightList.find(e => e.key === selectedMarkKey)!.index] }}</div>
            <div>名称：<input type="text" v-model="highlightList.find(e => e.key === selectedMarkKey)!.name"/></div>
          </div>
          <div v-else commment="保持布局"></div>
          <div comment="右侧">
            <button @click="addMark(markAddInfo)">添加标记</button>
            <div>索引：<input type="number" v-model="markAddInfo.index"/></div>
            <div>键名：<input type="text" v-model="markAddInfo.key"/></div>
            <div>名称<input type="text" v-model="markAddInfo.name"/></div>
          </div>
        </div>
      </div>
      <div comment="选区编辑" class="tag">
        <div>区域编辑(两侧开区间)</div>
        <div>
          起点索引<input type="number" v-model="selectRange.startIndex"/>-
          <input type="number" v-model="selectRange.endIndex"/>终点索引
        </div>
        <!--            TODO 二期功能-->
        <!--            <button>仅保留选区</button><button>删除选区</button>-->
        <div>裁剪：<input type="number" v-model="selectRange.relativeMove" step="0.01"/>

          <button @click="clipChannelData(selectRange.startIndex,selectRange.endIndex,'inside')">删除片段</button>
          <button @click="clipChannelData(selectRange.startIndex,selectRange.endIndex,'outside')">保留片段</button>
        </div>
      </div>


    </div>
    <div comment="导出区" class="flex items-center region" v-if="channelData.length">
      <button class="w-36" @click="cacheChannel">缓存波形</button>
      <div class="w-64">波形名：<input type="text" v-model="cacheChannelData.name"></div>
    </div>
  </div>
</template>

<style scoped>
canvas {
  display: block;

}

.region {
  background: rgba(57, 68, 76, 0.2);
  margin-bottom: 6px;
  padding: 6px;
}

.tag {
  border: 1px dashed red;
  margin-bottom: 6px;
  margin-top: 6px;
}

input[type='number'], input[type='text'] {
  outline: 1px solid black;
}

button {
  border-radius: 6px;
  padding: 2px 6px;
  border: 1px solid black;
}
</style>