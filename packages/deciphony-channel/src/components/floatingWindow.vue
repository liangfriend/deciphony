<template>
    <transition name="fw-fade">
        <div
            v-if="show"
            class="floating-window"
            :style="containerStyle"
            @mousedown.stop
            @touchstart.stop
            ref="root"
            role="dialog"
            aria-modal="true"
        >
            <!-- header: 拖拽区域 -->
            <div
                class="fw-header"
                :style="headerStyle"
                @mousedown="onDragStart"
                @touchstart="onDragStart"
                @dblclick="onHeaderDblClick"
                ref="header"
            >
                <div class="fw-drag-handle" :style="dragHandleOverlayStyle"></div>
                <div class="fw-title"><slot name="title">{{ title }}</slot></div>
                <div class="fw-actions">
                    <button class="fw-btn" @click="emitClose" aria-label="close">✕</button>
                </div>
            </div>

            <!-- body: 暴露默认插槽 -->
            <div class="fw-body">
                <slot />
            </div>
        </div>
    </transition>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';

interface Props {
    modelValue?: boolean;
    initialX?: number; // px, 以视窗左上为原点
    initialY?: number;
    center?: boolean;
    dragHandleHeight?: number; // header 高度 (px)
    onlyLeftHandleWidth?: number | null; // 若设置为数字，则仅左侧该宽度可作为拖拽柄
    restrictToViewport?: boolean; // 是否限制拖动不会超出视窗
    title?: string;
    zIndex?: number;
}

const props = defineProps<Props>();
const emit = defineEmits(['update:modelValue', 'close', 'move']);

const show = computed({
    get: () => !!props.modelValue,
    set: (v: boolean) => emit('update:modelValue', v)
});

const root = ref<HTMLElement | null>(null);
const header = ref<HTMLElement | null>(null);

const viewportW = () => window.innerWidth || document.documentElement.clientWidth;
const viewportH = () => window.innerHeight || document.documentElement.clientHeight;

const left = ref(props.initialX ?? 100);
const top = ref(props.initialY ?? 100);
const width = ref<number | null>(null); // 可通过外部样式控制宽度，也可读取实际宽度
const height = ref<number | null>(null);
const dragging = ref(false);

const dragStartX = ref(0);
const dragStartY = ref(0);
const startLeft = ref(0);
const startTop = ref(0);

const dragHandleHeight = props.dragHandleHeight ?? 36;
const onlyLeftHandleWidth = props.onlyLeftHandleWidth ?? null;
const restrictToViewport = props.restrictToViewport ?? true;
const zIndex = props.zIndex ?? 2000;
const title = props.title ?? '';

const containerStyle = computed(() => ({
    left: `${left.value}px`,
    top: `${top.value}px`,
    position: 'fixed',
    zIndex,
}));

const headerStyle = computed(() => ({
    height: `${dragHandleHeight}px`,
    cursor: onlyLeftHandleWidth ? 'default' : 'grab',
}));

// 如果 onlyLeftHandleWidth 有设置，新增一个 overlay 作为拖拽区域（左侧）
const dragHandleOverlayStyle = computed(() => ({
    position: 'absolute',
    left: '0',
    top: '0',
    width: onlyLeftHandleWidth ? `${onlyLeftHandleWidth}px` : '100%',
    height: `${dragHandleHeight}px`,
    cursor: 'grab',
    zIndex: 2,
}));

function emitClose() {
    emit('close');
    emit('update:modelValue', false);
}

function onHeaderDblClick() {
    // 双击居中窗口（示例行为）
    if (!root.value) return;
    const vw = viewportW();
    const vh = viewportH();
    const el = root.value;
    const rect = el.getBoundingClientRect();
    left.value = Math.max(8, (vw - rect.width) / 2);
    top.value = Math.max(8, (vh - rect.height) / 2);
    emit('move', { left: left.value, top: top.value });
}

function isEventOnHandle(evt: MouseEvent | TouchEvent) {
    if (!header.value) return false;
    if (!onlyLeftHandleWidth) return true; // 整个 header 都可拖拽

    const point = ('touches' in evt && evt.touches.length) ? evt.touches[0] : (evt as MouseEvent);
    const headerRect = header.value.getBoundingClientRect();
    const relX = point.clientX - headerRect.left;
    return relX >= 0 && relX <= onlyLeftHandleWidth;
}

function onDragStart(evt: MouseEvent | TouchEvent) {
    // 只响应左键或触摸
    if ((evt as MouseEvent).button !== undefined && (evt as MouseEvent).button !== 0) return;
    if (!isEventOnHandle(evt)) return;

    evt.preventDefault();
    dragging.value = true;

    const ptr = ('touches' in evt && evt.touches.length) ? (evt as TouchEvent).touches[0] : (evt as MouseEvent);

    dragStartX.value = ptr.clientX;
    dragStartY.value = ptr.clientY;
    startLeft.value = left.value;
    startTop.value = top.value;

    // attach move / end listeners on window to allow dragging outside element
    window.addEventListener('mousemove', onDragMove as any);
    window.addEventListener('mouseup', onDragEnd as any);
    window.addEventListener('touchmove', onDragMove as any, { passive: false });
    window.addEventListener('touchend', onDragEnd as any);
    window.addEventListener('touchcancel', onDragEnd as any);
}

function onDragMove(evt: MouseEvent | TouchEvent) {
    if (!dragging.value) return;
    evt.preventDefault();

    const ptr = ('touches' in evt && (evt as TouchEvent).touches.length) ? (evt as TouchEvent).touches[0] : (evt as MouseEvent);

    const dx = ptr.clientX - dragStartX.value;
    const dy = ptr.clientY - dragStartY.value;

    let nx = startLeft.value + dx;
    let ny = startTop.value + dy;

    if (restrictToViewport && root.value) {
        const rect = root.value.getBoundingClientRect();
        const vw = viewportW();
        const vh = viewportH();

        // 限制左上不要全部超出视窗（给 8px margin）
        const margin = 8;
        nx = Math.min(Math.max(nx, margin - rect.width + 40), vw - margin); // allow partial overflow
        ny = Math.min(Math.max(ny, margin - rect.height + 40), vh - margin);
    }

    left.value = nx;
    top.value = ny;
    emit('move', { left: left.value, top: top.value });
}

function onDragEnd() {
    if (!dragging.value) return;
    dragging.value = false;
    window.removeEventListener('mousemove', onDragMove as any);
    window.removeEventListener('mouseup', onDragEnd as any);
    window.removeEventListener('touchmove', onDragMove as any);
    window.removeEventListener('touchend', onDragEnd as any);
    window.removeEventListener('touchcancel', onDragEnd as any);
}

onMounted(() => {
    // 如果 center=true，则居中显示
    nextTick(() => {
        if (!root.value) return;
        const rect = root.value.getBoundingClientRect();
        if (props.center) {
            left.value = Math.max(8, (viewportW() - rect.width) / 2);
            top.value = Math.max(8, (viewportH() - rect.height) / 2);
        }
    });
});

onBeforeUnmount(() => {
    onDragEnd();
});
</script>

<style scoped>
.floating-window {
    min-width: 240px;
    max-width: calc(100vw - 16px);
    background: white;
    border-radius: 8px;
    box-shadow: 0 10px 30px rgba(20, 20, 30, 0.15);
    overflow: hidden;
    user-select: none;
    touch-action: none;
}

/* header */
.fw-header {
    position: relative;
    display: flex;
    align-items: center;
    padding: 0 8px;
    border-bottom: 1px solid rgba(0,0,0,0.06);
    background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(250,250,250,0.98));
    -webkit-user-drag: none;
}

/* drag overlay (invisible) */
.fw-drag-handle {
    pointer-events: auto;
}

/* title and actions */
.fw-title {
    flex: 1;
    font-size: 14px;
    font-weight: 600;
    padding-left: 8px;
    z-index: 3;
}
.fw-actions {
    display: flex;
    gap: 6px;
    z-index: 3;
}
.fw-btn {
    background: transparent;
    border: none;
    padding: 6px;
    cursor: pointer;
    font-size: 14px;
    line-height: 1;
    border-radius: 4px;
}
.fw-btn:hover { background: rgba(0,0,0,0.04); }

/* body */
.fw-body {
    padding: 12px;
    max-height: calc(100vh - 120px);
    overflow: auto;
}

/* simple transition */
.fw-fade-enter-active, .fw-fade-leave-active { transition: opacity .15s ease, transform .15s ease; }
.fw-fade-enter-from, .fw-fade-leave-to { opacity: 0; transform: scale(.995) translateY(-4px); }
</style>
