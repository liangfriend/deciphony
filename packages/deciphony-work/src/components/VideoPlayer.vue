<script lang="ts" setup>
import {computed, onBeforeUnmount, ref, watch} from 'vue'

const props = defineProps<{
  src: string
}>()

const videoRef = ref<HTMLVideoElement | null>(null)
const playing = ref(false)
const current = ref(0)
const duration = ref(0)
const volume = ref(0.85)
const muted = ref(false)
const hovering = ref(false)

const progress = computed(() => {
  if (!duration.value) return 0
  return Math.min(1, Math.max(0, current.value / duration.value))
})

const displayVolume = computed(() => (muted.value ? 0 : volume.value))
const showBar = computed(() => hovering.value || !playing.value)

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '0:00'
  const s = Math.floor(sec)
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${r.toString().padStart(2, '0')}`
}

function syncVolume() {
  const el = videoRef.value
  if (!el) return
  el.volume = muted.value ? 0 : volume.value
  el.muted = muted.value
}

async function togglePlay() {
  const el = videoRef.value
  if (!el) return
  if (el.paused) {
    syncVolume()
    await el.play()
  } else {
    el.pause()
  }
}

function onTimeUpdate() {
  const el = videoRef.value
  if (!el) return
  current.value = el.currentTime
}

function onLoadedMeta() {
  const el = videoRef.value
  if (!el) return
  duration.value = el.duration || 0
  syncVolume()
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
  const el = videoRef.value
  const bar = ev.currentTarget as HTMLElement
  if (!el || !duration.value) return
  const rect = bar.getBoundingClientRect()
  const ratio = Math.min(1, Math.max(0, (ev.clientX - rect.left) / rect.width))
  el.currentTime = ratio * duration.value
  current.value = el.currentTime
}

function toggleMute() {
  muted.value = !muted.value
  syncVolume()
}

function onVolumeInput(ev: Event) {
  const v = Number((ev.target as HTMLInputElement).value)
  volume.value = Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 1
  if (volume.value > 0) muted.value = false
  syncVolume()
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
  videoRef.value?.pause()
})
</script>

<template>
  <div
    class="sjw-video"
    @click.stop
    @pointerdown.stop
    @pointerenter="hovering = true"
    @pointerleave="hovering = false"
  >
    <video
      ref="videoRef"
      :src="src"
      playsinline
      preload="metadata"
      @click="togglePlay"
      @ended="onEnded"
      @loadedmetadata="onLoadedMeta"
      @pause="onPause"
      @play="onPlay"
      @timeupdate="onTimeUpdate"
    />

    <button
      v-if="!playing"
      class="sjw-video__big-play"
      type="button"
      aria-label="播放"
      @click="togglePlay"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 6.8v10.4L17.2 12 9 6.8z" fill="currentColor"/>
      </svg>
    </button>

    <div class="sjw-video__bar" :class="{'is-visible': showBar}">
      <button
        class="sjw-video__play"
        type="button"
        :aria-label="playing ? '暂停' : '播放'"
        @click="togglePlay"
      >
        <svg v-if="!playing" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 6.8v10.4L17.2 12 9 6.8z" fill="currentColor"/>
        </svg>
        <svg v-else viewBox="0 0 24 24" aria-hidden="true">
          <rect x="7" y="6.5" width="3.5" height="11" rx="1" fill="currentColor"/>
          <rect x="13.5" y="6.5" width="3.5" height="11" rx="1" fill="currentColor"/>
        </svg>
      </button>

      <div class="sjw-video__track" @click="seek">
        <div class="sjw-video__fill" :style="{width: `${progress * 100}%`}"/>
        <i class="sjw-video__knob" :style="{left: `${progress * 100}%`}"/>
      </div>

      <span class="sjw-video__time">
        {{ formatTime(current) }}
        <em>/</em>
        {{ formatTime(duration) }}
      </span>

      <div class="sjw-video__vol">
        <input
          class="sjw-video__vol-range"
          max="1"
          min="0"
          step="0.01"
          type="range"
          :value="displayVolume"
          @input="onVolumeInput"
        />
        <button
          class="sjw-video__vol-btn"
          type="button"
          :aria-label="displayVolume === 0 ? '取消静音' : '静音'"
          @click="toggleMute"
        >
          <svg v-if="displayVolume === 0" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 9.5v5h3.2L12 18V6l-3.8 3.5H5z" fill="currentColor"/>
            <path
              d="M15.2 9.3l4.5 4.5m0-4.5l-4.5 4.5"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-width="1.7"
            />
          </svg>
          <svg v-else viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 9.5v5h3.2L12 18V6l-3.8 3.5H5z" fill="currentColor"/>
            <path
              d="M14.3 9a3.6 3.6 0 0 1 0 6M16.6 7a6 6 0 0 1 0 10"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-width="1.7"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sjw-video {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #111;
  color: #fff;
  user-select: none;
}

.sjw-video video {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: fill;
  cursor: pointer;
}

.sjw-video__big-play {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 22%;
  max-width: 64px;
  min-width: 36px;
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
  display: grid;
  place-items: center;
  border: none;
  border-radius: 50%;
  background: rgba(23, 23, 23, 0.78);
  color: #fff;
  cursor: pointer;
}

.sjw-video__big-play svg {
  width: 52%;
  height: 52%;
  display: block;
}

.sjw-video__bar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  align-items: center;
  column-gap: 2%;
  padding: 2.4% 2.8% 2.8%;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.72));
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease;
}

.sjw-video__bar.is-visible {
  opacity: 1;
  pointer-events: auto;
}

.sjw-video__play,
.sjw-video__vol-btn {
  width: 1.8em;
  height: 1.8em;
  display: grid;
  place-items: center;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: #fff;
  cursor: pointer;
  padding: 0;
}

.sjw-video__play svg,
.sjw-video__vol-btn svg {
  width: 1em;
  height: 1em;
  display: block;
}

.sjw-video__track {
  position: relative;
  min-width: 0;
  height: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.28);
  cursor: pointer;
}

.sjw-video__fill {
  height: 100%;
  border-radius: inherit;
  background: #fff;
  pointer-events: none;
}

.sjw-video__knob {
  position: absolute;
  top: 50%;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #fff;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.sjw-video__time {
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: rgba(255, 255, 255, 0.82);
  white-space: nowrap;
  line-height: 1;
}

.sjw-video__time em {
  font-style: normal;
  margin: 0 1px;
  opacity: 0.55;
}

.sjw-video__vol {
  display: flex;
  align-items: center;
  gap: 4px;
}

.sjw-video__vol-range {
  appearance: none;
  width: 48px;
  height: 4px;
  margin: 0;
  padding: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.28);
  cursor: pointer;
  accent-color: #fff;
}

.sjw-video__vol-range::-webkit-slider-thumb {
  appearance: none;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #fff;
  border: none;
}
</style>
