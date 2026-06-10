<script lang="ts" setup>
import musicScoreVue from 'deciphony-renderer'
import {MusicScoreTypeEnum} from 'deciphony-renderer'
import type {MusicScore} from 'deciphony-renderer'
import {computed, reactive, ref} from 'vue'
import staffSample from './data/其多列'
import numberSample from './data/其多列简谱'
import {
  numberNotationToStandardStaff,
  standardStaffToNumberNotation,
} from './dr-extensions/dr-numberNotation-transfer'

const musicScoreData = reactive(JSON.parse(JSON.stringify(staffSample)) as MusicScore)
const scoreRenderKey = ref(0)
const statusMessage = ref('')
const statusType = ref<'info' | 'success' | 'error'>('info')
const isBusy = ref(false)

const scoreTypeLabel = computed(() =>
  musicScoreData.type === MusicScoreTypeEnum.NumberNotation ? '简谱' : '五线谱',
)

const canToNumber = computed(() => musicScoreData.type === MusicScoreTypeEnum.StandardStaff)
const canToStaff = computed(() => musicScoreData.type === MusicScoreTypeEnum.NumberNotation)

function setStatus(message: string, type: 'info' | 'success' | 'error' = 'info') {
  statusMessage.value = message
  statusType.value = type
}

function applyScore(next: MusicScore) {
  musicScoreData.type = next.type
  musicScoreData.grandStaffs = next.grandStaffs
  musicScoreData.affiliatedSymbols = next.affiliatedSymbols
  musicScoreData.width = next.width
  musicScoreData.height = next.height
  musicScoreData.topSpaceHeight = next.topSpaceHeight
  musicScoreData.title = next.title
  musicScoreData.subTitle = next.subTitle
  musicScoreData.author = next.author
  musicScoreData.description = next.description
  if (next.bpm != null) musicScoreData.bpm = next.bpm
  scoreRenderKey.value += 1
}

function loadStaffSample() {
  applyScore(JSON.parse(JSON.stringify(staffSample)) as MusicScore)
  setStatus('已加载五线谱样本「其多列」', 'success')
}

function loadNumberSample() {
  applyScore(JSON.parse(JSON.stringify(numberSample)) as MusicScore)
  setStatus('已加载简谱样本「其多列简谱」', 'success')
}

function summarizeScore(score: MusicScore): string {
  const gs = score.grandStaffs.length
  const staves = score.grandStaffs[0]?.staves.length ?? 0
  const measures = score.grandStaffs[0]?.staves[0]?.measures.length ?? 0
  return `${gs} 复谱表，${staves} 单谱表，${measures} 小节`
}

function convertToNumberNotation() {
  if (!canToNumber.value) {
    setStatus('当前曲谱不是五线谱，无法转为简谱', 'error')
    return
  }
  isBusy.value = true
  setStatus('正在转换为简谱…')
  try {
    const next = standardStaffToNumberNotation(musicScoreData)
    applyScore(next)
    setStatus(`已转为简谱（${summarizeScore(next)}）`, 'success')
  } catch (error) {
    const message = error instanceof Error ? error.message : '转换失败'
    setStatus(message, 'error')
  } finally {
    isBusy.value = false
  }
}

function convertToStandardStaff() {
  if (!canToStaff.value) {
    setStatus('当前曲谱不是简谱，无法转为五线谱', 'error')
    return
  }
  isBusy.value = true
  setStatus('正在转换为五线谱…')
  try {
    const next = numberNotationToStandardStaff(musicScoreData)
    applyScore(next)
    setStatus(`已转为五线谱（C 调高音谱号，${summarizeScore(next)}）`, 'success')
  } catch (error) {
    const message = error instanceof Error ? error.message : '转换失败'
    setStatus(message, 'error')
  } finally {
    isBusy.value = false
  }
}
</script>

<template>
  <div class="transfer-test">
    <div class="transfer-test__score">
      <musicScoreVue
        :key="scoreRenderKey"
        :data="musicScoreData"
        :slot-config="{'g-r':{w:50},'g-l':{w:50}}"
        skin-name="default"
      />
    </div>

    <aside class="transfer-test__panel">
      <h3 class="transfer-test__title">线谱 / 简谱转换</h3>
      <p class="transfer-test__desc">
        左侧为当前曲谱预览；右侧可加载样本或执行双向转换。
      </p>
      <p class="transfer-test__type">
        当前类型：<strong>{{ scoreTypeLabel }}</strong>
      </p>

      <section class="transfer-test__section">
        <h4 class="transfer-test__section-title">加载样本</h4>
        <button
          class="transfer-test__btn"
          :disabled="isBusy"
          type="button"
          @click="loadStaffSample"
        >
          五线谱样本（其多列）
        </button>
        <button
          class="transfer-test__btn"
          :disabled="isBusy"
          type="button"
          @click="loadNumberSample"
        >
          简谱样本（其多列简谱）
        </button>
      </section>

      <section class="transfer-test__section">
        <h4 class="transfer-test__section-title">转换</h4>
        <button
          class="transfer-test__btn transfer-test__btn--primary"
          :disabled="isBusy || !canToNumber"
          type="button"
          @click="convertToNumberNotation"
        >
          五线谱 → 简谱
        </button>
        <button
          class="transfer-test__btn transfer-test__btn--primary"
          :disabled="isBusy || !canToStaff"
          type="button"
          @click="convertToStandardStaff"
        >
          简谱 → 五线谱
        </button>
      </section>

      <p
        v-if="statusMessage"
        class="transfer-test__status"
        :class="`transfer-test__status--${statusType}`"
      >
        {{ statusMessage }}
      </p>
    </aside>
  </div>
</template>

<style scoped>
.transfer-test {
  display: flex;
  align-items: flex-start;
  height: 100%;
  gap: 16px;
}

.transfer-test__score {
  flex: 1;
  min-width: 0;
  overflow: auto;
}

.transfer-test__panel {
  width: 280px;
  flex-shrink: 0;
  padding: 16px;
  border-left: 1px solid #e5e5e5;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.transfer-test__title {
  margin: 0;
  font-size: 16px;
}

.transfer-test__desc {
  margin: 0;
  font-size: 13px;
  color: #666;
  line-height: 1.5;
}

.transfer-test__type {
  margin: 0;
  font-size: 13px;
  color: #303133;
}

.transfer-test__section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.transfer-test__section-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.transfer-test__btn {
  padding: 8px 12px;
  font-size: 14px;
  border: 1px solid #d0d0d0;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  transition: background-color 0.15s;
  text-align: left;
}

.transfer-test__btn:hover:not(:disabled) {
  background: #f2f2f2;
}

.transfer-test__btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.transfer-test__btn--primary {
  border-color: #409eff;
  color: #409eff;
}

.transfer-test__btn--primary:hover:not(:disabled) {
  background: #ecf5ff;
}

.transfer-test__status {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  padding: 8px 10px;
  border-radius: 6px;
}

.transfer-test__status--info {
  background: #f4f4f5;
  color: #606266;
}

.transfer-test__status--success {
  background: #f0f9eb;
  color: #67c23a;
}

.transfer-test__status--error {
  background: #fef0f0;
  color: #f56c6c;
}
</style>
