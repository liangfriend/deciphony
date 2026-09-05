<script lang="ts" setup>
import {computed, onBeforeUnmount, ref, watch} from 'vue'

const props = defineProps<{
  src: string
}>()

const audioRef = ref<HTMLAudioElement | null>(null)
const playing = ref(false)
const current = ref(0)
const duration = ref(0)

const progress = computed(() => {
  if (!duration.value) return 0
  return Math.min(1, Math.max(0, current.value / duration.value))
})

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '0:00'
  const s = Math.floor(sec)
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${r.toString().padStart(2, '0')}`
}

async function togglePlay() {
  const el = audioRef.value
  if (!el) return
  if (el.paused) {
    await el.play()
  } else {
    el.pause()
  }
}

function onTimeUpdate() {
  const el = audioRef.value
  if (!el) return
  current.value = el.currentTime
}

function onLoadedMeta() {
  const el = audioRef.value
  if (!el) return
  duration.value = el.duration || 0
}

function onPlay() {
  playing.value = true
}

function onPause() {
  playing.value = false
}

function onEnded() {
  playing.value = false
  current.value = 0
}

function seek(ev: MouseEvent) {
  const el = audioRef.value
  const bar = ev.currentTarget as HTMLElement
  if (!el || !duration.value) return
  const rect = bar.getBoundingClientRect()
  const ratio = Math.min(1, Math.max(0, (ev.clientX - rect.left) / rect.width))
  el.currentTime = ratio * duration.value
  current.value = el.currentTime
}

watch(
  () => props.src,
  () => {
    playing.value = false
    current.value = 0
    duration.value = 0
  },
)

onBeforeUnmount(() => {
  audioRef.value?.pause()
})
</script>

<template>
  <div class="sjw-audio" @click.stop @pointerdown.stop>
    <audio
      ref="audioRef"
      :src="src"
      preload="metadata"
      @ended="onEnded"
      @loadedmetadata="onLoadedMeta"
      @pause="onPause"
      @play="onPlay"
      @timeupdate="onTimeUpdate"
    />
    <button class="sjw-audio__play" type="button" @click="togglePlay">
      {{ playing ? '暂停' : '播放' }}
    </button>
    <div class="sjw-audio__track" @click="seek">
      <div class="sjw-audio__fill" :style="{width: `${progress * 100}%`}"/>
    </div>
    <span class="sjw-audio__time">{{ formatTime(current) }}/{{ formatTime(duration) }}</span>
  </div>
</template>

<style scoped>
.sjw-audio {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  gap: 2%;
  padding: 4% 3%;
  background: rgba(48, 49, 51, 0.88);
  color: #fff;
  border-radius: 6px;
  user-select: none;
}

.sjw-audio__play {
  flex: 0 0 auto;
  height: 70%;
  min-height: 22px;
  padding: 0 0.8em;
  border: none;
  border-radius: 4px;
  background: #409eff;
  color: #fff;
  font-size: clamp(10px, 18%, 14px);
  cursor: pointer;
  white-space: nowrap;
}

.sjw-audio__track {
  flex: 1;
  min-width: 0;
  height: 28%;
  min-height: 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.25);
  cursor: pointer;
  overflow: hidden;
}

.sjw-audio__fill {
  height: 100%;
  background: #79bbff;
  border-radius: inherit;
}

.sjw-audio__time {
  flex: 0 0 auto;
  font-size: clamp(9px, 16%, 12px);
  opacity: 0.9;
  white-space: nowrap;
}
</style>
