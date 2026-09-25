<script lang="ts" setup>
/**
 * 拍号竖排：分子 + 横杠 + 分母（Common→4/4，Cut→2/2）
 */
import {computed} from 'vue'
import {
  TimeSignatureTypeEnum,
  timeSignatureTypeToBeats,
} from '@deciphony/renderer'

const props = withDefaults(
  defineProps<{
    type: TimeSignatureTypeEnum
    /** 整体高度 px */
    height?: number
  }>(),
  {
    height: 28,
  },
)

const beats = computed(() => timeSignatureTypeToBeats(props.type))
</script>

<template>
  <span
    class="time-sig-glyph"
    :style="{height: `${height}px`}"
    :title="`${beats.beats}/${beats.beatType}`"
  >
    <span class="time-sig-glyph__num">{{ beats.beats }}</span>
    <span class="time-sig-glyph__bar" />
    <span class="time-sig-glyph__den">{{ beats.beatType }}</span>
  </span>
</template>

<style scoped>
.time-sig-glyph {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  min-width: 1.1em;
  color: #303133;
  font-weight: 600;
  font-size: 12px;
  line-height: 1;
  vertical-align: middle;
  flex-shrink: 0;
  font-family: inherit;
}

.time-sig-glyph__num,
.time-sig-glyph__den {
  display: block;
  text-align: center;
}

.time-sig-glyph__bar {
  display: block;
  width: 100%;
  min-width: 0.9em;
  height: 1.5px;
  background: currentColor;
  border-radius: 1px;
}
</style>
