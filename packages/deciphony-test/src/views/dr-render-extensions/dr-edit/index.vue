<template>
  <div class="container">
    <div class="left">{{ highlightTargetId }}
      <music-score-vue
        ref="msRef"
        :data="musicScoreData"
        :slot-config="{'g-r':{w:50},'e':{h:60},}"
        skin-name="default"
        @pointerdown="handlePointerDown"
        @pointermove="handlePointerMove"
        @pointerup="handlePointerUp"
        @renderMusicScore="renderMusicScore"
      >
        <template #g="{ node }">
          <rect
            :data-slot-name="node.slotName??''"
            :data-tag="node.tag"
            :data-target-id="node.targetId"
            :height="node.h"
            :width="node.w"
            data-comment="插槽"
            fill="transparent"
            x="0"
            y="0"
          />
          <rect
            v-show="node.targetId === highlightTargetId"
            :data-tag="node.tag"
            :data-target-id="node.targetId"
            :height="node.h"
            :width="node.w"
            fill="transparent"
            stroke="red"
            stroke-dasharray="4 2"
            stroke-width="1"
            x="0"
            y="0"
          />
        </template>
        <template #s="{ node }">
          <rect
            :data-slot-name="node.slotName??''"
            :data-tag="node.tag"
            :data-target-id="node.targetId"
            :height="node.h"
            :width="node.w"
            data-comment="插槽"
            fill="transparent"
            x="0"
            y="0"
          />
          <rect
            v-show="node.targetId === highlightTargetId"
            :data-tag="node.tag"
            :data-target-id="node.targetId"
            :height="node.h"
            :width="node.w"
            fill="transparent"
            stroke="red"
            stroke-dasharray="4 2"
            stroke-width="1"
            x="0"
            y="0"
          />
        </template>

        <template #s-d="{ node }">
          <g
            transform="translate(0, 0)"
            @pointerdown.stop
            @click.stop="node.slotData && drEdit.addSingleStaff(node.slotData.id)"
          >
            <rect
              :x="(node.w - 40) / 2"
              cursor="pointer"
              fill="transparent"
              height="40"
              rx="6"
              ry="6"
              stroke="currentColor"
              stroke-dasharray="4 2"
              stroke-width="1.5"
              width="40"
              y="0"
            />
            <line
              :x1="node.w / 2 - 10"
              :x2="node.w / 2 + 10"
              pointer-events="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-width="1.5"
              y1="20"
              y2="20"
            />
            <line
              :x1="node.w / 2"
              :x2="node.w / 2"
              pointer-events="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-width="1.5"
              y1="10"
              y2="30"
            />
          </g>
        </template>
        <template #e="{ node }">
          <g
            transform="translate(0,0)"
            @pointerdown.stop
            @click.stop="drEdit.addGrandStaff"
          >
            <rect
              :x="(node.w - 40) / 2"
              :y="(node.h - 40) / 2"
              cursor="pointer"
              fill="transparent"
              height="40"
              rx="6"
              ry="6"
              stroke="currentColor"
              stroke-dasharray="4 2"
              stroke-width="1.5"
              width="40"
            />
            <line
              :x1="node.w / 2 - 10"
              :x2="node.w / 2 + 10"
              :y1="node.h / 2"
              :y2="node.h / 2"
              pointer-events="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-width="1.5"
            />
            <line
              :x1="node.w / 2"
              :x2="node.w / 2"
              :y1="node.h / 2 - 10"
              :y2="node.h / 2 + 10"
              pointer-events="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-width="1.5"
            />
          </g>
        </template>
      </music-score-vue>
    </div>
    <div class="right">
      <div v-if="selectedNoteOrRest" class="symbol-panel">
        <h4>{{ selectedNoteOrRest.type === 'note' ? '音符' : '休止符' }}</h4>
        <div class="field">
          <label>时值</label>
          <div class="chronaxie-btns">
            <button
              v-for="c in CHRONAXIES"
              :key="c"
              :class="{ active: selectedNoteOrRest.chronaxie === c }"
              @click="drEdit.updateSymbolChronaxie(highlightTargetId, highlightTag, c)"
            >{{ CHRONAXIE_LABELS[c] }}
            </button>
          </div>
        </div>
        <button v-if="selectedDeletableSymbol" class="btn-delete"
                @click="drEdit.deleteSymbol(highlightTargetId, highlightTag)">
          删除
        </button>
      </div>
      <div v-else-if="selectedDeletableSymbol && !selectedMeasure" class="symbol-panel">
        <h4>符号</h4>
        <button class="btn-delete" @click="drEdit.deleteSymbol(highlightTargetId, highlightTag)">
          删除
        </button>
      </div>
      <div v-else-if="selectedMeasure" class="measure-panel">
        <h4>小节</h4>
        <div class="field">
          <label>前置谱号</label>
          <select :value="selectedMeasure.clef_f?.clefType"
                  @change="(e: Event) => drEdit.updateMeasureClef(selectedMeasure!.id, (e.target as HTMLSelectElement).value as any)">
            <option value="treble">高音</option>
            <option value="bass">低音</option>
            <option value="alto">中音</option>
            <option value="tenor">次中音</option>
          </select>
        </div>
        <div class="field">
          <label>前置调号</label>
          <select :value="selectedMeasure.keySignature_f?.type"
                  @change="(e: Event) => drEdit.updateMeasureKeySignature(selectedMeasure!.id, (e.target as HTMLSelectElement).value as any)">
            <option value="C">C</option>
            <option value="G">G</option>
            <option value="D">D</option>
            <option value="A">A</option>
            <option value="E">E</option>
            <option value="B">B</option>
            <option value="F">F</option>
          </select>
        </div>
        <div class="field">
          <label>前置拍号</label>
          <select :value="selectedMeasure.timeSignature_f?.type"
                  @change="(e: Event) => drEdit.updateMeasureTimeSignature(selectedMeasure!.id, (e.target as HTMLSelectElement).value as any)">
            <option value="4_4">4/4</option>
            <option value="3_4">3/4</option>
            <option value="2_4">2/4</option>
            <option value="6_8">6/8</option>
            <option value="3_8">3/8</option>
          </select>
        </div>
        <div class="field">
          <label>小节线</label>
          <select :value="selectedMeasure.barline?.barlineType"
                  @change="(e: Event) => drEdit.updateMeasureBarline(selectedMeasure!.id, (e.target as HTMLSelectElement).value as any)">
            <option value="single_barline">单线</option>
            <option value="double_barline">双线</option>
            <option value="final_barline">终止线</option>
            <option value="startRepeat_barline">反复开始</option>
            <option value="endRepeat_barline">反复结束</option>
          </select>
        </div>
        <div class="field">
          <label>添加休止符</label>
          <div class="chronaxie-btns">
            <button
              v-for="c in CHRONAXIES"
              :key="c"
              @click="drEdit.addRestToMeasure(selectedMeasure!.id, c)"
            >{{ CHRONAXIE_LABELS[c] }}
            </button>
          </div>
        </div>
        <div class="field">
          <label>添加音符</label>
          <div class="chronaxie-btns">
            <button
              v-for="c in CHRONAXIES"
              :key="c"
              @click="drEdit.addNoteToMeasure(selectedMeasure!.id, c)"
            >{{ CHRONAXIE_LABELS[c] }}
            </button>
          </div>
        </div>
      </div>
      <button v-else @click="drEdit.test">测试</button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {computed} from 'vue'
import MusicScoreVue from 'deciphony-renderer'
import data from '../mock/empty'
import {useDrRenderCore} from '../useDrRenderCore'
import {useDrEdit} from './useDrEdit'
import {CHRONAXIES, CHRONAXIE_LABELS} from './grandStaffTemplate'

const core = useDrRenderCore({initialData: data})
const drEdit = useDrEdit(core)

const {
  msRef,
  musicScoreData,
  highlightTargetId,
  highlightTag,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
  renderMusicScore,
} = core

const selectedMeasure = computed(() => {
  const tid = highlightTargetId.value
  const tag = highlightTag.value
  // 符号层级高于 m 插槽，pointer 常点到符号；只要选中目标属于某小节（m-xxx 或小节内任意符号）即视为选中该小节
  return drEdit.findMeasureBySelection(tid ?? '', tag ?? '')
})

const selectedNoteOrRest = computed(() => {
  const tid = highlightTargetId.value
  const tag = highlightTag.value
  if (!tid || (tag !== 'noteHead' && tag !== 'rest')) return null
  return drEdit.findSelectedNoteOrRest(tid, tag)
})

const selectedDeletableSymbol = computed(() => {
  const tid = highlightTargetId.value
  const tag = highlightTag.value
  if (!tid || !drEdit.isDeletableSymbol(tid, tag)) return null
  return {targetId: tid, tag}
})
</script>

<style scoped>
.container {
  display: flex;
  justify-content: space-between;
}

.left {
  width: 100%;
}

.right {
  width: 320px;
  padding: 8px;
  border-left: 1px solid #eee;
}

.measure-panel h4 {
  margin: 0 0 12px;
}

.measure-panel .field {
  margin-bottom: 12px;
}

.measure-panel .field label {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  color: #666;
}

.measure-panel select {
  width: 100%;
  padding: 4px 8px;
}

.chronaxie-btns {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.chronaxie-btns button {
  padding: 2px 6px;
  font-size: 11px;
}

.chronaxie-btns button.active {
  background: #e0e0e0;
  font-weight: 600;
}

.symbol-panel h4 {
  margin: 0 0 12px;
}

.symbol-panel .field {
  margin-bottom: 12px;
}

.symbol-panel .field label {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  color: #666;
}

.btn-delete {
  margin-top: 12px;
  padding: 6px 12px;
  color: #c00;
  border: 1px solid #c00;
  background: #fff;
  cursor: pointer;
  border-radius: 4px;
}

.btn-delete:hover {
  background: #ffebee;
}
</style>
