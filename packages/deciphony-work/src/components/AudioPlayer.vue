<script lang="ts" setup>
import {computed, onBeforeUnmount, ref, watch} from 'vue'

const props = defineProps<{
  src: string
}>()

const audioRef = ref<HTMLAudioElement | null>(null)
const playing = ref(false)
const current = ref(0)
const duration = ref(0)
const volume = ref(0.85)
const muted = ref(false)

const progress = computed(() => {
  if (!duration.value) return 0
  return Math.min(1, Math.max(0, current.value / duration.value))
})

const displayVolume = computed(() => (muted.value ? 0 : volume.value))

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '0:00'
  const s = Math.floor(sec)
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${r.toString().padStart(2, '0')}`
}

function syncAudioVolume() {
  const el = audioRef.value
  if (!el) return
  el.volume = muted.value ? 0 : volume.value
  el.muted = muted.value
}

async function togglePlay() {
  const el = audioRef.value
  if (!el) return
  if (el.paused) {
    syncAudioVolume()
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
  syncAudioVolume()
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

function toggleMute() {
  muted.value = !muted.value
  syncAudioVolume()
}

function onVolumeInput(ev: Event) {
  const v = Number((ev.target as HTMLInputElement).value)
  volume.value = Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 1
  if (volume.value > 0) muted.value = false
  syncAudioVolume()
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

    <button
      class="sjw-audio__play"
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

    <div class="sjw-audio__mid">
      <div class="sjw-audio__track" @click="seek">
        <div class="sjw-audio__fill" :style="{width: `${progress * 100}%`}"/>
        <i class="sjw-audio__knob" :style="{left: `${progress * 100}%`}"/>
      </div>
      <span class="sjw-audio__time">
        {{ formatTime(current) }}
        <em>/</em>
        {{ formatTime(duration) }}
      </span>
    </div>

    <div class="sjw-audio__vol">
      <div class="sjw-audio__vol-pop">
        <input
          class="sjw-audio__vol-range"
          max="1"
          min="0"
          step="0.01"
          type="range"
          :value="displayVolume"
          @input="onVolumeInput"
        />
      </div>
      <button
        class="sjw-audio__vol-btn"
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
        <svg v-else-if="displayVolume < 0.45" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 9.5v5h3.2L12 18V6l-3.8 3.5H5z" fill="currentColor"/>
          <path
            d="M14.4 10.4a2.2 2.2 0 0 1 0 3.2"
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
</template>

<style scoped>
.sjw-audio {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr) 36px;
  align-items: center;
  column-gap: 8px;
  padding: 0 10px;
  border-radius: 10px;
  background: #fff;
  border: 1px solid #ececec;
  color: #222;
  user-select: none;
}

.sjw-audio__play {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border: none;
  border-radius: 50%;
  background: #171717;
  color: #fff;
  cursor: pointer;
}

.sjw-audio__play:hover {
  background: #2a2a2a;
}

.sjw-audio__play svg,
.sjw-audio__vol-btn svg {
  width: 15px;
  height: 15px;
  display: block;
}

.sjw-audio__mid {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.sjw-audio__track {
  position: relative;
  flex: 1;
  min-width: 0;
  height: 4px;
  border-radius: 999px;
  background: #ebebeb;
  cursor: pointer;
}

.sjw-audio__fill {
  height: 100%;
  border-radius: inherit;
  background: #171717;
  pointer-events: none;
}

.sjw-audio__knob {
  position: absolute;
  top: 50%;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #171717;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.sjw-audio__time {
  flex: 0 0 auto;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: #8a8a8a;
  white-space: nowrap;
  line-height: 1;
}

.sjw-audio__time em {
  font-style: normal;
  margin: 0 1px;
  opacity: 0.5;
}

.sjw-audio__vol {
  position: relative;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sjw-audio__vol-btn {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #444;
  cursor: pointer;
}

.sjw-audio__vol-btn:hover {
  background: #f3f3f3;
}

/* 竖条在右侧栏内弹出，不压进度条 */
.sjw-audio__vol-pop {
  position: absolute;
  right: 0;
  top: 6px;
  bottom: 6px;
  width: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.12);
  opacity: 0;
  pointer-events: none;
  z-index: 2;
}

.sjw-audio__vol:hover .sjw-audio__vol-pop,
.sjw-audio__vol:focus-within .sjw-audio__vol-pop {
  opacity: 1;
  pointer-events: auto;
}

.sjw-audio__vol-range {
  appearance: none;
  writing-mode: vertical-lr;
  direction: rtl;
  width: 4px;
  height: 100%;
  max-height: 44px;
  margin: 0;
  padding: 0;
  border-radius: 999px;
  background: #e8e8e8;
  cursor: pointer;
  accent-color: #171717;
}

.sjw-audio__vol-range::-webkit-slider-runnable-track {
  width: 4px;
  border-radius: 999px;
  background: #e8e8e8;
}

.sjw-audio__vol-range::-webkit-slider-thumb {
  appearance: none;
  width: 10px;
  height: 10px;
  margin-left: -3px;
  border-radius: 50%;
  background: #171717;
  border: none;
}

.sjw-audio__vol-range::-moz-range-track {
  width: 4px;
  border-radius: 999px;
  background: #e8e8e8;
}

.sjw-audio__vol-range::-moz-range-thumb {
  width: 10px;
  height: 10px;
  border: none;
  border-radius: 50%;
  background: #171717;
}
</style>
