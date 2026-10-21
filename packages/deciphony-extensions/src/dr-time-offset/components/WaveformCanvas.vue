<script lang="ts" setup>
import {computed, onBeforeUnmount, onMounted, ref, watch} from 'vue'
import {WAVE_PEAKS_PER_SECOND, WAVEFORM_HEIGHT} from '../constants'

/** 位图最大宽度：只画可见窗口，超宽视口也不至于撑爆 canvas */
const MAX_BITMAP_WIDTH = 4096

const props = withDefaults(
  defineProps<{
    /** 振幅峰值 0~1 */
    peaks: ArrayLike<number>
    peaksPerSecond?: number
    pxPerSecond: number
    /** 波形区逻辑总宽（CSS） */
    width: number
    height?: number
    /** 振幅倍数（只放大波形，容器高度不变） */
    gain?: number
    /** 滚动容器可见窗口：scrollLeft / clientWidth */
    viewLeft?: number
    viewWidth?: number
  }>(),
  {
    peaksPerSecond: WAVE_PEAKS_PER_SECOND,
    height: WAVEFORM_HEIGHT,
    gain: 1,
    viewLeft: 0,
    viewWidth: 0,
  },
)

const emit = defineEmits<{
  /** 点击波形：对应秒数 */
  seek: [sec: number]
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)

const drawWidth = computed(() => {
  const total = Math.max(1, Math.floor(props.width))
  const view = props.viewWidth > 0 ? Math.ceil(props.viewWidth) : total
  return Math.min(total, view, MAX_BITMAP_WIDTH)
})
const drawLeft = computed(() => {
  const total = Math.max(1, Math.floor(props.width))
  return Math.max(0, Math.min(Math.floor(props.viewLeft), total - drawWidth.value))
})

function draw() {
  const canvas = canvasRef.value
  if (!canvas) return
  const w = drawWidth.value
  const h = props.height
  const left = drawLeft.value
  const dpr = Math.min(window.devicePixelRatio || 1, 2)

  canvas.width = Math.floor(w * dpr)
  canvas.height = Math.floor(h * dpr)
  canvas.style.width = `${w}px`
  canvas.style.height = `${h}px`

  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = '#f7f8fa'
  ctx.fillRect(0, 0, w, h)

  const data = props.peaks
  if (!data.length) {
    ctx.fillStyle = '#909399'
    ctx.font = '12px sans-serif'
    ctx.fillText('无波形（请先选择音频）', 12, h / 2)
    return
  }

  const mid = h / 2
  const amp = mid * 0.9 * props.gain
  const scale = props.peaksPerSecond / props.pxPerSecond
  ctx.strokeStyle = '#606266'
  ctx.lineWidth = 1
  ctx.beginPath()
  for (let x = 0; x < w; x++) {
    const i0 = Math.floor((left + x) * scale)
    if (i0 >= data.length) break
    const i1 = Math.min(data.length, Math.max(i0 + 1, Math.floor((left + x + 1) * scale)))
    let v = 0
    for (let i = i0; i < i1; i++) v = Math.max(v, data[i] ?? 0)
    const dy = Math.min(mid, v * amp)
    ctx.moveTo(x + 0.5, mid - dy)
    ctx.lineTo(x + 0.5, mid + dy)
  }
  ctx.stroke()
}

let raf = 0
function scheduleDraw() {
  if (raf) return
  raf = requestAnimationFrame(() => {
    raf = 0
    draw()
  })
}

function onClick(ev: MouseEvent) {
  const rect = (ev.currentTarget as HTMLElement).getBoundingClientRect()
  emit('seek', Math.max(0, (ev.clientX - rect.left) / props.pxPerSecond))
}

onMounted(draw)
onBeforeUnmount(() => cancelAnimationFrame(raf))
watch(
  () => [props.peaks, props.peaksPerSecond, props.pxPerSecond, props.width, props.height, props.gain, drawLeft.value, drawWidth.value] as const,
  scheduleDraw,
)
</script>

<template>
  <div class="dr-to-wave" :style="{width: `${Math.max(1, width)}px`, height: `${height}px`}" @click="onClick">
    <canvas ref="canvasRef" class="dr-to-wave__canvas" :style="{left: `${drawLeft}px`}"/>
  </div>
</template>

<style scoped>
.dr-to-wave {
  position: relative;
  overflow: hidden;
  background: #f7f8fa;
  cursor: pointer;
}

.dr-to-wave__canvas {
  position: absolute;
  top: 0;
  display: block;
}
</style>
