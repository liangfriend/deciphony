<script lang="ts" setup>
import {
  KeySignatureTypeEnum,
  TIME_SIGNATURE_TYPES_ORDERED,
  TimeSignatureTypeEnum,
  timeSignatureTypeToLabel,
  type MusicScore,
  type VDom,
} from '@deciphony/renderer'
import {computed, unref, type MaybeRef} from 'vue'
import {BEAT_UNIT_OPTIONS, normalizeBeatUnit, type BeatUnitValue} from '../beatUnit'
import {keySignatureLabel} from '../keySignatureLabel'
import {readTitleField, writeTitleField, type TitleFieldKey} from '../titleFields'
import type {TitleMode} from '../types'
import BeatUnitGlyph from './BeatUnitGlyph.vue'
import TimeSignatureGlyph from './TimeSignatureGlyph.vue'

const props = withDefaults(
  defineProps<{
    node: VDom
    musicScore: MusicScore
    mode: MaybeRef<TitleMode>
    /** 左侧内缩 px */
    paddingLeft?: number
    /** 右侧内缩 px */
    paddingRight?: number
    /** 字体族；未传则沿用宿主 / 浏览器默认 */
    fontFamily?: MaybeRef<string | undefined>
  }>(),
  {
    paddingLeft: 0,
    paddingRight: 0,
  },
)

const titleMode = computed(() => unref(props.mode))
const fontFamilyStyle = computed(() => {
  const fontFamily = unref(props.fontFamily)?.trim()
  return fontFamily ? {fontFamily} : undefined
})

/** 三块独立：调号 / 拍号 /（beatUnit+bpm） */
const showKeyMeta = computed(() => props.musicScore.keySignature != null)
const showTimeMeta = computed(() => props.musicScore.timeSignature != null)
const showTempoMeta = computed(
  () => props.musicScore.beatUnit != null || props.musicScore.bpm != null,
)
const showScoreMeta = computed(
  () => showKeyMeta.value || showTimeMeta.value || showTempoMeta.value,
)

const padL = computed(() => Math.max(0, props.paddingLeft))
const padR = computed(() => Math.max(0, props.paddingRight))

const slotW = computed(() => props.node.w)
const slotH = computed(() => props.node.h)

const contentW = computed(() => Math.max(0, slotW.value - padL.value - padR.value))
const centerX = computed(() => padL.value + contentW.value / 2)
/** 相对槽顶：标题贴顶；副标题 / 作者与左侧元信息同高 */
/** 标题按字体上沿（text-before-edge）贴顶；用 hanging 时中文字形高出槽顶，曲谱 svg 顶部会把它裁掉 */
const TITLE_Y = 0
const SUBTITLE_Y = 28
const META_Y = 72
const authorX = computed(() => slotW.value - padR.value)
/** 作者多行：每行一个 tspan，行高 = 字号（12px）× 1.4 */
const AUTHOR_LINE_H = 17
const authorLines = computed(() =>
  (props.musicScore.author ?? '').split('\n').map((line) => line.trim()).filter(Boolean),
)
const metaX = computed(() => padL.value)

const KEY_OPTIONS = Object.values(KeySignatureTypeEnum)
const TIME_OPTIONS = TIME_SIGNATURE_TYPES_ORDERED

const keySig = computed(
  () => props.musicScore.keySignature ?? KeySignatureTypeEnum.C,
)
const timeSig = computed(
  () => props.musicScore.timeSignature ?? TimeSignatureTypeEnum['4_4'],
)
const bpm = computed(() => props.musicScore.bpm ?? 120)
const beatUnit = computed(() => normalizeBeatUnit(props.musicScore.beatUnit))

function onFieldInput(key: TitleFieldKey, event: Event) {
  writeTitleField(props.musicScore, key, (event.target as HTMLInputElement | HTMLTextAreaElement).value)
}

function onKeyChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value as KeySignatureTypeEnum
  props.musicScore.keySignature = value
}

function onTimeChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value as TimeSignatureTypeEnum
  props.musicScore.timeSignature = value
}

function onBeatUnitChange(event: Event) {
  const value = Number((event.target as HTMLSelectElement).value) as BeatUnitValue
  props.musicScore.beatUnit = value
}

function onBpmInput(event: Event) {
  const raw = (event.target as HTMLInputElement).value
  const n = Number(raw)
  if (!Number.isFinite(n) || n <= 0) {
    props.musicScore.bpm = 120
    return
  }
  props.musicScore.bpm = Math.round(n)
}
</script>

<template>
  <g class="dr-title-slot" :style="fontFamilyStyle">
    <template v-if="titleMode === 'show'">
      <text
        v-if="musicScore.title"
        class="dr-title-slot__title"
        :x="centerX"
        :y="TITLE_Y"
        dominant-baseline="text-before-edge"
        text-anchor="middle"
      >{{ musicScore.title }}</text>
      <text
        v-if="musicScore.subTitle"
        class="dr-title-slot__subtitle"
        :x="centerX"
        :y="SUBTITLE_Y"
        dominant-baseline="hanging"
        text-anchor="middle"
      >{{ musicScore.subTitle }}</text>

      <foreignObject
        v-if="showScoreMeta"
        :x="metaX"
        :y="META_Y"
        width="360"
        height="40"
      >
        <div
          class="dr-title-slot__meta"
          xmlns="http://www.w3.org/1999/xhtml"
          :style="fontFamilyStyle"
        >
          <span
            v-if="showKeyMeta"
            class="dr-title-slot__meta-text"
          >1 = {{ keySignatureLabel(keySig) }}</span>
          <TimeSignatureGlyph
            v-if="showTimeMeta"
            :type="timeSig"
            :height="28"
          />
          <template v-if="showTempoMeta">
            <BeatUnitGlyph :beat-unit="beatUnit" :height="22" />
            <span class="dr-title-slot__meta-text">= {{ bpm }}</span>
          </template>
        </div>
      </foreignObject>

      <text
        v-if="authorLines.length"
        class="dr-title-slot__author"
        :x="authorX"
        :y="META_Y"
        dominant-baseline="hanging"
        text-anchor="end"
      >
        <tspan
          v-for="(line, i) in authorLines"
          :key="i"
          :x="authorX"
          :y="META_Y + i * AUTHOR_LINE_H"
        >{{ line }}</tspan>
      </text>
    </template>

    <foreignObject v-else :height="slotH" :width="slotW" x="0" y="0">
      <div
        class="dr-title-slot__editor"
        xmlns="http://www.w3.org/1999/xhtml"
        :style="{width: `${slotW}px`, height: `${slotH}px`, ...fontFamilyStyle}"
      >
        <div
          class="dr-title-slot__center"
          :style="{left: `${padL}px`, right: `${padR}px`}"
        >
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

        <div
          v-if="showScoreMeta"
          class="dr-title-slot__meta-edit"
          :style="{left: `${padL}px`, top: `${META_Y}px`}"
        >
          <template v-if="showKeyMeta">
            <span class="dr-title-slot__meta-text">1 =</span>
            <select
              class="dr-title-slot__select"
              :value="keySig"
              @change="onKeyChange"
              @click.stop
              @pointerdown.stop
            >
              <option v-for="k in KEY_OPTIONS" :key="k" :value="k">
                {{ keySignatureLabel(k) }}
              </option>
            </select>
          </template>
          <select
            v-if="showTimeMeta"
            class="dr-title-slot__select"
            :value="timeSig"
            title="拍号"
            @change="onTimeChange"
            @click.stop
            @pointerdown.stop
          >
            <option v-for="t in TIME_OPTIONS" :key="t" :value="t">
              {{ timeSignatureTypeToLabel(t) }}
            </option>
          </select>
          <template v-if="showTempoMeta">
            <select
              class="dr-title-slot__select"
              :value="beatUnit"
              title="bpm 基准拍"
              @change="onBeatUnitChange"
              @click.stop
              @pointerdown.stop
            >
              <option v-for="o in BEAT_UNIT_OPTIONS" :key="o.value" :value="o.value">
                {{ o.label }}
              </option>
            </select>
            <span class="dr-title-slot__meta-text">=</span>
            <input
              class="dr-title-slot__input dr-title-slot__input--bpm"
              type="number"
              min="1"
              step="1"
              :value="bpm"
              @click.stop
              @input="onBpmInput"
              @pointerdown.stop
            />
          </template>
        </div>

        <textarea
          class="dr-title-slot__input dr-title-slot__input--author"
          placeholder="作者（回车换行）"
          :rows="Math.max(1, (musicScore.author ?? '').split('\n').length)"
          :style="{right: `${padR}px`, top: `${META_Y}px`}"
          :value="readTitleField(musicScore, 'author')"
          @click.stop
          @input="onFieldInput('author', $event)"
          @keydown.stop
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
  top: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.dr-title-slot__meta,
.dr-title-slot__meta-edit {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  font-size: 17px;
  color: #303133;
  white-space: nowrap;
  font-family: inherit;
}

.dr-title-slot__meta-edit {
  position: absolute;
}

.dr-title-slot__meta-text {
  line-height: 1;
  font-size: 17px;
}

.dr-title-slot__input {
  box-sizing: border-box;
  width: min(360px, 100%);
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
  width: 140px;
  font-size: 12px;
  line-height: 1.4;
  text-align: right;
  resize: none;
  font-family: inherit;
}

.dr-title-slot__input--bpm {
  width: 64px;
  font-size: 15px;
  text-align: center;
}

.dr-title-slot__select {
  box-sizing: border-box;
  height: 30px;
  padding: 2px 6px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #fff;
  color: #303133;
  font-size: 15px;
  outline: none;
}

.dr-title-slot__select:focus {
  border-color: #409eff;
}
</style>
