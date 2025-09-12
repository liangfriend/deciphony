<script setup lang="ts">
import {onMounted, ref} from "vue";

let audioContext: AudioContext | null = null;
let newProcessorNode: AudioWorkletNode | null = null;

async function createMyAudioProcessor() {
  if (!audioContext) {
    try {
      audioContext = new AudioContext();
      await audioContext.audioWorklet.addModule(
          new URL("./class/WhiteNoiseProcessor.js", import.meta.url)
      );
    } catch (e) {
      console.error("Failed to load processor", e);
      return null;
    }
  }

  return new AudioWorkletNode(audioContext, "my-audio-processor");
}

onMounted(async () => {
  newProcessorNode = await createMyAudioProcessor();
  if (newProcessorNode) {
    newProcessorNode.connect(audioContext!.destination);
  }
});

const freq = ref(440);
const volume = ref(0.5);

function updateFreq() {
  newProcessorNode?.port.postMessage({type: "setFreq", value: freq.value});
}

function updateVolume() {
  newProcessorNode?.port.postMessage({type: "setVolume", value: volume.value});
}

function play() {
  if (audioContext?.state === "suspended") {
    audioContext.resume();
  }
}
</script>

<template>
  <buton @click="play">播放</buton>
  <div>
    <label>
      频率: {{ freq }} Hz
      <input type="range" min="100" max="2000" v-model="freq" @input="updateFreq"/>
    </label>
    <br/>
    <label>
      音量: {{ volume }}
      <input type="range" min="0" max="1" step="0.01" v-model="volume" @input="updateVolume"/>
    </label>
  </div>
</template>
