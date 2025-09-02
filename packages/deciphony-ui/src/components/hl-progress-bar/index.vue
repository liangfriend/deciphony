<template>
  <div class="hl-progress-bar relative flex justify-center" :style="{ width, height }">
    <canvas
      ref="canvas"
      class="hl-progress-bar-canvas"
      :style="{ width: '100%', height: '100%' }"
    ></canvas>
  </div>
</template>

<script setup>
defineOptions({
  name: 'HlProgressBar' // 给组件一个全局 name
});
import { ref, onMounted, computed, watch } from 'vue';

const props = defineProps({
  width: {
    default: '200px',
    type: String
  },
  height: {
    default: '12px',
    type: String
  },
  progress: {
    type: [Number, String],
    default: 0
  },
  emptyColor: {
    type: String,
    default: '#ccc'
  },
  fillColor: {
    type: String,
    default: '#000'
  }
});
const canvas = ref(null);
const progress = computed(() => props.progress);

watch(progress, () => {
  drawProgress();
});
const drawProgress = () => {
  const el = canvas.value;
  const ctx = el.getContext('2d');
  const width = (el.width = el.offsetWidth);
  const height = (el.height = el.offsetHeight);

  const radius = height / 2;
  const totalProgress = Math.max(0, Math.min(1, Number(progress.value) / 100));
  const barLength = width;
  const fillWidth = totalProgress * barLength;

  ctx.clearRect(0, 0, width, height);

  // 画背景（emptyColor）
  ctx.beginPath();
  ctx.fillStyle = props.emptyColor;
  ctx.moveTo(radius, 0);
  ctx.lineTo(barLength - radius, 0);
  ctx.quadraticCurveTo(barLength, 0, barLength, radius);
  ctx.lineTo(barLength, height - radius);
  ctx.quadraticCurveTo(barLength, height, barLength - radius, height);
  ctx.lineTo(radius, height);
  ctx.quadraticCurveTo(0, height, 0, height - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.fill();

  // 画进度（fillColor）
  if (fillWidth > 0) {
    const fillEnd = Math.min(fillWidth, barLength);
    ctx.beginPath();
    ctx.fillStyle = props.fillColor;

    if (fillWidth <= radius) {
      // 进度太短，保留固定的左半圆区域
      ctx.moveTo(radius, 0);
      ctx.lineTo(radius, 0);
      ctx.quadraticCurveTo(0, 0, 0, radius);
      ctx.quadraticCurveTo(0, height, radius, height);
      ctx.lineTo(radius, 0);
    } else {
      const isFull = fillEnd >= barLength;
      const rightRadius = isFull ? radius : fillEnd >= radius ? radius : fillEnd;

      ctx.moveTo(radius, 0);
      ctx.lineTo(fillEnd - rightRadius, 0);
      ctx.quadraticCurveTo(fillEnd, 0, fillEnd, radius);
      ctx.lineTo(fillEnd, height - radius);
      ctx.quadraticCurveTo(fillEnd, height, fillEnd - rightRadius, height);
      ctx.lineTo(radius, height);
      ctx.quadraticCurveTo(0, height, 0, height - radius);
      ctx.lineTo(0, radius);
      ctx.quadraticCurveTo(0, 0, radius, 0);
    }

    ctx.fill();
  }
};

onMounted(() => {
  drawProgress();
});
</script>

<style scoped>
.hl-progress-bar-canvas {
  display: block;
}
</style>
