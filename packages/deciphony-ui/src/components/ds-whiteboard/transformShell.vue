<template>
    <div
        ref="shell"
        :style="shellStyle"
        class="transform-shell"
        @mousedown="onShellMouseDown"
    >
        <!-- 真实内容插槽 -->
        <div ref="content" :style="contentStyle" class="content-slot">
            <slot></slot>
        </div>

        <!-- 变形控制点 -->
        <template v-if="mode === 'edit'">
            <div
                v-for="handle in handles"
                :key="handle"
                :class="`handle-${handle}`"
                class="resize-handle"
                @mousedown.stop="onResizeStart($event, handle)"
            />
        </template>
    </div>
</template>

<script lang="ts" setup>
import {computed, CSSProperties, onMounted, onUnmounted, ref} from 'vue'

interface Position {
    x: number
    y: number
}

const props = defineProps({
    initX: {type: Number, default: 0},
    initY: {type: Number, default: 0},
    initW: {type: Number, default: 100},
    initH: {type: Number, default: 100},
    mode: {type: String as () => 'edit' | 'show', default: 'show'}
})

const emit = defineEmits<{
    (e: 'update', rect: { x: number; y: number; w: number; h: number }): void
    (e: 'mousedown', ev: MouseEvent): void
}>()

const shell = ref<HTMLElement>()
const x = ref(props.initX)
const y = ref(props.initY)
const w = ref(props.initW)
const h = ref(props.initH)

let dragging = false
let resizing = false
let dragStart: Position = {x: 0, y: 0}
let rectStart: { x: number; y: number; w: number; h: number } = {
    x: 0,
    y: 0,
    w: 0,
    h: 0
}
let currentHandle = ''

// 控制点
const handles = ['lt', 'rt', 'lb', 'rb']

const shellStyle = computed((): CSSProperties => ({
    position: 'absolute',
    left: `${x.value}px`,
    top: `${y.value}px`,
    width: `${w.value}px`,
    height: `${h.value}px`,
    cursor: props.mode === 'edit' ? 'move' : 'default',
    boxSizing: 'border-box',
    ...(props.mode === 'edit'
        ? {outline: '1px dashed #409eff', userSelect: 'none'}
        : {})
}))

const contentStyle = computed((): CSSProperties => ({
    width: '100%',
    height: '100%',
    pointerEvents: props.mode === 'edit' ? 'none' : 'auto'
}))

function onShellMouseDown(e: MouseEvent) {
    if (props.mode !== 'edit') return
    dragging = true
    dragStart = {x: e.clientX, y: e.clientY}
    rectStart = {x: x.value, y: y.value, w: w.value, h: h.value}
    emit('mousedown', e)
}

function onMouseMove(e: MouseEvent) {
    if (dragging) {
        const dx = e.clientX - dragStart.x
        const dy = e.clientY - dragStart.y
        x.value = rectStart.x + dx
        y.value = rectStart.y + dy
        emit('update', {x: x.value, y: y.value, w: w.value, h: h.value})
    }

    if (resizing) {
        const dx = e.clientX - dragStart.x
        const dy = e.clientY - dragStart.y
        let newW = rectStart.w
        let newH = rectStart.h
        let newX = rectStart.x
        let newY = rectStart.y

        switch (currentHandle) {
            case 'rb':
                newW += dx
                newH += dy
                break
            case 'lb':
                newW -= dx
                newH += dy
                newX += dx
                break
            case 'rt':
                newW += dx
                newH -= dy
                newY += dy
                break
            case 'lt':
                newW -= dx
                newH -= dy
                newX += dx
                newY += dy
                break
        }
        if (newW < 20) newW = 20
        if (newH < 20) newH = 20

        x.value = newX
        y.value = newY
        w.value = newW
        h.value = newH

        emit('update', {x: x.value, y: y.value, w: w.value, h: h.value})
    }
}

function onMouseUp() {
    dragging = false
    resizing = false
}

function onResizeStart(e: MouseEvent, handle: string) {
    resizing = true
    currentHandle = handle
    dragStart = {x: e.clientX, y: e.clientY}
    rectStart = {x: x.value, y: y.value, w: w.value, h: h.value}
}

onMounted(() => {
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
})
onUnmounted(() => {
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
})
</script>

<style scoped>
.transform-shell {
    position: absolute;
}

.content-slot {
    width: 100%;
    height: 100%;
}

.resize-handle {
    position: absolute;
    width: 10px;
    height: 10px;
    background: #409eff;
    border: 1px solid #fff;
    box-sizing: border-box;
}

.handle-lt {
    top: -5px;
    left: -5px;
    cursor: nwse-resize;
}

.handle-rt {
    top: -5px;
    right: -5px;
    cursor: nesw-resize;
}

.handle-lb {
    bottom: -5px;
    left: -5px;
    cursor: nesw-resize;
}

.handle-rb {
    bottom: -5px;
    right: -5px;
    cursor: nwse-resize;
}
</style>
