<script lang="ts" setup>
import {computed, reactive, ref} from 'vue'
import type {MusicScore} from '@deciphony/renderer'
import musicScoreVue, {
  BRAVURA_SKIN_ATTRIBUTION,
  MusicScoreTypeEnum,
  defaultSkin,
} from '@deciphony/renderer'
import exhibitStaff from './data/skinExhibitStandardStaff'
import exhibitNumber from './data/skinExhibitNumberNotation'
import {skinExhibitTab6} from './data/skinExhibitTab'

type Mode = 'standardStaff' | 'numberNotation' | 'tab6' | 'drumNotation'

const MODES: Mode[] = ['standardStaff', 'numberNotation', 'tab6', 'drumNotation']
const queryMode = new URLSearchParams(location.search).get('mode') as Mode | null
const mode = ref<Mode>(queryMode && MODES.includes(queryMode) ? queryMode : 'standardStaff')

const scores: Record<Mode, MusicScore> = {
  standardStaff: reactive(JSON.parse(JSON.stringify(exhibitStaff)) as MusicScore),
  numberNotation: reactive(JSON.parse(JSON.stringify(exhibitNumber)) as MusicScore),
  tab6: reactive(JSON.parse(JSON.stringify(skinExhibitTab6)) as MusicScore),
  // 鼓谱暂用五线展示结构；defaultSkin.drumNotation 已含 Bravura 符尾/音符头
  drumNotation: reactive(
    Object.assign(JSON.parse(JSON.stringify(exhibitStaff)) as MusicScore, {
      type: MusicScoreTypeEnum.DrumNotation,
    }),
  ),
}

const musicScoreData = computed(() => scores[mode.value])

const packPreview = computed(() => {
  switch (mode.value) {
    case 'numberNotation':
      return defaultSkin.numberNotation
    case 'tab6':
      return defaultSkin.tab6
    case 'drumNotation':
      return defaultSkin.drumNotation
    default:
      return defaultSkin.standardStaff
  }
})

const sampleKeys = computed(() => {
  const pack = packPreview.value
  if (!pack) return [] as string[]
  const prefer = [
    'treble',
    'bass',
    'percussion',
    'sharp',
    'flat',
    'noteHead_3',
    'drumHead_cross',
    'drumHead_normal',
    'noteTail_1',
    'noteTail_3',
    'rest_3',
    'number_1',
    'tab_note_5',
    'dyn_p',
    'dyn_f',
    'repeat_segno',
  ]
  return prefer.filter((k) => (pack as Record<string, unknown>)[k])
})

function item(key: string) {
  return (packPreview.value as Record<string, {content: string; w: number; h: number} | undefined>)?.[key]
}
</script>

<template>
  <div class="bravura-test">
    <header class="bravura-test__head">
      <h1>默认皮肤 · Bravura / SMuFL</h1>
      <p class="bravura-test__attr">{{ BRAVURA_SKIN_ATTRIBUTION }}</p>
      <div class="bravura-test__modes">
        <button
          v-for="m in (['standardStaff', 'numberNotation', 'tab6', 'drumNotation'] as const)"
          :key="m"
          type="button"
          :class="{active: mode === m}"
          @click="mode = m"
        >
          {{
            {
              standardStaff: '五线谱',
              numberNotation: '简谱',
              tab6: '吉他谱',
              drumNotation: '鼓谱',
            }[m]
          }}
        </button>
      </div>
    </header>

    <section class="bravura-test__glyphs">
      <h2>当前谱种字形抽检</h2>
      <div class="glyph-grid">
        <div v-for="key in sampleKeys" :key="key" class="glyph-card">
          <svg
            v-if="item(key)"
            class="glyph-card__svg"
            :viewBox="`0 0 ${item(key)!.w} ${item(key)!.h}`"
            :width="Math.min(72, item(key)!.w * 1.4)"
            :height="Math.min(72, item(key)!.h * 1.4)"
            xmlns="http://www.w3.org/2000/svg"
            v-html="item(key)!.content"
          />
          <code>{{ key }}</code>
          <span v-if="item(key)">{{ item(key)!.w }}×{{ item(key)!.h }}</span>
        </div>
      </div>
    </section>

    <section class="bravura-test__score">
      <h2>展示曲谱（defaultSkin · {{ mode }}）</h2>
      <div class="bravura-test__stage">
        <music-score-vue :data="musicScoreData" skin-name="default" />
      </div>
    </section>
  </div>
</template>

<style scoped>
.bravura-test {
  min-height: 100vh;
  padding: 24px 28px 48px;
  background: linear-gradient(165deg, #f7f4ee 0%, #ebe6dc 45%, #e2ddd3 100%);
  color: #1c1915;
  font-family: Georgia, 'Times New Roman', serif;
}
.bravura-test__head h1 {
  margin: 0 0 6px;
  font-size: 22px;
  font-weight: 650;
}
.bravura-test__attr {
  margin: 0 0 16px;
  font-size: 12px;
  color: #6b645a;
  font-family: 'Segoe UI', system-ui, sans-serif;
}
.bravura-test__modes {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 28px;
  font-family: 'Segoe UI', system-ui, sans-serif;
}
.bravura-test__modes button {
  padding: 6px 14px;
  border: 1px solid #c9c0b0;
  background: #fffdf8;
  color: #3d3830;
  cursor: pointer;
  font-size: 13px;
}
.bravura-test__modes button.active {
  background: #2c2822;
  color: #f7f4ee;
  border-color: #2c2822;
}
.bravura-test__glyphs h2,
.bravura-test__score h2 {
  margin: 0 0 12px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: #5a5348;
  font-family: 'Segoe UI', system-ui, sans-serif;
}
.glyph-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 10px;
  margin-bottom: 32px;
}
.glyph-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 8px;
  background: #fffdf8;
  border: 1px solid #d9d2c5;
  font-family: 'Segoe UI', system-ui, sans-serif;
}
.glyph-card code {
  font-size: 11px;
}
.glyph-card span {
  font-size: 10px;
  color: #8a8276;
}
.bravura-test__stage {
  padding: 16px;
  background: #fffdf8;
  border: 1px solid #d9d2c5;
  overflow: auto;
}
</style>
