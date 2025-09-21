<script setup lang="ts">
import ChannelEditorMicro from "./channelEditorMicro.vue";
import ChannelEditorMacro from "./channelEditorMacro.vue";
import ChannelExhibition from "./channelExhibition.vue";
import {Ref, ref} from "vue";
import FloatingWindow from "./floatingWindow.vue";


const channelEditorRef = ref<Ref>(null!)
const channelExhibitionRef = ref<Ref>(null!)

function audioBufferGenerate(item) {
  // 创建 AudioContext
  const audioContext = new AudioContext({sampleRate: item.sampleRate})

  // 创建一个单声道的 AudioBuffer
  const audioBuffer = audioContext.createBuffer(
      1,               // 声道数（单声道用 1）
      item.channel.length,  // 每个声道的采样点数
      item.sampleRate       // 采样率
  )

  // 把数据复制到 buffer
  audioBuffer.copyToChannel(new Float32Array(item.channel), 0, 0)

  // 播放（可选）
  const source = audioContext.createBufferSource()
  source.buffer = audioBuffer
  return audioBuffer
}

function addToAudioShow(item) {
  const cloneData = JSON.parse(JSON.stringify(item));
  const audioBuffer = audioBufferGenerate(cloneData)
  channelExhibitionRef.value.addAudioBuffer(audioBuffer)

}

function addToMicroEditor(item) {
  channelEditorRef.value.setChannel(item)
}

// function addToMacroEditor(item) {
//
// }

// 浮窗
const show = ref(true)

// 缓存波形列表
const cacheChannelDataList = ref<{ channel: Array<number>, sampleRate: number, name: string }[]>([])

function cacheChannelData(channelData: { channel: Array<number>, sampleRate: number, name: string }) {
  cacheChannelDataList.value.push(channelData)
}
</script>

<template>

  <div class="group">
    <channel-exhibition @cache-channel="cacheChannelData" ref="channelExhibitionRef"/>
  </div>
  <div class="group">
    <channel-editor-micro @cache-channel="cacheChannelData" ref="channelEditorRef"></channel-editor-micro>
  </div>
  <div class="group">
    <!--    <channel-editor-macro ref="channelEditorRef"></channel-editor-macro>-->
  </div>
  <floating-window :initial-x="900" :initial-y="0" v-model="show">
    <div>

    </div>
    缓存波形列表：
    <div class="max-h-60 w-96">
      <div class=" flex justify-between bg-amber-200 mb-2" v-for="(item,index) in cacheChannelDataList">
        <div>{{ item.name }}</div>
        <div>
          <button @click="addToAudioShow(item)">音频预览</button>
          <button @click="addToMicroEditor(item)">波形编辑</button>
          <!--          <button @click="addToMacroEditor(item)">谐波编辑</button>-->
        </div>
      </div>
    </div>
  </floating-window>
</template>

<style scoped>

.group {
  border: 2px dashed #ccc;
  border-radius: 12px;
}

button {
  border-radius: 6px;
  padding: 2px 6px;
  border: 1px solid black;
}
</style>
<style>
* {
  user-select: none;
}
</style>