<script lang="ts" setup>
import {computed, onBeforeUnmount, onMounted, ref} from 'vue'

const dragableBoxList = ref({
    'startPoint': {position: {x: 0, y: 0}},
    'endPoint': {position: {x: 80, y: 0}},
    'leftSlope': {position: {x: 0, y: 80}},
    'rightSlope': {position: {x: 80, y: 80}}
})

let isDragging = false
let offsetX = 0
let offsetY = 0
let currentTarget: HTMLElement | null = null
let currentItem: any = null

// pointerdown
function onPointerDown(e: PointerEvent, item: any) {
    const target = e.target as HTMLElement
    currentTarget = target
    currentItem = item
    isDragging = true
    target.setPointerCapture(e.pointerId)

    const rect = target.getBoundingClientRect()
    offsetX = e.clientX - rect.left
    offsetY = e.clientY - rect.top
}

// pointermove
function onPointerMove(e: PointerEvent) {
    if (!isDragging || !currentItem) return

    // 更新 position
    currentItem.position.x = e.clientX - offsetX
    currentItem.position.y = e.clientY - offsetY
}

// pointerup
function onPointerUp(e: PointerEvent) {
    isDragging = false
    currentTarget?.releasePointerCapture(e.pointerId)
    currentTarget = null
    currentItem = null
}

onMounted(() => {
    document.addEventListener('pointermove', onPointerMove)
    document.addEventListener('pointerup', onPointerUp)
})
onBeforeUnmount(() => {
    document.removeEventListener('pointermove', onPointerMove)
    document.removeEventListener('pointerup', onPointerUp)
})

// 样式计算
const dragableBoxStyle = computed(() => {
    return (item: any) => ({
        left: item.position.x + 'px',
        top: item.position.y + 'px',
    })
})

const path = computed(() => {
    const s = dragableBoxList.value.startPoint.position
    const e = dragableBoxList.value.endPoint.position
    const l = dragableBoxList.value.leftSlope.position
    const r = dragableBoxList.value.rightSlope.position
    return `M ${s.x} ${s.y} C ${l.x} ${l.y}, ${r.x} ${r.y}, ${e.x} ${e.y}`
})
</script>

<template>
    <div class="fullscreen">
        <div
            :style="{
        'background': 'linear-gradient(to right, black 50%, transparent 50%) no-repeat',
        '-webkit-mask': path,
        '-webkit-mask-repeat': 'no-repeat',
        '-webkit-mask-size': 'contain',
        height:'100px',
        width:'100px'

      }"
            class="curve-container"
        ></div>

        <div
            v-for="(item,key) in dragableBoxList"
            :key="key"
            :style="dragableBoxStyle(item)"
            class="dragable-box"
            @pointerdown="(e) => onPointerDown(e, item)"
        ></div>
    </div>
</template>

<style scoped>
.fullscreen {
    width: 100vw;
    height: 100vh;
    background: #f2f2f2;
    position: relative;
    overflow: hidden;
}

.dragable-box {
    position: absolute;
    width: 20px;
    height: 20px;
    border: 1px dashed #666;
    background: white;
    cursor: grab;
}

svg {
    pointer-events: none;
    background: transparent;
}

.curve-container {

}
</style>
