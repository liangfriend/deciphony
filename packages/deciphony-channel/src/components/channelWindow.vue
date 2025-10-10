<script setup lang="ts">
import {onMounted, PropType, ref, watchEffect} from "vue";
import {HighlightItem} from "@core/types";

const props = defineProps({
  channelData: {
    type: Array as PropType<number[]>,
    default: () => []
  },
  zoom: {
    type: Number,
    default: 200,
  },
  // 采样点步长
  sampleStep: {
    type: Number,
    default: 1,
  },
  // 振幅高度缩放因子
  amplitudeScale: {
    type: Number,
    default: 1
  },
  // 高亮索引列表
  highlightList: {
    type: Array as PropType<Array<HighlightItem>>,
    default: () => [],
  },
})
// === 向外发事件 ===
const emit = defineEmits<{
  (e: "pointClick", payload: { index: number; value: number }): void;
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null)
watchEffect(() => {
  draw()
})

// 绘制波形 + 播放位置
function draw() {
  if (!canvasRef.value) return
  const ctx = canvasRef.value.getContext("2d")!
  const height = canvasRef.value.height
  const widthScale = 1
  const pxPerSecond = 200 * props.zoom
  const width = Math.floor(widthScale * pxPerSecond)

  canvasRef.value.width = width
  ctx.clearRect(0, 0, width, height)
  const data = props.channelData
  const step = props.sampleStep > 0
      ? props.sampleStep
      : Math.max(1, Math.floor(data.length / width))

  const amp = (height / 2) * props.amplitudeScale
  ctx.beginPath()
  ctx.moveTo(0, height / 2)
  for (let i = 0; i < data.length; i += step) {
    const x = (i / data.length) * width
    const y = height / 2 - data[i] * amp
    ctx.lineTo(x, y)
  }
  ctx.strokeStyle = "#333"
  ctx.stroke()

  // === 绘制高亮线 ===
  if (props.highlightList && props.highlightList.length > 0) {
    props.highlightList.forEach(({color, index, name, show}) => {

      if (index >= 0 && index < data.length && show) {
        const x = (index / data.length) * width;

        // 竖线
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height - 42);
        ctx.strokeStyle = color || "red";
        ctx.lineWidth = 1;
        ctx.stroke();

        // === 底部文字标识 ===
        ctx.fillStyle = color || "red";
        ctx.font = "12px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";

        ctx.fillText(name, x, height - 26); // 名称
        ctx.fillText(data[index].toFixed(4), x, height - 14); // 值
        ctx.fillText('' + index, x, height - 2); // 索引
      }
    });
  }
}

// === 点击事件处理 ===
function handleClick(e: MouseEvent) {
  if (!canvasRef.value) return;

  const rect = canvasRef.value.getBoundingClientRect();
  const x = e.clientX - rect.left;
  // 根据点击位置 x 反算采样点索引
  const data = props.channelData;
  const width = rect.width;
  const index = Math.round((x / width) * data.length)
  if (index >= 0 && index < data.length) {
    emit("pointClick", {index, value: data[index]});
  }
}

// TODO 暴露点击事件，返回当前选中点索引和值
defineExpose({draw})
onMounted(() => {
  // if (canvasRef.value) {
  //   canvasRef.value.height = 200
  // }
})
</script>

<template>
  <canvas @click="handleClick" ref="canvasRef" class="h-full"></canvas>
</template>

<style scoped>

</style>