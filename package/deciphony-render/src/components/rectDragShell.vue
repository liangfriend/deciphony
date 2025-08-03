<!--方型拖拽壳，第一版不做，后续要包裹spanSymbol-->
<script setup lang="ts">
import {ref, onMounted, PropType} from 'vue'
import {Rect} from "@/applications/ChuangKeApplication/components/musicScore/types";


const props = defineProps({
  rect: {
    required: true,
    type: Object as PropType<Rect>,
  }
})

// 宽高位置状态
const boxStyle = ref({
  left: props.rect.left,
  top: props.rect.top,
  width: props.rect.width,
  height: props.rect.height,
})

const resizing = ref(false)
const activeCorner = ref<'tl' | 'tr' | 'bl' | 'br' | null>(null)

function onMouseDown(corner: 'tl' | 'tr' | 'bl' | 'br', e: MouseEvent) {
  e.stopPropagation()
  e.preventDefault()
  resizing.value = true
  activeCorner.value = corner
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

function onMouseMove(e: MouseEvent) {
  if (!resizing.value || !activeCorner.value) return

  const {clientX, clientY} = e

  switch (activeCorner.value) {
    case 'tl':
      boxStyle.value.width += boxStyle.value.left - clientX
      boxStyle.value.height += boxStyle.value.top - clientY
      boxStyle.value.left = clientX
      boxStyle.value.top = clientY
      break
    case 'tr':
      boxStyle.value.width = clientX - boxStyle.value.left
      boxStyle.value.height += boxStyle.value.top - clientY
      boxStyle.value.top = clientY
      break
    case 'bl':
      boxStyle.value.width += boxStyle.value.left - clientX
      boxStyle.value.left = clientX
      boxStyle.value.height = clientY - boxStyle.value.top
      break
    case 'br':
      boxStyle.value.width = clientX - boxStyle.value.left
      boxStyle.value.height = clientY - boxStyle.value.top
      break
  }
}

function onMouseUp() {
  resizing.value = false
  activeCorner.value = null
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
}
</script>

<template>
  <div
      class="resizable-box"
      :style="{
      position: 'absolute',
      left: boxStyle.left + 'px',
      top: boxStyle.top + 'px',
      width: boxStyle.width + 'px',
      height: boxStyle.height + 'px',
    }"
  >
    <slot/>

    <!-- 拖拽角 -->
    <div
        class="drag-point top-left"
        @mousedown="onMouseDown('tl', $event)"
    ></div>
    <div
        class="drag-point top-right"
        @mousedown="onMouseDown('tr', $event)"
    ></div>
    <div
        class="drag-point bottom-left"
        @mousedown="onMouseDown('bl', $event)"
    ></div>
    <div
        class="drag-point bottom-right"
        @mousedown="onMouseDown('br', $event)"
    ></div>
  </div>
</template>

<style scoped>
.resizable-box {
  border: 1px dashed #aaa;
  box-sizing: border-box;
}

.drag-point {
  position: absolute;
  width: 10px;
  height: 10px;
  background-color: #333;
  z-index: 10;
  cursor: pointer;
}

/* 各角位置 */
.top-left {
  top: -5px;
  left: -5px;
  cursor: nwse-resize;
}

.top-right {
  top: -5px;
  right: -5px;
  cursor: nesw-resize;
}

.bottom-left {
  bottom: -5px;
  left: -5px;
  cursor: nesw-resize;
}

.bottom-right {
  bottom: -5px;
  right: -5px;
  cursor: nwse-resize;
}
</style>
