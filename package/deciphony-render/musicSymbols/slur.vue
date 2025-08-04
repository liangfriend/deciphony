<template>
  <div class="slur">
    <svg class="slur-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
      <path
          class="slur-path"
          :d="slurPath"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
import {computed, PropType} from "vue";
import type {Slur} from "@/applications/ChuangKeApplication/components/musicScore/types";

const props = defineProps({
  slur: {
    type: Object as PropType<Slur>,
    required: true
  }
});

const slurPath = computed(() => {
  const leftX = 0, centerX = 50, rightX = 100
  const middleY = 50
  const topY = -30         // 顶点拉高（拱起更大）
  const bottomY = 0       // 下弧控制点向下拉（厚度更厚）

  return `
    M ${leftX},${middleY}
    Q ${centerX},${topY} ${rightX},${middleY}
    Q ${centerX},${bottomY} ${leftX},${middleY}
    Z
  `.trim();
});
</script>

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
