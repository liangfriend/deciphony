<script lang="ts" setup>
import {onBeforeUnmount, onMounted, ref} from 'vue'

const box = ref<HTMLElement | null>(null)
let isDragging = false
let offsetX = 0
let offsetY = 0

// 按下事件
function onPointerDown(e: PointerEvent) {
    if (!box.value) return
    isDragging = true
    box.value.setPointerCapture(e.pointerId)
    const rect = box.value.getBoundingClientRect()
    offsetX = e.clientX - rect.left
    offsetY = e.clientY - rect.top
}

// 移动事件
function onPointerMove(e: PointerEvent) {
    if (!isDragging || !box.value) return
    box.value.style.left = `${e.clientX - offsetX}px`
    box.value.style.top = `${e.clientY - offsetY}px`
}

// 抬起事件
function onPointerUp(e: PointerEvent) {
    isDragging = false
    box.value?.releasePointerCapture(e.pointerId)
}

onMounted(() => {
    document.addEventListener('pointermove', onPointerMove)
    document.addEventListener('pointerup', onPointerUp)
})

onBeforeUnmount(() => {
    document.removeEventListener('pointermove', onPointerMove)
    document.removeEventListener('pointerup', onPointerUp)
})
/*
*
* 使用三次贝塞尔曲线实现连音线
* 贝塞尔曲线进行一次往复，左右控制点向内偏移，实现一个月牙形
* */
</script>

<template>

    <div class="fullscreen">
        <div ref="box" class="draggable" @pointerdown="onPointerDown">
            <svg height="100" preserveAspectRatio="none"
                 viewBox="0 0 100 100" width="100" xmlns="http://www.w3.org/2000/svg">
                <path d="M 0 0, C 20 20, 80 20, 100 0" stroke="black"></path>
            </svg>
        </div>
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

.draggable {
    width: 100px;
    height: 100px;
    position: absolute;
    left: 100px;
    top: 100px;
    cursor: grab;
    border: 1px dashed #666;
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
    user-select: none;
}
</style>
