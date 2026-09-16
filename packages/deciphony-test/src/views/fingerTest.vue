<script lang="ts" setup>
import {computed, reactive, ref} from 'vue'
import {Finger, FINGER_PART_LIST, type FingerMode} from '@deciphony/finger'

const duration = ref(0.25)
const fingerSize = ref(42)
const mode = ref<FingerMode>('edit')

const pose = reactive({
  thumbF: [520, 430, 38, -18] as number[],
  indexF: [430, 300, 0, 0, 0] as number[],
  middleF: [430, 360, 0, 0, 0] as number[],
  ringF: [430, 418, 0, 0, 0] as number[],
  littleF: [430, 470, 0, 0, 0] as number[],
})

const presets: Record<string, typeof pose> = {
  open: {
    thumbF: [520, 430, 38, -18],
    indexF: [430, 300, 0, 0, 0],
    middleF: [430, 360, 0, 0, 0],
    ringF: [430, 418, 0, 0, 0],
    littleF: [430, 470, 0, 0, 0],
  },
  fist: {
    thumbF: [500, 400, 70, 35],
    indexF: [430, 300, 8, 95, 70],
    middleF: [430, 360, 6, 100, 72],
    ringF: [430, 418, 8, 98, 68],
    littleF: [430, 470, 12, 92, 64],
  },
  point: {
    thumbF: [510, 410, 48, 12],
    indexF: [430, 300, 0, 0, 0],
    middleF: [430, 360, 8, 96, 70],
    ringF: [430, 418, 10, 98, 66],
    littleF: [430, 470, 14, 90, 60],
  },
}

function applyPreset(name: keyof typeof presets) {
  const next = presets[name]
  pose.thumbF = [...next.thumbF]
  pose.indexF = [...next.indexF]
  pose.middleF = [...next.middleF]
  pose.ringF = [...next.ringF]
  pose.littleF = [...next.littleF]
}

const galleryItems = computed(() =>
  FINGER_PART_LIST.map((part) => ({
    ...part,
    box: `${part.viewBox.x} ${part.viewBox.y} ${part.viewBox.w} ${part.viewBox.h}`,
  })),
)
</script>

<template>
  <div class="finger-test">
    <h1>Finger Test</h1>
    <p class="hint">
      编辑模式：蓝点=跟点拖拽，橙点=关节旋转。展示模式仅插值播放 pose。
    </p>

    <div class="toolbar">
      <button
        type="button"
        :class="{active: mode === 'edit'}"
        @click="mode = 'edit'"
      >编辑</button>
      <button
        type="button"
        :class="{active: mode === 'show'}"
        @click="mode = 'show'"
      >展示</button>
      <button type="button" @click="applyPreset('open')">张开</button>
      <button type="button" @click="applyPreset('fist')">握拳</button>
      <button type="button" @click="applyPreset('point')">指向</button>
      <label>
        size
        <input v-model.number="fingerSize" max="72" min="16" type="range"/>
        {{ fingerSize }}
      </label>
      <label>
        duration
        <input v-model.number="duration" max="1.2" min="0" step="0.05" type="range"/>
        {{ duration }}s
      </label>
    </div>

    <div class="stage">
      <Finger
        v-model:thumb-f="pose.thumbF"
        v-model:index-f="pose.indexF"
        v-model:middle-f="pose.middleF"
        v-model:ring-f="pose.ringF"
        v-model:little-f="pose.littleF"
        :duration="duration"
        :finger-size="fingerSize"
        :height="560"
        :mode="mode"
        :width="720"
      />
    </div>

    <pre class="pose-dump">{{ pose }}</pre>

    <h2>14 部件（朝左）</h2>
    <div class="gallery">
      <figure v-for="part in galleryItems" :key="part.id">
        <svg :viewBox="part.box" height="72" width="160">
          <image
            :height="part.viewBox.h"
            :href="part.href"
            :width="part.viewBox.w"
            :x="part.viewBox.x"
            :y="part.viewBox.y"
            preserveAspectRatio="none"
          />
        </svg>
        <figcaption>{{ part.id }} · {{ part.length }}x × {{ part.width }}x</figcaption>
      </figure>
    </div>
  </div>
</template>

<style scoped>
.finger-test {
  padding: 24px 32px 48px;
  background: #f4efe8;
  color: #3a2a22;
  min-height: 100vh;
  box-sizing: border-box;
}

h1 {
  margin: 0 0 8px;
}

.hint {
  margin: 0 0 16px;
  color: #6b5346;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 20px;
  align-items: center;
  margin-bottom: 16px;
}

button {
  padding: 6px 14px;
  border: 1px solid #c17a52;
  background: #fff;
  border-radius: 6px;
  cursor: pointer;
}

button.active {
  background: #c17a52;
  color: #fff;
}

.stage {
  width: 720px;
  height: 560px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 24px #00000014;
  overflow: hidden;
}

.pose-dump {
  margin-top: 12px;
  max-width: 720px;
  padding: 10px 12px;
  font-size: 12px;
  background: #fff;
  border-radius: 8px;
  overflow: auto;
}

.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
  margin-top: 12px;
}

figure {
  margin: 0;
  padding: 8px;
  background: #fff;
  border-radius: 8px;
}

figure svg {
  display: block;
  width: 100%;
  height: 80px;
  background: repeating-linear-gradient(45deg, #f7f2ec, #f7f2ec 8px, #efe7de 8px, #efe7de 16px);
}

figcaption {
  margin-top: 6px;
  font-size: 12px;
  color: #6b5346;
}
</style>
