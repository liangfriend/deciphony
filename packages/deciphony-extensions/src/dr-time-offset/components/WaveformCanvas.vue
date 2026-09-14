<script lang="ts" setup>
import {onMounted, ref, watch} from 'vue'
import {WAVEFORM_HEIGHT} from '../constants'

/** 位图最大宽度，避免 10min×px 把 canvas 撑爆 */
const MAX_BITMAP_WIDTH = 4096

const props = withDefaults(
  defineProps<{
    /** 振幅峰值 0~1 */
    peaks: ArrayLike<number>
    /** 展示逻辑宽度（CSS） */
    width: number
    height?: number
  }>(),
  {height: WAVEFORM_HEIGHT},
)

const canvasRef = ref<HTMLCanvasElement | null>(null)

function draw() {
  const canvas = canvasRef.value
  if (!canvas) return
  const cssW = Math.max(1, Math.floor(props.width))
  const h = props.height
  const bitmapW = Math.min(cssW, MAX_BITMAP_WIDTH)
  const dpr = Math.min(window.devicePixelRatio || 1, 2)

  canvas.width = Math.floor(bitmapW * dpr)
  canvas.height = Math.floor(h * dpr)
  canvas.style.width = `${cssW}px`
  canvas.style.height = `${h}px`

  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, bitmapW, h)
  ctx.fillStyle = '#f7f8fa'
  ctx.fillRect(0, 0, bitmapW, h)

  const data = props.peaks
  if (!data.length) {
    ctx.fillStyle = '#909399'
    ctx.font = '12px sans-serif'
    ctx.fillText('无波形（请先选择音频）', 12, h / 2)
    return
  }

  const mid = h / 2
  const amp = mid * 0.85
  ctx.strokeStyle = '#606266'
  ctx.lineWidth = 1
  ctx.beginPath()
  for (let x = 0; x < bitmapW; x++) {
    const i = Math.min(data.length - 1, Math.floor((x / bitmapW) * data.length))
    const v = data[i] ?? 0
    const y0 = mid - v * amp
    const y1 = mid + v * amp
    ctx.moveTo(x + 0.5, y0)
    ctx.lineTo(x + 0.5, y1)
  }
  ctx.stroke()
}

onMounted(draw)
watch(() => [props.peaks, props.width, props.height] as const, draw)
</script>

<template>
  <canvas ref="canvasRef" class="dr-to-wave"/>
</template>

<style scoped>
.dr-to-wave {
  display: block;
}
</style>
