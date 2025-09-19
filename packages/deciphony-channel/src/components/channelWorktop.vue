<script setup lang="ts">
import ChannelEditorMicro from "./channelEditorMicro.vue";
import ChannelEditorMacro from "./channelEditorMacro.vue";
import ChannelExhibition from "./channelExhibition.vue";
import {Ref, ref} from "vue";
import FloatingWindow from "./floatingWindow.vue";



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

// 浮窗
const show=ref(true)
</script>

<template>

    <button @click="showAudio">生成音频并展示</button>
    <div class="group">
        <channel-exhibition ref="channelExhibitionRef"/>
    </div>
    <div class="group">
        <channel-editor-micro ref="channelEditorRef"></channel-editor-micro>
    </div>
    <div class="group">
        <channel-editor-macro ref="channelEditorRef"></channel-editor-macro>
    </div>
    <floating-window v-model="show">
        缓存波形列表：
        缓存音频列表：
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
