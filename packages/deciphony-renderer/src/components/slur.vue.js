import { computed } from 'vue';
const props = defineProps();
// 两条二次贝塞尔曲线围成月牙形：起点→控制点→终点，下弧 终点→控制点'→起点；控制点 = 默认中点上方 + special.slur.relativeControlPoint 偏移，厚度来自 special.slur
const pathD = computed(() => {
    const s = props.vDom.startPoint;
    const e = props.vDom.endPoint;
    const slur = props.vDom.special?.slur;
    const thickness = slur?.thickness ?? 2;
    const relCtrl = slur?.relativeControlPoint ?? { x: 0, y: 0 };
    const defaultCx = (s.x + e.x) / 2;
    const defaultCy = Math.min(s.y, e.y) - Math.max(8, Math.abs(e.x - s.x) * 0.2);
    const cx = defaultCx + relCtrl.x;
    const cy = defaultCy + relCtrl.y;
    const cy2 = cy + thickness;
    return `M ${s.x} ${s.y} Q ${cx} ${cy} ${e.x} ${e.y} Q ${cx} ${cy2} ${s.x} ${s.y} Z`;
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: (__VLS_ctx.pathD),
    fill: "currentColor",
    stroke: "none",
});
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            pathD: pathD,
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
