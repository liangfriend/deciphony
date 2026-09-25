<script lang="ts" setup>
import type {MusicScore} from '@deciphony/renderer'
import musicScoreVue, {MusicScoreTypeEnum} from '@deciphony/renderer'
import {computed, reactive, ref} from 'vue'
import {
  createGrandStaff,
  createMusicScore,
  createNoteNumber,
} from '@deciphony/extensions/dr-edit/score-builder'
import {drTitle, type TitleMode} from '@deciphony/extensions/dr-title'

const mode = ref<TitleMode>('edit')
const extensions = [drTitle({mode})]

const musicScoreData = reactive<MusicScore>(
  (() => {
    const score = createMusicScore({
      type: MusicScoreTypeEnum.NumberNotation,
      width: 800,
      height: 600,
      topSpaceHeight: 24,
    })
    score.title = '示例曲谱'
    score.subTitle = '副标题可选'
    score.author = '佚名'
    const grandStaff = createGrandStaff({notationType: MusicScoreTypeEnum.NumberNotation})
    score.grandStaffs.push(grandStaff)
    const measure = grandStaff.staves[0]!.measures[0]!
    measure.notes.push(createNoteNumber({syllable: 1, chronaxie: 64}))
    return score
  })(),
)

const metaPreview = computed(() => ({
  title: musicScoreData.title,
  subTitle: musicScoreData.subTitle,
  author: musicScoreData.author,
  keySignature: musicScoreData.keySignature,
  timeSignature: musicScoreData.timeSignature,
  beatUnit: musicScoreData.beatUnit,
  bpm: musicScoreData.bpm,
  firstMeasureKey: musicScoreData.grandStaffs[0]?.staves[0]?.measures[0]?.keySignature_f?.type ?? null,
  firstMeasureTime: musicScoreData.grandStaffs[0]?.staves[0]?.measures[0]?.timeSignature_f?.type ?? null,
}))
</script>

<template>
  <div class="title-test">
    <aside class="title-test__panel">
      <h2 class="title-test__heading">dr-title 测试（简谱）</h2>
      <div class="title-test__mode">
        <button
          :class="['title-test__mode-btn', {'title-test__mode-btn--active': mode === 'edit'}]"
          type="button"
          @click="mode = 'edit'"
        >
          edit
        </button>
        <button
          :class="['title-test__mode-btn', {'title-test__mode-btn--active': mode === 'show'}]"
          type="button"
          @click="mode = 'show'"
        >
          show
        </button>
      </div>
      <p class="title-test__hint">
        左侧：有顶层 keySignature 时显示 1 = 调号 · 基准拍 · = bpm；右侧作者同高。
      </p>
      <pre class="title-test__json">{{ JSON.stringify(metaPreview, null, 2) }}</pre>
    </aside>

    <div class="title-test__score">
      <musicScoreVue
        :data="musicScoreData"
        :extensions="extensions"
        skin-name="default"
      />
    </div>
  </div>
</template>

<style scoped>
.title-test {
  display: flex;
  gap: 16px;
  height: 100%;
  padding: 16px;
  box-sizing: border-box;
}

.title-test__panel {
  flex: 0 0 280px;
}

.title-test__heading {
  margin: 0 0 12px;
  font-size: 18px;
}

.title-test__mode {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.title-test__mode-btn {
  padding: 6px 14px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
}

.title-test__mode-btn--active {
  border-color: #409eff;
  color: #409eff;
}

.title-test__hint {
  margin: 0 0 12px;
  font-size: 12px;
  line-height: 1.5;
  color: #606266;
}

.title-test__json {
  margin: 0;
  padding: 10px;
  border-radius: 6px;
  background: #f5f7fa;
  font-size: 12px;
  white-space: pre-wrap;
}

.title-test__score {
  flex: 1;
  min-width: 0;
  overflow: auto;
}
</style>
