<template>
    <!-- 反复符号的线条 -->
    <path
        :d="voltaPath"
        fill="transparent"
        stroke="black"
        stroke-width="1"
    />

    <!-- 文本（如 "1."、"1,2,3" 等） -->
    <text
        :x="textPosition.x+10"
        :y="textPosition.y+20"
        dominant-baseline="hanging"
        font-size="12"
    >
        {{ '1,2,3' }}
    </text>
</template>

<script lang="ts" setup>
import {computed, PropType} from "vue";
import {Volta} from "deciphony-core";

const props = defineProps({
    volta: {
        type: Object as PropType<Volta>,
        required: true
    },
    position: {
        type: Object as PropType<{
            startPoint: { x: number; y: number };
            endPoint: { x: number; y: number };
        }>,
        default: () => ({
            startPoint: {x: 0, y: 0},
            endPoint: {x: 0, y: 0}
        }),
    },
});

// ✅ 实际绘制坐标 = position + volta.options.offset
const actualPoints = computed(() => ({
    startPoint: {
        x: props.position.startPoint.x + props.volta?.options.offset.startPoint.x,
        y: props.position.startPoint.y + props.volta?.options.offset.startPoint.y,
    },
    endPoint: {
        x: props.position.endPoint.x + props.volta?.options.offset.endPoint.x,
        y: props.position.endPoint.y + props.volta?.options.offset.endPoint.y,
    },
}));


// ✅ 绘制路径：左竖线 + 顶部横线
const voltaPath = computed(() => {
    const {startPoint, endPoint} = actualPoints.value;
    const y = startPoint.y;
    const h = 10; // 顶线高度
    const space = 4 // 距离拖拽容器有点距离
    return `
    M ${startPoint.x + space} ${endPoint.y - space}
    L ${startPoint.x + space} ${startPoint.y + space}
    L ${endPoint.x - space} ${startPoint.y + space}
  `;
});

// ✅ 文本位置（稍微偏上）
const textPosition = computed(() => {
    const {startPoint} = actualPoints.value;
    return {x: startPoint.x + 4, y: startPoint.y - 10};
});
</script>

<style scoped>
.volta {
    pointer-events: auto;
    user-select: none;
}
</style>
