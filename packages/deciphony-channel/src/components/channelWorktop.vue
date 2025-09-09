<script setup lang="ts">

import ChannelExhibition from "./channelExhibition.vue";
import ChannelEditor from "./channelEditor.vue";
import {Ref, ref} from "vue";


const channelEditorRef = ref<Ref>(null!)
const channelExhibitionRef = ref<Ref>(null!)

function audioBufferGenerate() {
  const {channel, sampleRate} = channelEditorRef.value.getCacheChannelData()

  // 创建 AudioContext
  const audioContext = new AudioContext({sampleRate})

  // 创建一个单声道的 AudioBuffer
  const audioBuffer = audioContext.createBuffer(
      1,               // 声道数（单声道用 1）
      channel.length,  // 每个声道的采样点数
      sampleRate       // 采样率
  )

  // 把数据复制到 buffer
  audioBuffer.copyToChannel(new Float32Array(channel), 0, 0)

  // 播放（可选）
  const source = audioContext.createBufferSource()
  source.buffer = audioBuffer
  return audioBuffer
}

function showAudio() {
  const audioBuffer = audioBufferGenerate()
  channelExhibitionRef.value.addAudioBuffer(audioBuffer)

}

</script>

<template>
  <div class="group">
    <channel-exhibition ref="channelExhibitionRef"/>
  </div>
  <div class="group">
    <channel-editor ref="channelEditorRef"></channel-editor>
  </div>
  <button @click="showAudio">生成音频并展示</button>
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
