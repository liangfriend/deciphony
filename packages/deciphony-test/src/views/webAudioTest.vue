<script setup lang="ts">
import {onMounted, onBeforeUnmount, ref} from "vue";
import {WindInstrumentPlayer} from "@deciphony/player";
import {WindInstrumentEnum} from "@deciphony/player";

const player = ref<WindInstrumentPlayer | null>(null);

onMounted(async () => {

  player.value = new WindInstrumentPlayer();
  await player.value.createAudioProcessor('Desolate'); // 等待 Processor 加载完成
});

const freq = ref(440);
const volume = ref(0.5);

function midiToHz(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}


function play() {
  player.value?.start();
}

function stop() {
  player.value?.stop();
}

// 键盘映射表
const keyToFreq: Record<string, number> = {
  "1": 293.66, // D42134541211
  "2": 329.63, // E4
  "3": 349.23, // F4
  "4": 392.0,  // G4
  "5": 440.0,  // A4
  "6": 493.88, // B4
  "7": 523.25, // C5
};

function handleKeyDown(e: KeyboardEvent) {
  if (keyToFreq[e.key]) {
    player.value?.setFrequency(keyToFreq[e.key])
  }
}


onMounted(() => {
  window.addEventListener("keydown", handleKeyDown);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKeyDown);
});

// 更新参数
function updateParams() {
  player.value?.setFrequency(freq.value);
}


</script>

<template>
  <button @click="play">播放</button>
  <button @click="stop">停止</button>
  <div>
    <label>
      频率: {{ freq }} Hz
      <input type="range" min="100" max="2000" v-model="freq" @input="updateParams"/>
    </label>
    <br/>
    <label>
      音量: {{ volume.toFixed(2) }}
      <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          v-model="volume"
          @input="updateParams"
      />
    </label>
  </div>
  <p>提示：按键盘 <strong>1-7</strong> 可演奏 D4 到 C5 🎹，滚轮 ↑↓ 控制音量 🔊</p>
</template>
