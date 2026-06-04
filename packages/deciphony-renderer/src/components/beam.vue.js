import { computed } from 'vue';
const props = defineProps();
const beam = computed(() => props.vDom.special?.beam);
/**
 * 将每条符杠线 spec 转为 SVG path（四边形）。
 *
 * type 含义（以 centerX 为界）：
 * - both：从 centerX 向左右各画到段界（中间音符）；
 * - left：只画 centerX 以左（组右端或较短时值）；
 * - right：只画 centerX 以右（组左端或较短时值）；
 * - none：不画。
 *
 * scaleX：半幅宽度缩放，BEAM_PARTIAL_SCALE（0.5）用于单独音符的半条符杠。
 * 在斜率直线上按 x 比例插值 y，再按 direction 向下/向上堆叠第 i 条线。
 */
const quads = computed(() => {
    const b = beam.value;
    const { startPoint, endPoint } = props.vDom;
    if (!b || !startPoint || !endPoint)
        return [];
    const { lines, centerX, direction, thickness = 1.5 } = b;
    const left = startPoint;
    const right = endPoint;
    const fullW = right.x - left.x;
    const fullDy = right.y - left.y;
    const scaleX = (s) => s ?? 1;
    return lines.map((spec, i) => {
        if (spec.type === 'none')
            return null;
        const s = scaleX(spec.scaleX);
        let x0, x1;
        if (spec.type === 'left') {
            if (centerX <= left.x)
                return null;
            x0 = centerX - s * (centerX - left.x);
            x1 = centerX;
        }
        else if (spec.type === 'right') {
            if (centerX >= right.x)
                return null;
            x0 = centerX;
            x1 = centerX + s * (right.x - centerX);
        }
        else {
            x0 = centerX - s * (centerX - left.x);
            x1 = centerX + s * (right.x - centerX);
        }
        // 在 startPoint→endPoint 的斜线段上，按 x 位置线性插值 y
        const t0 = fullW === 0 ? 0 : (x0 - left.x) / fullW;
        const t1 = fullW === 0 ? 1 : (x1 - left.x) / fullW;
        const y0 = left.y + fullDy * t0;
        const y1 = left.y + fullDy * t1;
        const dy = i * (thickness + thickness); // 多条线之间的间距
        if (direction === 'up') {
            return `M ${x0} ${y0 + dy} L ${x1} ${y1 + dy} L ${x1} ${y1 + dy + thickness} L ${x0} ${y0 + dy + thickness} Z`;
        }
        else {
            return `M ${x0} ${y0 - dy} L ${x1} ${y1 - dy} L ${x1} ${y1 - dy - thickness} L ${x0} ${y0 - dy - thickness} Z`;
        }
    }).filter((d) => d != null);
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
for (const [d, i] of __VLS_getVForSourceType((__VLS_ctx.quads))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
        key: (i),
        d: (d),
        fill: "currentColor",
    });
}
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            quads: quads,
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
