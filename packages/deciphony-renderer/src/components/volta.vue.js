import { computed } from 'vue';
const props = defineProps();
// 反复房子：左侧竖线 + 底边 + 可选序号（如 1. 2.），在局部 (0,0)-(w,h) 内绘制
const w = computed(() => props.vDom.w);
const h = computed(() => props.vDom.h);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
    x1: (0.5),
    x2: (0.5),
    y1: (0),
    y2: (__VLS_ctx.h),
    stroke: "currentColor",
    'stroke-width': "1",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
    x1: (0),
    x2: (__VLS_ctx.w),
    y1: (0.5),
    y2: (0.5),
    stroke: "currentColor",
    'stroke-width': "1",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.text, __VLS_intrinsicElements.text)({
    y: (__VLS_ctx.h - 10),
    'dominant-baseline': "auto",
    fill: "currentColor",
    'font-size': "10",
    x: "6",
});
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            w: w,
            h: h,
        };
    },
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeProps: {},
});
; /* PartiallyEnd: #4569/main.vue */
