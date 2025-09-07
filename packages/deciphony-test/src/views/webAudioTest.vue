<script setup lang="ts">
import {onMounted, ref} from "vue";
import {testC4} from '../test/testC4'
import ChannelDataChart from "../components/channelDataChart.vue";

const context = new AudioContext()
let source = context.createBufferSource()
onMounted(async () => {
  bufferCreate()
})

const channdelData = ref<Float32Array<ArrayBuffer>>()

async function bufferCreate() {

  const audioBuffer = await context.decodeAudioData(base64ToArrayBuffer(testC4['C4']))
  const channel = audioBuffer.getChannelData(1) // 获取第 0 声道的采样数组
  // for (let i = 0; i < channelData.length; i++) {
  //   channelData[i] = 1 * Math.sin(2 * Math.PI * 440 * i / 44100) // 440Hz 正弦波
  // }
  console.log('chicken', channel)
  console.log('通道数', audioBuffer.numberOfChannels)
  channdelData.value = channel
}

function setSource() {
  source = context.createBufferSource()
  source.connect(context.destination)
}

function play() {
  setSource()
  source.start()

}

function base64ToArrayBuffer(base64: string) {
  // 先去掉 dataURL 的头部（如果有的话）
  const binaryString = atob(base64.replace(/^data:.*;base64,/, ''));
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer; // 返回 ArrayBuffer
}
</script>

<template>
  <button @click="setSource">查看数据</button>
  <button @click="play">播放</button>
  <channel-data-chart :channel-data="channdelData"></channel-data-chart>
</template>

<style scoped>

</style>