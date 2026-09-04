<script lang="ts" setup>
import type {MusicScore} from 'deciphony-renderer'
import musicScoreVue from 'deciphony-renderer'
import {computed, reactive, ref} from 'vue'
import {
  createGrandStaff,
  createLyrics,
  createMusicScore,
  createNotesInfo,
  createNoteSymbol,
} from './dr-extensions/dr-edit/score-builder'
import {drLyrics, type LyricsMode} from './dr-extensions/dr-lyrics'

const mode = ref<LyricsMode>('edit')
const showRowIndex = ref(true)
const extensions = [drLyrics({mode, showRowIndex})]

const musicScoreData = reactive<MusicScore>(
  (() => {
    const score = createMusicScore({width: 900, height: 520, topSpaceHeight: 16})
    const grandStaff = createGrandStaff()
    score.grandStaffs.push(grandStaff)
    const measure = grandStaff.staves[0]!.measures[0]!
    const n1 = createNoteSymbol({region: 5, chronaxie: 64})
    n1.notesInfo = [createNotesInfo({region: 5, chronaxie: 64})]
    n1.lyrics = [createLyrics('你'), createLyrics('啊')]
    const n2 = createNoteSymbol({region: 7, chronaxie: 64})
    n2.notesInfo = [createNotesInfo({region: 7, chronaxie: 64})]
    n2.lyrics = [createLyrics('好')]
    const n3 = createNoteSymbol({region: 5, chronaxie: 128})
    n3.notesInfo = [createNotesInfo({region: 5, chronaxie: 128})]
    n3.lyrics = []
    measure.notes.push(n1, n2, n3)
    return score
  })(),
)

const lyricsPreview = computed(() =>
  musicScoreData.grandStaffs[0]?.staves[0]?.measures[0]?.notes.map((n) => ({
    id: n.id,
    lyrics: n.lyrics.map((l) => l.text),
  })),
)
</script>

<template>
  <div class="lyrics-test">
    <aside class="lyrics-test__panel">
      <h2 class="lyrics-test__heading">dr-lyrics 测试</h2>
      <div class="lyrics-test__mode">
        <button
          :class="['lyrics-test__mode-btn', {'lyrics-test__mode-btn--active': mode === 'edit'}]"
          type="button"
          @click="mode = 'edit'"
        >
          edit
        </button>
        <button
          :class="['lyrics-test__mode-btn', {'lyrics-test__mode-btn--active': mode === 'show'}]"
          type="button"
          @click="mode = 'show'"
        >
          show
        </button>
      </div>
      <p class="lyrics-test__hint">
        g-d 挂载；行数 = 首谱表 max(lyrics.length)。编辑第三行会把空槽补成
        ['','','啊']。每项带 Frame 偏移。
      </p>
      <pre class="lyrics-test__json">{{ JSON.stringify(lyricsPreview, null, 2) }}</pre>
    </aside>

    <div class="lyrics-test__score">
      <musicScoreVue
        :data="musicScoreData"
        :extensions="extensions"
        skin-name="default"
      />
    </div>
  </div>
</template>

<style scoped>
.lyrics-test {
  display: flex;
  gap: 16px;
  height: 100%;
  padding: 16px;
  box-sizing: border-box;
}

.lyrics-test__panel {
  flex: 0 0 280px;
}

.lyrics-test__heading {
  margin: 0 0 12px;
  font-size: 18px;
}

.lyrics-test__mode {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.lyrics-test__mode-btn {
  padding: 6px 14px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
}

.lyrics-test__mode-btn--active {
  border-color: #409eff;
  color: #409eff;
}

.lyrics-test__hint {
  margin: 0 0 12px;
  font-size: 12px;
  line-height: 1.5;
  color: #606266;
}

.lyrics-test__json {
  margin: 0;
  padding: 10px;
  border-radius: 6px;
  background: #f5f7fa;
  font-size: 12px;
  white-space: pre-wrap;
}

.lyrics-test__score {
  flex: 1;
  min-width: 0;
  overflow: auto;
}
</style>
