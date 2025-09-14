<script setup lang="ts">
import {onMounted, onBeforeUnmount, ref} from "vue";
import {InstrumentPlayer} from "@deciphony-player";

const player = ref<InstrumentPlayer | null>(null);

onMounted(async () => {
  player.value = new InstrumentPlayer();
  await player.value.createAudioProcessor(); // 等待 Processor 加载完成
});

const freq = ref(440);
const volume = ref(0.5);

// 更新参数
function updateParams() {
  player.value?.updateParameters({
    freq: freq.value,
    volume: volume.value,
  });
}

function play() {
  player.value?.play();
}

function stop() {
  player.value?.stop();
}

// 键盘映射表
const keyToFreq: Record<string, number> = {
  "1": 293.66, // D4
  "2": 329.63, // E4
  "3": 349.23, // F4
  "4": 392.0,  // G4
  "5": 440.0,  // A4
  "6": 493.88, // B4
  "7": 523.25, // C5
};

function handleKeyDown(e: KeyboardEvent) {
  if (keyToFreq[e.key]) {
    freq.value = keyToFreq[e.key];
    updateParams();
    play(); // 每次按键都触发播放
  }
}

// 滚轮控制音量
function handleWheel(e: WheelEvent) {
  // 向上滚 -> 增加音量，向下滚 -> 减小音量
  const delta = e.deltaY < 0 ? 0.05 : -0.05;
  volume.value = Math.min(1, Math.max(0, volume.value + delta));
  updateParams();
}

onMounted(() => {
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("wheel", handleWheel, {passive: true});
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKeyDown);
  window.removeEventListener("wheel", handleWheel);
});
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
