<script lang="ts" setup>
import {computed, onMounted, provide, ref, watch} from 'vue'
import type {SPage, SjwMode} from '../types/types'
import ElementNode from './ElementNode.vue'
import Score from './Score.vue'

const props = withDefaults(
  defineProps<{
    page: SPage
    /** 缩略图预览模式：禁用编辑框与绘制交互 */
    thumbnail?: boolean
    /** show：不显示编辑框；edit：显示通用编辑框 */
    mode?: SjwMode
    resolveSrc?: (src: string) => string
  }>(),
  {
    mode: 'show',
    resolveSrc: (src: string) => src,
  },
)

const bgCanvasRef = ref<HTMLCanvasElement | null>(null)
const drawCanvasRef = ref<HTMLCanvasElement | null>(null)
const svgRef = ref<SVGSVGElement | null>(null)
const selectedId = ref<string | null>(null)

provide('sjwSvgRoot', svgRef)

const elements = computed(() => props.page.elements ?? [])
const scores = computed(() => props.page.scores ?? [])
const editable = computed(() => props.mode === 'edit' && !props.thumbnail)

function paintBackground() {
  const canvas = bgCanvasRef.value
  if (!canvas) return
  const {width, height} = props.page
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)

  const bgSrc = props.page.background?.src
  if (!bgSrc) return
  const url = props.resolveSrc(bgSrc)
  if (!url) return

  const img = new Image()
  img.onload = () => {
    if (bgCanvasRef.value !== canvas) return
    ctx.drawImage(img, 0, 0, width, height)
  }
  img.src = url
}

function syncDrawCanvas() {
  const canvas = drawCanvasRef.value
  if (!canvas) return
  canvas.width = props.page.width
  canvas.height = props.page.height
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)
}

function syncLayers() {
  paintBackground()
  syncDrawCanvas()
}

function clearSelection() {
  selectedId.value = null
}

function selectItem(id: string) {
  selectedId.value = id
}

onMounted(syncLayers)
watch(
  () => [props.page.width, props.page.height, props.page.background?.src] as const,
  syncLayers,
)
watch(
  () => props.mode,
  (m) => {
    if (m !== 'edit') selectedId.value = null
  },
)
</script>

<template>
  <div
    class="sjw-page"
    :class="{
      'sjw-page--thumbnail': thumbnail,
      'sjw-page--edit': editable,
    }"
    :style="{width: `${page.width}px`, height: `${page.height}px`}"
  >
    <canvas ref="bgCanvasRef" class="sjw-page__layer sjw-page__bg"/>
    <svg
      ref="svgRef"
      class="sjw-page__layer sjw-page__svg"
      :height="page.height"
      preserveAspectRatio="none"
      :viewBox="`0 0 ${page.width} ${page.height}`"
      :width="page.width"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        fill="transparent"
        :height="page.height"
        :width="page.width"
        x="0"
        y="0"
        @pointerdown="clearSelection"
      />
      <rect
        fill="none"
        :height="page.height - 1"
        pointer-events="none"
        stroke="#e4e7ed"
        stroke-width="1"
        :width="page.width - 1"
        x="0.5"
        y="0.5"
      />
      <g class="sjw-page__scores">
        <Score
          v-for="sc in scores"
          :key="sc.id"
          :editable="editable"
          :score="sc"
          :selected="editable && selectedId === sc.id"
          @select="selectItem(sc.id)"
        />
      </g>
      <g class="sjw-page__elements">
        <ElementNode
          v-for="el in elements"
          :key="el.id"
          :editable="editable"
          :element="el"
          :resolve-src="resolveSrc"
          :selected="editable && selectedId === el.id"
          @select="selectItem(el.id)"
        />
      </g>
    </svg>
    <canvas
      ref="drawCanvasRef"
      class="sjw-page__layer sjw-page__draw"
      style="pointer-events: none"
    />
  </div>
</template>

<style scoped>
.sjw-page {
  position: relative;
  flex-shrink: 0;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
  background: #fff;
}

.sjw-page__layer {
  position: absolute;
  inset: 0;
  display: block;
}

.sjw-page__bg {
  z-index: 1;
}

.sjw-page__svg {
  z-index: 2;
  overflow: visible;
  width: 100%;
  height: 100%;
}

.sjw-page__draw {
  z-index: 3;
}

.sjw-page--thumbnail {
  box-shadow: none;
  border: 1px solid #dcdfe6;
}

.sjw-page--edit {
  overflow: visible;
}
</style>
