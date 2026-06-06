<script lang="ts" setup>
import type {MusicScore, VDom} from 'deciphony-renderer'
import {computed} from 'vue'
import {readTitleField, writeTitleField, type TitleFieldKey} from '../titleFields'
import type {TitleMode} from '../types'

const props = defineProps<{
  node: VDom
  musicScore: MusicScore
  mode: TitleMode
}>()

const slotW = computed(() => props.node.w)
const slotH = computed(() => props.node.h)

const centerY = computed(() => slotH.value * 0.42)
const authorX = computed(() => slotW.value - 10)
const authorY = computed(() => slotH.value - 8)

function onFieldInput(key: TitleFieldKey, event: Event) {
  writeTitleField(props.musicScore, key, (event.target as HTMLInputElement).value)
}
</script>

<template>
  <g class="dr-title-slot">
    <template v-if="mode === 'show'">
      <text
        v-if="musicScore.title"
        class="dr-title-slot__title"
        :x="slotW / 2"
        :y="centerY - (musicScore.subTitle ? 10 : 0)"
        dominant-baseline="middle"
        text-anchor="middle"
      >{{ musicScore.title }}</text>
      <text
        v-if="musicScore.subTitle"
        class="dr-title-slot__subtitle"
        :x="slotW / 2"
        :y="centerY + 16"
        dominant-baseline="middle"
        text-anchor="middle"
      >{{ musicScore.subTitle }}</text>
      <text
        v-if="musicScore.author"
        class="dr-title-slot__author"
        :x="authorX"
        :y="authorY"
        text-anchor="end"
      >{{ musicScore.author }}</text>
    </template>

    <foreignObject v-else :height="slotH" :width="slotW" x="0" y="0">
      <div
        class="dr-title-slot__editor"
        xmlns="http://www.w3.org/1999/xhtml"
        :style="{width: `${slotW}px`, height: `${slotH}px`}"
      >
        <div class="dr-title-slot__center">
          <input
            class="dr-title-slot__input dr-title-slot__input--title"
            placeholder="标题"
            type="text"
            :value="readTitleField(musicScore, 'title')"
            @click.stop
            @input="onFieldInput('title', $event)"
            @pointerdown.stop
          />
          <input
            class="dr-title-slot__input dr-title-slot__input--subtitle"
            placeholder="副标题"
            type="text"
            :value="readTitleField(musicScore, 'subTitle')"
            @click.stop
            @input="onFieldInput('subTitle', $event)"
            @pointerdown.stop
          />
        </div>
        <input
          class="dr-title-slot__input dr-title-slot__input--author"
          placeholder="作者"
          type="text"
          :value="readTitleField(musicScore, 'author')"
          @click.stop
          @input="onFieldInput('author', $event)"
          @pointerdown.stop
        />
      </div>
    </foreignObject>
  </g>
</template>

<style scoped>
.dr-title-slot__title {
  font-size: 20px;
  font-weight: 600;
  fill: #303133;
}

.dr-title-slot__subtitle {
  font-size: 14px;
  fill: #606266;
}

.dr-title-slot__author {
  font-size: 12px;
  fill: #909399;
}

.dr-title-slot__editor {
  position: relative;
  box-sizing: border-box;
  font-family: inherit;
}

.dr-title-slot__center {
  position: absolute;
  inset: 0 12px auto;
  top: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  transform: translateY(-50%);
}

.dr-title-slot__input {
  box-sizing: border-box;
  width: min(420px, 100%);
  padding: 4px 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #fff;
  color: #303133;
  outline: none;
}

.dr-title-slot__input:focus {
  border-color: #409eff;
}

.dr-title-slot__input--title {
  font-size: 18px;
  font-weight: 600;
  text-align: center;
}

.dr-title-slot__input--subtitle {
  font-size: 13px;
  text-align: center;
}

.dr-title-slot__input--author {
  position: absolute;
  right: 10px;
  bottom: 6px;
  width: 160px;
  font-size: 12px;
  text-align: right;
}
</style>
