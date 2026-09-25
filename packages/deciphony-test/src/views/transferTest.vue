<script lang="ts" setup>
import musicScoreVue from '@deciphony/renderer'
import {KeySignatureTypeEnum, MusicScoreTypeEnum} from '@deciphony/renderer'
import type {MusicScore} from '@deciphony/renderer'
import {computed, reactive, ref} from 'vue'
import staffSample from './data/其多列'
import numberSample from './data/其多列简谱'
import {
  numberNotationToStandardStaff,
  resolveScoreKeySignature,
  shiftMusicScoreBySemitones,
  standardStaffToNumberNotation,
  transposeMusicScore,
} from '@deciphony/extensions/dr-numberNotation-transfer'

const KEY_OPTIONS = Object.values(KeySignatureTypeEnum)

const musicScoreData = reactive(JSON.parse(JSON.stringify(staffSample)) as MusicScore)
const scoreRenderKey = ref(0)
const statusMessage = ref('')
const statusType = ref<'info' | 'success' | 'error'>('info')
const isBusy = ref(false)
const fromKey = ref(resolveScoreKeySignature(musicScoreData))
const targetKey = ref(KeySignatureTypeEnum.C)
const semitoneSteps = ref(1)

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
  const copy = JSON.parse(JSON.stringify(next)) as MusicScore
  for (const key of Object.keys(musicScoreData)) {
    delete (musicScoreData as Record<string, unknown>)[key]
  }
  Object.assign(musicScoreData, copy)
  fromKey.value = resolveScoreKeySignature(musicScoreData)
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
  const key = score.keySignature ?? score.grandStaffs[0]?.staves[0]?.measures[0]?.keySignature_f?.type ?? '无'
  return `${gs} 复谱表，${staves} 单谱表，${measures} 小节，调=${key}`
}

function convertToNumberNotation() {
  if (!canToNumber.value) {
    setStatus('当前曲谱不是五线谱，无法转为简谱', 'error')
    return
  }
  isBusy.value = true
  setStatus('正在转换为简谱…')
  try {
    const next = standardStaffToNumberNotation(musicScoreData, {keySignature: targetKey.value})
    applyScore(next)
    setStatus(`已转为简谱（目标调 ${targetKey.value}，${summarizeScore(next)}）`, 'success')
  } catch (error) {
    const message = error instanceof Error ? error.message : '转换失败'
    setStatus(message, 'error')
  } finally {
    isBusy.value = false
  }
}

function transposeInPlace() {
  isBusy.value = true
  setStatus('正在转调…')
  const srcKey = fromKey.value
  try {
    const next = transposeMusicScore(musicScoreData, {
      fromKey: srcKey,
      toKey: targetKey.value,
    })
    applyScore(next)
    setStatus(`已转调 ${srcKey} → ${targetKey.value}（${summarizeScore(next)}）`, 'success')
  } catch (error) {
    const message = error instanceof Error ? error.message : '转调失败'
    setStatus(message, 'error')
  } finally {
    isBusy.value = false
  }
}

function shiftBySemitones(delta?: number) {
  const steps = delta ?? Math.trunc(Number(semitoneSteps.value) || 0)
  if (steps === 0) {
    setStatus('半音步进为 0，曲谱不变', 'info')
    return
  }
  isBusy.value = true
  setStatus(steps > 0 ? `正在升高 ${steps} 个半音…` : `正在降低 ${Math.abs(steps)} 个半音…`)
  try {
    const next = shiftMusicScoreBySemitones(musicScoreData, steps)
    applyScore(next)
    const dir = steps > 0 ? `升 ${steps}` : `降 ${Math.abs(steps)}`
    setStatus(`已${dir} 半音（调号不变，${summarizeScore(next)}）`, 'success')
  } catch (error) {
    const message = error instanceof Error ? error.message : '升降调失败'
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
    const next = numberNotationToStandardStaff(musicScoreData, {keySignature: targetKey.value})
    applyScore(next)
    setStatus(`已转为五线谱（目标调 ${targetKey.value}，${summarizeScore(next)}）`, 'success')
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
        左侧为当前曲谱预览。谱种转换与同谱种转调都使用下方目标调；当前调加载样本时从曲谱读取（简谱顶层 / 线谱第一小节），也可手动改。
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
        <h4 class="transfer-test__section-title">转调（同谱种）</h4>
        <label class="transfer-test__label">当前调</label>
        <select v-model="fromKey" class="transfer-test__select" :disabled="isBusy">
          <option v-for="key in KEY_OPTIONS" :key="`from-${key}`" :value="key">{{ key }}</option>
        </select>
        <label class="transfer-test__label">目标调</label>
        <select v-model="targetKey" class="transfer-test__select" :disabled="isBusy">
          <option v-for="key in KEY_OPTIONS" :key="`to-${key}`" :value="key">{{ key }}</option>
        </select>
        <button
          class="transfer-test__btn transfer-test__btn--primary"
          :disabled="isBusy"
          type="button"
          @click="transposeInPlace"
        >
          转调
        </button>
      </section>

      <section class="transfer-test__section">
        <h4 class="transfer-test__section-title">升降调（半音）</h4>
        <p class="transfer-test__hint">
          调号不变，全体音符按半音平移。0 不变，正数升高，负数降低。
        </p>
        <label class="transfer-test__label">半音步进</label>
        <input
          v-model.number="semitoneSteps"
          class="transfer-test__select"
          type="number"
          step="1"
          :disabled="isBusy"
        />
        <div class="transfer-test__row">
          <button
            class="transfer-test__btn"
            :disabled="isBusy"
            type="button"
            @click="shiftBySemitones(-1)"
          >
            降半音
          </button>
          <button
            class="transfer-test__btn"
            :disabled="isBusy"
            type="button"
            @click="shiftBySemitones(1)"
          >
            升半音
          </button>
        </div>
        <button
          class="transfer-test__btn transfer-test__btn--primary"
          :disabled="isBusy"
          type="button"
          @click="shiftBySemitones()"
        >
          按步进升降调
        </button>
      </section>

      <section class="transfer-test__section">
        <h4 class="transfer-test__section-title">谱种转换</h4>
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

.transfer-test__label {
  margin: 0;
  font-size: 12px;
  color: #666;
}

.transfer-test__hint {
  margin: 0;
  font-size: 12px;
  color: #888;
  line-height: 1.4;
}

.transfer-test__row {
  display: flex;
  gap: 8px;
}

.transfer-test__row .transfer-test__btn {
  flex: 1;
  text-align: center;
}

.transfer-test__select {
  padding: 8px 12px;
  font-size: 14px;
  border: 1px solid #d0d0d0;
  border-radius: 6px;
  background: #fff;
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
