<script lang="ts" setup>
import musicScoreVue from 'deciphony-renderer'
import type {MusicScore} from 'deciphony-renderer'
import {computed, reactive, ref} from 'vue'
import {
  createGrandStaff,
  createMusicScore,
  createNoteSymbol,
  createNotesInfo,
} from './dr-extensions/dr-edit/score-builder'
import {TitleSlot, type TitleMode} from './dr-extensions/dr-title'

const mode = ref<TitleMode>('edit')

const musicScoreData = reactive<MusicScore>(
  (() => {
    const score = createMusicScore({width: 800, height: 600, topSpaceHeight: 24})
      score.title = '示例曲谱'
      score.subTitle = '副标题可选'
      score.author = '佚名'
      const grandStaff = createGrandStaff()
      score.grandStaffs.push(grandStaff)
      const measure = grandStaff.staves[0]!.measures[0]!
      const note = createNoteSymbol({region: 5, chronaxie: 64})
      note.notesInfo.push(createNotesInfo({region: 5}))
      measure.notes.push(note)
      return score
    })(),
)

const metaPreview = computed(() => ({
  title: musicScoreData.title,
  subTitle: musicScoreData.subTitle,
  author: musicScoreData.author,
}))
</script>

<template>
  <div class="title-test">
    <aside class="title-test__panel">
      <h2 class="title-test__heading">dr-title 测试</h2>
      <div class="title-test__mode">
        <button
            :class="['title-test__mode-btn', { 'title-test__mode-btn--active': mode === 'edit' }]"
            type="button"
            @click="mode = 'edit'"
        >
          edit
        </button>
        <button
            :class="['title-test__mode-btn', { 'title-test__mode-btn--active': mode === 'show' }]"
            type="button"
            @click="mode = 'show'"
        >
          show
        </button>
      </div>
      <p class="title-test__hint">
        布局：topSpaceHeight 顶部留白 → t 插槽（slotConfig.t.h）→ 曲谱。字段均可选，清空输入会变为 undefined。
      </p>
      <pre class="title-test__json">{{ JSON.stringify(metaPreview, null, 2) }}</pre>
    </aside>

    <div class="title-test__score">
      <musicScoreVue
        :data="musicScoreData"
        :slot-config="{ t: { h: 96 } }"
        skin-name="default"
      >
        <template #t="{ node }">
          <TitleSlot :mode="mode" :music-score="musicScoreData" :node="node"/>
        </template>
      </musicScoreVue>
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
  flex: 0 0 260px;
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
