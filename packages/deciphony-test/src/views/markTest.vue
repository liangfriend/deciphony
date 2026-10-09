<script lang="ts" setup>
import musicScoreVue, {
  ClefTypeEnum,
  getMeasureNoteList,
  KeySignatureTypeEnum,
  MusicScoreTypeEnum,
  TimeSignatureTypeEnum,
} from '@deciphony/renderer'
import type {MusicScore, NoteSymbol, VDom} from '@deciphony/renderer'
import {
  drMark,
  FLUTE_TUBE_MIDI,
  OCARINA_TONIC_MIDI,
  XIAO_TUBE_MIDI,
  type FluteKey,
  type OcarinaKey,
  type OcarinaModel,
  type XiaoKey,
  type XiaoModel,
} from '@deciphony/extensions/dr-mark'
import {
  createClef,
  createGrandStaff,
  createKeySignature,
  createMeasure,
  createMusicScore,
  createNoteRest,
  createNoteSymbol,
  createSingleStaff,
  createSlur,
  createTimeSignature,
} from '@deciphony/extensions/dr-edit/score-builder'
import {spell, type SpellScope} from '@deciphony/extensions/dr-midi-transfer/midiToMusicScore'
import {standardStaffToNumberNotation} from '@deciphony/extensions/dr-numberNotation-transfer'
import {computed, ref, watch} from 'vue'

const FLUTE_KEYS: {key: FluteKey; label: string; keySignature: KeySignatureTypeEnum}[] = [
  {key: 'G', label: '大G', keySignature: KeySignatureTypeEnum.G},
  {key: 'A', label: 'A', keySignature: KeySignatureTypeEnum.A},
  {key: 'bB', label: 'bB', keySignature: KeySignatureTypeEnum.B_flat},
  {key: 'C', label: 'C', keySignature: KeySignatureTypeEnum.C},
  {key: 'D', label: 'D', keySignature: KeySignatureTypeEnum.D},
  {key: 'E', label: 'E', keySignature: KeySignatureTypeEnum.E},
  {key: 'F', label: 'F', keySignature: KeySignatureTypeEnum.F},
  {key: 'highG', label: '小G', keySignature: KeySignatureTypeEnum.G},
]
/** 筒音作 5 的唱名 → 相对筒音半音数 */
const DEGREE: Record<string, number> = {
  '5.': 0, '6.': 2, '7.': 4, '1': 5, '2': 7, '3': 9, '4': 10, '5': 12, '6': 14, '7': 16, '1\'': 17, '2\'': 19,
}
/** 茉莉花片段（简化为四分音符）；末尾 5 用延音线连到下一小节 */
const MELODY = ['3', '3', '5', '6', '1\'', '1\'', '6', '5', '5', '6', '5', '5', '3', '2', '1', '2', '3', '5', '6', '5', '5']
const MEASURES_PER_LINE = 4

const OCARINA_KEYS: {key: OcarinaKey; label: string; keySignature: KeySignatureTypeEnum}[] = [
  {key: 'AC', label: '中音 C', keySignature: KeySignatureTypeEnum.C},
  {key: 'AF', label: '中音 F', keySignature: KeySignatureTypeEnum.F},
  {key: 'AG', label: '中音 G', keySignature: KeySignatureTypeEnum.G},
  {key: 'SC', label: '高音 C', keySignature: KeySignatureTypeEnum.C},
  {key: 'SF', label: '高音 F', keySignature: KeySignatureTypeEnum.F},
  {key: 'SG', label: '高音 G', keySignature: KeySignatureTypeEnum.G},
  {key: 'BC', label: '低音 C', keySignature: KeySignatureTypeEnum.C},
]
const OCARINA_MODELS: {model: OcarinaModel; label: string; range: [number, number]}[] = [
  {model: 'transverse12', label: '12 孔（底部两侧拇指孔）', range: [-3, 17]},
  {model: 'pendant4', label: '4 孔吊坠（仅正面）', range: [0, 12]},
]

const XIAO_KEY_LIST: {key: XiaoKey; keySignature: KeySignatureTypeEnum}[] = [
  {key: 'C', keySignature: KeySignatureTypeEnum.C},
  {key: 'bD', keySignature: KeySignatureTypeEnum.D_flat},
  {key: 'D', keySignature: KeySignatureTypeEnum.D},
  {key: 'bE', keySignature: KeySignatureTypeEnum.E_flat},
  {key: 'E', keySignature: KeySignatureTypeEnum.E},
  {key: 'F', keySignature: KeySignatureTypeEnum.F},
  {key: 'bG', keySignature: KeySignatureTypeEnum.G_flat},
  {key: 'G', keySignature: KeySignatureTypeEnum.G},
  {key: 'bA', keySignature: KeySignatureTypeEnum.A_flat},
  {key: 'A', keySignature: KeySignatureTypeEnum.A},
  {key: 'bB', keySignature: KeySignatureTypeEnum.B_flat},
  {key: 'B', keySignature: KeySignatureTypeEnum.B},
]
const XIAO_MODELS: {model: XiaoModel; label: string; range: [number, number]}[] = [
  {model: 'hole8', label: '八孔箫', range: [0, 34]},
  {model: 'hole6', label: '六孔箫', range: [0, 31]},
]

const instrument = ref<'flute' | 'ocarina' | 'xiao'>('flute')
const xiaoModel = ref<XiaoModel>('hole8')
const xiaoKey = ref<XiaoKey>('G')
const ocarinaModel = ref<OcarinaModel>('transverse12')
const ocarinaKey = ref<OcarinaKey>('AC')
const fluteKey = ref<FluteKey>('D')
const content = ref<'chromatic' | 'melody'>('chromatic')
const notation = ref<'standard' | 'number'>('standard')
const scale = ref(1)
const showOutOfRange = ref(true)
const height = ref(600)
const error = ref('')

function buildScore(midis: number[], keySignature: KeySignatureTypeEnum, tieLast: boolean): MusicScore {
  const score = createMusicScore({
    type: MusicScoreTypeEnum.StandardStaff,
    title: '笛子指法',
    keySignature,
    timeSignature: TimeSignatureTypeEnum['4_4'],
    width: 1000,
    height: 600,
    topSpaceHeight: 16,
  })
  const measureCount = Math.ceil(midis.length / 4)
  const noteIds: string[] = []
  for (let line = 0; line * MEASURES_PER_LINE < measureCount; line++) {
    const grandStaff = createGrandStaff({withDefaultStaff: false})
    const staff = createSingleStaff({withDefaultMeasure: false, data: {}})
    for (let m = line * MEASURES_PER_LINE; m < Math.min(measureCount, (line + 1) * MEASURES_PER_LINE); m++) {
      const measure = createMeasure()
      if (m % MEASURES_PER_LINE === 0) {
        measure.clef_f = createClef(ClefTypeEnum.Treble)
        measure.keySignature_f = createKeySignature(keySignature)
        if (m === 0) measure.timeSignature_f = createTimeSignature(TimeSignatureTypeEnum['4_4'])
      }
      const scope: SpellScope = new Map()
      for (let i = m * 4; i < m * 4 + 4; i++) {
        const midi = midis[i]
        if (midi == null) {
          getMeasureNoteList(measure).push(createNoteRest({chronaxie: 64}))
          continue
        }
        const {region, accidental} = spell(midi, ClefTypeEnum.Treble, keySignature, scope)
        const slot = createNoteSymbol({
          notesInfo: [{region, chronaxie: 64, direction: region > 4 ? 'down' : 'up', ...(accidental != null ? {accidental} : {})}],
        })
        noteIds.push((slot.symbol as NoteSymbol).notesInfo[0]!.id)
        getMeasureNoteList(measure).push(slot)
      }
      staff.measures.push(measure)
    }
    grandStaff.staves.push(staff)
    score.grandStaffs.push(grandStaff)
  }
  if (tieLast && noteIds.length >= 2) {
    score.affiliatedSymbols.push(createSlur({startId: noteIds[noteIds.length - 2]!, endId: noteIds[noteIds.length - 1]!}))
  }
  return score
}

const score = computed((): MusicScore | null => {
  error.value = ''
  let keySignature: KeySignatureTypeEnum
  let midis: number[]
  if (instrument.value === 'flute') {
    keySignature = FLUTE_KEYS.find((k) => k.key === fluteKey.value)!.keySignature
    const tube = FLUTE_TUBE_MIDI[fluteKey.value]
    midis = content.value === 'chromatic'
      ? Array.from({length: 32}, (_, i) => tube + i)
      : MELODY.map((d) => tube + DEGREE[d]!)
  } else if (instrument.value === 'xiao') {
    keySignature = XIAO_KEY_LIST.find((k) => k.key === xiaoKey.value)!.keySignature
    const tube = XIAO_TUBE_MIDI[xiaoKey.value]
    const [lo, hi] = XIAO_MODELS.find((m) => m.model === xiaoModel.value)!.range
    midis = content.value === 'chromatic'
      ? Array.from({length: hi - lo + 1}, (_, i) => tube + lo + i)
      : MELODY.map((d) => tube + DEGREE[d]!)
  } else {
    keySignature = OCARINA_KEYS.find((k) => k.key === ocarinaKey.value)!.keySignature
    const tonic = OCARINA_TONIC_MIDI[ocarinaKey.value]
    const [lo, hi] = OCARINA_MODELS.find((m) => m.model === ocarinaModel.value)!.range
    midis = content.value === 'chromatic'
      ? Array.from({length: hi - lo + 1}, (_, i) => tonic + lo + i)
      : MELODY.map((d) => tonic + DEGREE[d]! - DEGREE['1']!)
  }
  const base = buildScore(midis, keySignature, content.value === 'melody')
  if (notation.value === 'standard') return base
  try {
    return standardStaffToNumberNotation(base, {keySignature})
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : String(reason)
    return null
  }
})

const view = computed(() => score.value ? {...score.value, height: height.value} : null)

const extensions = computed(() => {
  const common = {scale: scale.value}
  const showOut = showOutOfRange.value
  switch (instrument.value) {
    case 'flute':
      return [drMark({...common, type: 'flute', flute: {key: fluteKey.value, showOutOfRange: showOut}})]
    case 'ocarina':
      return [drMark({...common, type: 'ocarina', ocarina: {model: ocarinaModel.value, key: ocarinaKey.value, showOutOfRange: showOut}})]
    case 'xiao':
      return [drMark({...common, type: 'xiao', xiao: {model: xiaoModel.value, key: xiaoKey.value, showOutOfRange: showOut}})]
  }
})

/** 曲谱 height 是固定值，按实际 vDom 底边撑开，避免 m-d 被裁 */
function onRender(list: VDom[]) {
  const bottom = Math.ceil(Math.max(0, ...list.map((n) => n.y + n.h))) + 20
  if (Math.abs(bottom - height.value) > 1) height.value = bottom
}

watch([instrument, ocarinaModel, ocarinaKey, xiaoModel, xiaoKey, fluteKey, content, notation, scale], () => (height.value = 600))
</script>

<template>
  <main class="mark-test">
    <section class="toolbar">
      <label>type
        <select v-model="instrument">
          <option value="flute">flute 笛子</option>
          <option value="ocarina">ocarina 陶笛</option>
          <option value="xiao">xiao 箫</option>
        </select>
      </label>
      <template v-if="instrument === 'xiao'">
        <label>xiao.model
          <select v-model="xiaoModel">
            <option v-for="m in XIAO_MODELS" :key="m.model" :value="m.model">{{ m.model }}（{{ m.label }}）</option>
          </select>
        </label>
        <label>xiao.key
          <select v-model="xiaoKey">
            <option v-for="k in XIAO_KEY_LIST" :key="k.key" :value="k.key">{{ k.key }} 调箫（筒音 {{ XIAO_TUBE_MIDI[k.key] }}）</option>
          </select>
        </label>
      </template>
      <template v-else-if="instrument === 'ocarina'">
        <label>ocarina.model
          <select v-model="ocarinaModel">
            <option v-for="m in OCARINA_MODELS" :key="m.model" :value="m.model">{{ m.model }}（{{ m.label }}）</option>
          </select>
        </label>
        <label>ocarina.key
          <select v-model="ocarinaKey">
            <option v-for="k in OCARINA_KEYS" :key="k.key" :value="k.key">{{ k.key }}（{{ k.label }}，do = {{ OCARINA_TONIC_MIDI[k.key] }}）</option>
          </select>
        </label>
      </template>
      <label v-else>flute.key
        <select v-model="fluteKey">
          <option v-for="k in FLUTE_KEYS" :key="k.key" :value="k.key">{{ k.key }}（{{ k.label }} 调笛，筒音 {{ FLUTE_TUBE_MIDI[k.key] }}）</option>
        </select>
      </label>
      <label>内容
        <select v-model="content">
          <option value="chromatic">全音域半音阶</option>
          <option value="melody">茉莉花片段（含延音线）</option>
        </select>
      </label>
      <label>记谱
        <select v-model="notation">
          <option value="standard">五线谱</option>
          <option value="number">简谱</option>
        </select>
      </label>
      <label>缩放 <input v-model.number="scale" max="2" min="0.5" step="0.1" type="number"/></label>
      <label><input v-model="showOutOfRange" type="checkbox"/> 超出音域显示 ?</label>
      <span class="hint">实心 = 按孔，空心 = 开孔，半实心 = 半孔；笛子 / 箫上方圆点 = 超吹层级；陶笛吹口朝下，12 孔吹口两侧圆 = 背面拇指孔；箫最上方左偏孔 = 背孔</span>
    </section>
    <p v-if="error" class="error">{{ error }}</p>
    <div class="score">
      <musicScoreVue v-if="view" :data="view" :extensions="extensions" skin-name="default" @renderMusicScore="onRender"/>
    </div>
  </main>
</template>

<style scoped>
.mark-test {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  padding: 12px;
  box-sizing: border-box;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.toolbar input[type='number'] {
  width: 56px;
}

.hint {
  color: #666;
  font-size: 12px;
}

.error {
  color: #f56c6c;
}

.score {
  flex: 1;
  overflow: auto;
  border: 1px solid #ddd;
}
</style>
