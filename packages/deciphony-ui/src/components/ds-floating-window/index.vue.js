import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
defineOptions({
    name: 'DsFloatingWindow' // 给组件一个全局 name
});
const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    },
    initialX: {
        type: Number,
        default: 100
    },
    initialY: {
        type: Number,
        default: 100
    },
    center: {
        type: Boolean,
        default: false
    },
    dragHandleHeight: {
        type: Number,
        default: 36
    },
    onlyLeftHandleWidth: {
        type: Number,
        default: null
    },
    restrictToViewport: {
        type: Boolean,
        default: true
    },
    title: {
        type: String,
        default: ''
    },
    zIndex: {
        type: Number,
        default: 2000
    },
    height: {
        type: String,
        default: '200px'
    },
    width: {
        type: String,
        default: '400px'
    },
    ballImage: {
        type: String,
        default: '' // 可以换成默认图片路径
    },
    ballSize: {
        type: Number,
        default: 48
    }
});
const emit = defineEmits(['update:modelValue', 'close', 'move']);
const show = computed({
    get: () => !!props.modelValue,
    set: (v) => emit('update:modelValue', v)
});
const folded = ref(false); // 🆕 折叠状态
function toggleFold() {
    folded.value = !folded.value;
    if (folded.value) {
        height.value = props.dragHandleHeight + 'px';
        width.value = '80px';
        left.value += (parseInt(props.width) || 400) - 240;
    }
    else {
        height.value = props.height ?? '100px';
        width.value = props.width ?? '400px';
        left.value -= (parseInt(props.width) || 400) - 240;
    }
}
const root = ref(null);
const header = ref(null);
const viewportW = () => window.innerWidth || document.documentElement.clientWidth;
const viewportH = () => window.innerHeight || document.documentElement.clientHeight;
const left = ref(props.initialX ?? 100);
const top = ref(props.initialY ?? 100);
const width = ref(props.width ?? '400px'); // 可通过外部样式控制宽度，也可读取实际宽度
const height = ref(props.height ?? '100px');
const dragging = ref(false);
const dragStartX = ref(0);
const dragStartY = ref(0);
const startLeft = ref(0);
const startTop = ref(0);
const dragHandleHeight = props.dragHandleHeight ?? props.dragHandleHeight;
const onlyLeftHandleWidth = props.onlyLeftHandleWidth ?? null;
const restrictToViewport = props.restrictToViewport ?? true;
const zIndex = props.zIndex ?? 2000;
const title = props.title ?? '';
const containerStyle = computed(() => {
    const res = {
        left: `${left.value}px`,
        top: `${top.value}px`,
        position: 'fixed',
        width: width.value,
        height: height.value,
        zIndex,
    };
    return res;
});
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
    if (!root.value)
        return;
    const vw = viewportW();
    const vh = viewportH();
    const el = root.value;
    const rect = el.getBoundingClientRect();
    left.value = Math.max(8, (vw - rect.width) / 2);
    top.value = Math.max(8, (vh - rect.height) / 2);
    emit('move', { left: left.value, top: top.value });
}
function isEventOnHandle(evt) {
    if (!header.value)
        return false;
    if (!onlyLeftHandleWidth)
        return true; // 整个 header 都可拖拽
    const point = ('touches' in evt && evt.touches.length) ? evt.touches[0] : evt;
    const headerRect = header.value.getBoundingClientRect();
    const relX = point.clientX - headerRect.left;
    return relX >= 0 && relX <= onlyLeftHandleWidth;
}
function onDragStart(evt) {
    // 只响应左键或触摸
    if (evt.button !== undefined && evt.button !== 0)
        return;
    if (!isEventOnHandle(evt))
        return;
    evt.preventDefault();
    dragging.value = true;
    const ptr = ('touches' in evt && evt.touches.length) ? evt.touches[0] : evt;
    dragStartX.value = ptr.clientX;
    dragStartY.value = ptr.clientY;
    startLeft.value = left.value;
    startTop.value = top.value;
    // attach move / end listeners on window to allow dragging outside element
    window.addEventListener('mousemove', onDragMove);
    window.addEventListener('mouseup', onDragEnd);
    window.addEventListener('touchmove', onDragMove, { passive: false });
    window.addEventListener('touchend', onDragEnd);
    window.addEventListener('touchcancel', onDragEnd);
}
function onDragMove(evt) {
    if (!dragging.value)
        return;
    evt.preventDefault();
    const ptr = ('touches' in evt && evt.touches.length) ? evt.touches[0] : evt;
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
    if (!dragging.value)
        return;
    dragging.value = false;
    window.removeEventListener('mousemove', onDragMove);
    window.removeEventListener('mouseup', onDragEnd);
    window.removeEventListener('touchmove', onDragMove);
    window.removeEventListener('touchend', onDragEnd);
    window.removeEventListener('touchcancel', onDragEnd);
}
onMounted(() => {
    // 如果 center=true，则居中显示
    nextTick(() => {
        if (!root.value)
            return;
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
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['fw-btn']} */ ;
// CSS variable injection 
// CSS variable injection end 
const __VLS_0 = {}.transition;
/** @type {[typeof __VLS_components.Transition, typeof __VLS_components.transition, typeof __VLS_components.Transition, typeof __VLS_components.transition, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    name: "fw-fade",
}));
const __VLS_2 = __VLS_1({
    name: "fw-fade",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_3.slots.default;
if (__VLS_ctx.show) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onMousedown: () => { } },
        ...{ onTouchstart: () => { } },
        ref: "root",
        ...{ style: (__VLS_ctx.containerStyle) },
        'aria-modal': "true",
        ...{ class: "floating-window" },
        role: "dialog",
    });
    /** @type {typeof __VLS_ctx.root} */ ;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onMousedown: (__VLS_ctx.onDragStart) },
        ...{ onTouchstart: (__VLS_ctx.onDragStart) },
        ref: "header",
        ...{ style: (__VLS_ctx.headerStyle) },
        ...{ class: "fw-header" },
    });
    /** @type {typeof __VLS_ctx.header} */ ;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: (__VLS_ctx.dragHandleOverlayStyle) },
        ...{ class: "fw-drag-handle" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "fw-title" },
    });
    var __VLS_4 = {};
    (__VLS_ctx.title);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "fw-actions" },
    });
    const __VLS_6 = {}.DsIcon;
    /** @type {[typeof __VLS_components.DsIcon, typeof __VLS_components.dsIcon, typeof __VLS_components.DsIcon, typeof __VLS_components.dsIcon, ]} */ ;
    // @ts-ignore
    const __VLS_7 = __VLS_asFunctionalComponent(__VLS_6, new __VLS_6({
        ...{ 'onClick': {} },
        ...{ class: "fw-btn" },
        name: "copyM",
        size: "1rem",
    }));
    const __VLS_8 = __VLS_7({
        ...{ 'onClick': {} },
        ...{ class: "fw-btn" },
        name: "copyM",
        size: "1rem",
    }, ...__VLS_functionalComponentArgsRest(__VLS_7));
    let __VLS_10;
    let __VLS_11;
    let __VLS_12;
    const __VLS_13 = {
        onClick: (__VLS_ctx.toggleFold)
    };
    var __VLS_9;
    const __VLS_14 = {}.DsIcon;
    /** @type {[typeof __VLS_components.DsIcon, typeof __VLS_components.dsIcon, typeof __VLS_components.DsIcon, typeof __VLS_components.dsIcon, ]} */ ;
    // @ts-ignore
    const __VLS_15 = __VLS_asFunctionalComponent(__VLS_14, new __VLS_14({
        ...{ 'onClick': {} },
        ...{ class: "fw-btn" },
        name: "close",
        size: "1rem",
    }));
    const __VLS_16 = __VLS_15({
        ...{ 'onClick': {} },
        ...{ class: "fw-btn" },
        name: "close",
        size: "1rem",
    }, ...__VLS_functionalComponentArgsRest(__VLS_15));
    let __VLS_18;
    let __VLS_19;
    let __VLS_20;
    const __VLS_21 = {
        onClick: (__VLS_ctx.emitClose)
    };
    var __VLS_17;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "fw-body" },
    });
    __VLS_asFunctionalDirective(__VLS_directives.vShow)(null, { ...__VLS_directiveBindingRestFields, value: (!__VLS_ctx.folded) }, null, null);
    var __VLS_22 = {};
}
var __VLS_3;
/** @type {__VLS_StyleScopedClasses['floating-window']} */ ;
/** @type {__VLS_StyleScopedClasses['fw-header']} */ ;
/** @type {__VLS_StyleScopedClasses['fw-drag-handle']} */ ;
/** @type {__VLS_StyleScopedClasses['fw-title']} */ ;
/** @type {__VLS_StyleScopedClasses['fw-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['fw-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['fw-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['fw-body']} */ ;
// @ts-ignore
var __VLS_5 = __VLS_4, __VLS_23 = __VLS_22;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            show: show,
            folded: folded,
            toggleFold: toggleFold,
            root: root,
            header: header,
            title: title,
            containerStyle: containerStyle,
            headerStyle: headerStyle,
            dragHandleOverlayStyle: dragHandleOverlayStyle,
            emitClose: emitClose,
            onDragStart: onDragStart,
        };
    },
    emits: {},
    props: {
        modelValue: {
            type: Boolean,
            default: false
        },
        initialX: {
            type: Number,
            default: 100
        },
        initialY: {
            type: Number,
            default: 100
        },
        center: {
            type: Boolean,
            default: false
        },
        dragHandleHeight: {
            type: Number,
            default: 36
        },
        onlyLeftHandleWidth: {
            type: Number,
            default: null
        },
        restrictToViewport: {
            type: Boolean,
            default: true
        },
        title: {
            type: String,
            default: ''
        },
        zIndex: {
            type: Number,
            default: 2000
        },
        height: {
            type: String,
            default: '200px'
        },
        width: {
            type: String,
            default: '400px'
        },
        ballImage: {
            type: String,
            default: '' // 可以换成默认图片路径
        },
        ballSize: {
            type: Number,
            default: 48
        }
    },
});
const __VLS_component = (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    emits: {},
    props: {
        modelValue: {
            type: Boolean,
            default: false
        },
        initialX: {
            type: Number,
            default: 100
        },
        initialY: {
            type: Number,
            default: 100
        },
        center: {
            type: Boolean,
            default: false
        },
        dragHandleHeight: {
            type: Number,
            default: 36
        },
        onlyLeftHandleWidth: {
            type: Number,
            default: null
        },
        restrictToViewport: {
            type: Boolean,
            default: true
        },
        title: {
            type: String,
            default: ''
        },
        zIndex: {
            type: Number,
            default: 2000
        },
        height: {
            type: String,
            default: '200px'
        },
        width: {
            type: String,
            default: '400px'
        },
        ballImage: {
            type: String,
            default: '' // 可以换成默认图片路径
        },
        ballSize: {
            type: Number,
            default: 48
        }
    },
});
export default {};
; /* PartiallyEnd: #4569/main.vue */
