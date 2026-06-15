<script lang="ts" setup>
import {computed, nextTick, onMounted, ref, watch} from 'vue'
import {applySkinContentTemplate} from '@/render/skinContent'
import type {SkinItem} from '@/types/common'
import {getPreviewNodeSize, getSkinColorValue, isColorOnlySkinItem} from './skinPreview'

export type SymbolDomMetrics = {
  containerW: number
  containerH: number
  bboxX: number
  bboxY: number
  bboxW: number
  bboxH: number
  /** 边界框元素在页面上的实际像素尺寸（含预览缩放） */
  domW: number
  domH: number
}

const props = defineProps<{
  name: string
  item: SkinItem
  /** 嵌入卡片内时不重复外框 */
  bare?: boolean
  /** 编辑弹窗：用 item.w/h，不走 measure 等预览 override */
  useRawSize?: boolean
  /** 预览区边长（px） */
  previewBox?: number
  /** 是否测量并展示 DOM 真实尺寸 */
  showDomMetrics?: boolean
}>()

const emit = defineEmits<{
  'dom-metrics': [metrics: SymbolDomMetrics | null]
}>()

const svgRef = ref<SVGSVGElement>()
const boundsRef = ref<HTMLElement>()

const isColorOnly = computed(() => isColorOnlySkinItem(props.item))

const nodeSize = computed(() =>
  props.useRawSize
    ? {w: props.item.w, h: props.item.h}
    : getPreviewNodeSize(props.name, props.item)
)

const skinColor = computed(() => getSkinColorValue(props.item))

const rendered = computed(() => {
  if (isColorOnly.value) return ''
  return applySkinContentTemplate(props.item.content, nodeSize.value)
})

const previewBoxPx = computed(() => props.previewBox ?? 100)

const fitScale = computed(() => {
  const pad = 6
  const max = previewBoxPx.value - pad
  const {w, h} = nodeSize.value
  if (w <= 0 || h <= 0) return 1
  return Math.min(1, max / w, max / h)
})

const domMetrics = ref<SymbolDomMetrics | null>(null)

function formatSize(n: number) {
  return n.toFixed(2)
}

async function measureDom() {
  await nextTick()
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  const {w, h} = nodeSize.value

  if (isColorOnly.value) {
    const rect = boundsRef.value?.getBoundingClientRect()
    const metrics: SymbolDomMetrics = {
      containerW: w,
      containerH: h,
      bboxX: 0,
      bboxY: 0,
      bboxW: w,
      bboxH: h,
      domW: rect?.width ?? w,
      domH: rect?.height ?? h,
    }
    domMetrics.value = metrics
    emit('dom-metrics', metrics)
    return
  }

  const svg = svgRef.value
  const g = svg?.querySelector('g')
  if (!g) {
    domMetrics.value = null
    emit('dom-metrics', null)
    return
  }

  try {
    const bbox = g.getBBox()
    const rect = boundsRef.value?.getBoundingClientRect()
    const metrics: SymbolDomMetrics = {
      containerW: w,
      containerH: h,
      bboxX: bbox.x,
      bboxY: bbox.y,
      bboxW: bbox.width,
      bboxH: bbox.height,
      domW: rect?.width ?? w,
      domH: rect?.height ?? h,
    }
    domMetrics.value = metrics
    emit('dom-metrics', metrics)
  } catch {
    domMetrics.value = null
    emit('dom-metrics', null)
  }
}

watch([rendered, nodeSize, () => props.item.content], measureDom, {flush: 'post'})
onMounted(measureDom)
</script>

<template>
  <div class="symbol-preview-wrap">
    <div
      class="symbol-preview"
      :class="{'symbol-preview--bare': bare}"
      :style="bare ? undefined : {width: `${previewBoxPx}px`, height: `${previewBoxPx}px`}"
    >
      <div
        v-if="isColorOnly"
        ref="boundsRef"
        class="symbol-preview__bounds symbol-preview__bounds--color"
        :style="{
          width: `${nodeSize.w}px`,
          height: `${nodeSize.h}px`,
          backgroundColor: skinColor,
          transform: fitScale !== 1 ? `scale(${fitScale})` : undefined,
        }"
      />
      <div
        v-else
        ref="boundsRef"
        class="symbol-preview__bounds"
        :style="{
          width: `${nodeSize.w}px`,
          height: `${nodeSize.h}px`,
          transform: fitScale !== 1 ? `scale(${fitScale})` : undefined,
        }"
      >
        <svg
          ref="svgRef"
          xmlns="http://www.w3.org/2000/svg"
          :width="nodeSize.w"
          :height="nodeSize.h"
          class="symbol-preview__svg"
        >
          <g v-html="rendered" />
        </svg>
      </div>
    </div>

    <div v-if="showDomMetrics && domMetrics" class="symbol-preview__metrics">
      <div>容器 {{ formatSize(domMetrics.containerW) }}×{{ formatSize(domMetrics.containerH) }}</div>
      <div>
        内容包围盒 {{ formatSize(domMetrics.bboxW) }}×{{ formatSize(domMetrics.bboxH) }}
      </div>
      <div class="symbol-preview__metrics-sub">
        偏移 ({{ formatSize(domMetrics.bboxX) }}, {{ formatSize(domMetrics.bboxY) }})
      </div>
      <div class="symbol-preview__metrics-sub">
        DOM 显示 {{ formatSize(domMetrics.domW) }}×{{ formatSize(domMetrics.domH) }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.symbol-preview-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.symbol-preview {
  width: 100px;
  height: 100px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.symbol-preview--bare {
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 0;
}

.symbol-preview__bounds {
  border: 1px dashed #909399;
  box-sizing: border-box;
  transform-origin: center center;
  flex-shrink: 0;
}

.symbol-preview__bounds--color {
  border-radius: 4px;
}

.symbol-preview__svg {
  display: block;
  overflow: visible;
}

.symbol-preview__metrics {
  font-size: 11px;
  line-height: 1.45;
  color: #606266;
  text-align: center;
  width: 100%;
}

.symbol-preview__metrics-sub {
  color: #909399;
  font-size: 10px;
}
</style>
