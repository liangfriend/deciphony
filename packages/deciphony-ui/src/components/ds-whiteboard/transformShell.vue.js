import { computed, onMounted, onUnmounted, ref } from 'vue';
const props = defineProps({
    initX: { type: Number, default: 0 },
    initY: { type: Number, default: 0 },
    initW: { type: Number, default: 100 },
    initH: { type: Number, default: 100 },
    initAngle: { type: Number, default: 0 },
    mode: { type: Object, default: ref('show') }
});
const mode = computed(() => {
    return props.mode.value;
});
const emit = defineEmits();
const shell = ref();
const x = ref(props.initX);
const y = ref(props.initY);
const w = ref(props.initW);
const h = ref(props.initH);
const angle = ref(props.initAngle);
let dragging = false;
let resizing = false;
let rotating = false;
let dragStart = { x: 0, y: 0 };
let rectStart = {
    x: 0,
    y: 0,
    w: 0,
    h: 0,
    angle: 0
};
let currentHandle = '';
// 控制点
const handles = ['lt', 'rt', 'lb', 'rb'];
const shellStyle = computed(() => ({
    position: 'absolute',
    left: `${x.value}px`,
    top: `${y.value}px`,
    width: `${w.value}px`,
    height: `${h.value}px`,
    transform: `rotate(${angle.value}deg)`,
    transformOrigin: 'center center',
    cursor: mode.value === 'edit' ? 'move' : 'default',
    boxSizing: 'border-box',
    ...(mode.value === 'edit'
        ? { outline: '1px dashed #409eff', userSelect: 'none' }
        : {})
}));
const contentStyle = computed(() => ({
    width: '100%',
    height: '100%',
    pointerEvents: mode.value === 'edit' ? 'none' : 'auto'
}));
function onShellMouseDown(e) {
    if (mode.value !== 'edit')
        return;
    // 如果已经在旋转，就不要开始拖拽
    if (rotating)
        return;
    dragging = true;
    dragStart = { x: e.clientX, y: e.clientY };
    rectStart = { x: x.value, y: y.value, w: w.value, h: h.value, angle: angle.value };
    emit('mousedown', e);
}
function onMouseMove(e) {
    if (dragging) {
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        x.value = rectStart.x + dx;
        y.value = rectStart.y + dy;
        emit('update', { x: x.value, y: y.value, w: w.value, h: h.value, angle: angle.value });
    }
    if (resizing) {
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        let newW = rectStart.w;
        let newH = rectStart.h;
        let newX = rectStart.x;
        let newY = rectStart.y;
        switch (currentHandle) {
            case 'rb':
                newW += dx;
                newH += dy;
                break;
            case 'lb':
                newW -= dx;
                newH += dy;
                newX += dx;
                break;
            case 'rt':
                newW += dx;
                newH -= dy;
                newY += dy;
                break;
            case 'lt':
                newW -= dx;
                newH -= dy;
                newX += dx;
                newY += dy;
                break;
        }
        if (newW < 20)
            newW = 20;
        if (newH < 20)
            newH = 20;
        x.value = newX;
        y.value = newY;
        w.value = newW;
        h.value = newH;
        emit('update', { x: x.value, y: y.value, w: w.value, h: h.value, angle: angle.value });
    }
    if (rotating) {
        // 计算中心点
        const centerX = x.value + w.value / 2;
        const centerY = y.value + h.value / 2;
        // 计算起始角度（从中心到起始点）
        const startAngle = Math.atan2(rectStart.y + rectStart.h / 2 - centerY, rectStart.x + rectStart.w / 2 - centerX) * 180 / Math.PI;
        // 计算当前角度（从中心到当前鼠标位置）
        const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180 / Math.PI;
        // 计算角度差 - 这里修正了旋转方向
        let angleDiff = currentAngle - startAngle;
        // 确保角度差在合理范围内
        if (angleDiff > 180)
            angleDiff -= 360;
        if (angleDiff < -180)
            angleDiff += 360;
        // 应用角度差到起始角度
        angle.value = rectStart.angle + angleDiff;
        // 规范化角度到0-360度
        if (angle.value < 0)
            angle.value += 360;
        if (angle.value >= 360)
            angle.value -= 360;
        emit('update', { x: x.value, y: y.value, w: w.value, h: h.value, angle: angle.value });
    }
}
function onMouseUp() {
    dragging = false;
    resizing = false;
    rotating = false;
}
function onResizeStart(e, handle) {
    resizing = true;
    currentHandle = handle;
    dragStart = { x: e.clientX, y: e.clientY };
    rectStart = { x: x.value, y: y.value, w: w.value, h: h.value, angle: angle.value };
}
function onRotateStart(e) {
    rotating = true;
    dragStart = { x: e.clientX, y: e.clientY };
    // 保存旋转开始时的状态
    rectStart = {
        x: x.value,
        y: y.value,
        w: w.value,
        h: h.value,
        angle: angle.value
    };
}
onMounted(() => {
    document.addEventListener('pointermove', onMouseMove);
    document.addEventListener('pointerup', onMouseUp);
});
onUnmounted(() => {
    document.removeEventListener('pointermove', onMouseMove);
    document.removeEventListener('pointerup', onMouseUp);
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['rotate-handle']} */ ;
/** @type {__VLS_StyleScopedClasses['rotate-handle']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onPointerdown: (__VLS_ctx.onShellMouseDown) },
    ref: "shell",
    ...{ style: (__VLS_ctx.shellStyle) },
    ...{ class: "transform-shell" },
});
/** @type {typeof __VLS_ctx.shell} */ ;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ref: "content",
    ...{ style: (__VLS_ctx.contentStyle) },
    ...{ class: "content-slot  hidden-scrollbar" },
});
/** @type {typeof __VLS_ctx.content} */ ;
var __VLS_0 = {};
if (__VLS_ctx.mode === 'edit') {
    for (const [handle] of __VLS_getVForSourceType((__VLS_ctx.handles))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
            ...{ onPointerdown: (...[$event]) => {
                    if (!(__VLS_ctx.mode === 'edit'))
                        return;
                    __VLS_ctx.onResizeStart($event, handle);
                } },
            key: (handle),
            ...{ class: (`handle-${handle}`) },
            ...{ class: "resize-handle" },
        });
    }
    if (__VLS_ctx.mode === 'edit') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
            ...{ onPointerdown: (__VLS_ctx.onRotateStart) },
            ...{ class: "rotate-handle" },
        });
    }
}
/** @type {__VLS_StyleScopedClasses['transform-shell']} */ ;
/** @type {__VLS_StyleScopedClasses['content-slot']} */ ;
/** @type {__VLS_StyleScopedClasses['hidden-scrollbar']} */ ;
/** @type {__VLS_StyleScopedClasses['resize-handle']} */ ;
/** @type {__VLS_StyleScopedClasses['rotate-handle']} */ ;
// @ts-ignore
var __VLS_1 = __VLS_0;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            mode: mode,
            shell: shell,
            handles: handles,
            shellStyle: shellStyle,
            contentStyle: contentStyle,
            onShellMouseDown: onShellMouseDown,
            onResizeStart: onResizeStart,
            onRotateStart: onRotateStart,
        };
    },
    __typeEmits: {},
    props: {
        initX: { type: Number, default: 0 },
        initY: { type: Number, default: 0 },
        initW: { type: Number, default: 100 },
        initH: { type: Number, default: 100 },
        initAngle: { type: Number, default: 0 },
        mode: { type: Object, default: ref('show') }
    },
});
const __VLS_component = (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeEmits: {},
    props: {
        initX: { type: Number, default: 0 },
        initY: { type: Number, default: 0 },
        initW: { type: Number, default: 100 },
        initH: { type: Number, default: 100 },
        initAngle: { type: Number, default: 0 },
        mode: { type: Object, default: ref('show') }
    },
});
export default {};
; /* PartiallyEnd: #4569/main.vue */
