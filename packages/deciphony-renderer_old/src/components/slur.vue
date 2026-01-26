<script lang="ts" setup>
import {computed, PropType} from "vue";
import type {Slur} from "deciphony-core";

const props = defineProps({
    slur: {
        type: Object as PropType<Slur>,
        required: true
    },
    position: {
        type: Object as PropType<{
            startPoint: { x: number; y: number };
            endPoint: { x: number; y: number };
            leftSlope: { x: number; y: number };
            rightSlope: { x: number; y: number };
        }>,
        default: () => ({
            startPoint: {x: 0, y: 0},
            endPoint: {x: 0, y: 0},
            leftSlope: {x: 0, y: 0},
            rightSlope: {x: 0, y: 0}
        }),
    },
});
// ✅ 实际绘制坐标 = position + volta.options.offset
const actualPoints = computed(() => {
    if (!props.slur?.options?.offset?.startPoint
        || !props.slur?.options?.offset?.endPoint
        || !props.slur?.options?.offset?.leftSlope
        || !props.slur?.options?.offset?.rightSlope) {
        return {
            startPoint: {
                x: 0,
                y: 0,
            },
            endPoint: {
                x: 0,
                y: 0,
            },
            leftSlope: {
                x: 0,
                y: 0,
            },
            rightSlope: {
                x: 0,
                y: 0,
            }
        }
    }

    return {
        startPoint: {
            x: props.position.startPoint.x + props.slur?.options.offset.startPoint.x,
            y: props.position.startPoint.y + props.slur?.options.offset.startPoint.y,
        },
        endPoint: {
            x: props.position.endPoint.x + props.slur?.options.offset.endPoint.x,
            y: props.position.endPoint.y + props.slur?.options.offset.endPoint.y,
        },
        leftSlope: {
            x: props.position.leftSlope.x + props.slur?.options.offset.leftSlope.x,
            y: props.position.leftSlope.y + props.slur?.options.offset.leftSlope.y,
        }, rightSlope: {
            x: props.position.rightSlope.x + props.slur?.options.offset.rightSlope.x,
            y: props.position.rightSlope.y + props.slur?.options.offset.rightSlope.y,
        },
    }


});
// 路径计算
const path = computed(() => {
    const s = actualPoints.value.startPoint
    const e = actualPoints.value.endPoint
    const l = actualPoints.value.leftSlope
    const r = actualPoints.value.rightSlope
    // 后续对于连音线的形状不满意，单独修改这里就可以
    return `M ${s.x} ${s.y} C ${l.x} ${l.y}, ${r.x} ${r.y}, ${e.x} ${e.y}
          C ${r.x} ${r.y + 5}, ${l.x} ${l.y + 5}, ${s.x} ${s.y}`
})

</script>
<template>
    <path :d="path" class="slur" fill="black" stroke="none" stroke-width="2"/>
</template>
<style scoped>
.slur {
    width: 100%;
    height: 100%;
    pointer-events: auto;
    user-select: none;
}

.slur > * {
    pointer-events: none;
}

.slur-svg {
    width: 100%;
    height: 100%;
}

.slur-path {
    fill: black;
    stroke: none;
}
</style>
