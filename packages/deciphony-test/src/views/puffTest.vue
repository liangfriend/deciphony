<script lang="ts" setup>
import {PuffDetector, PUFF_BANDS} from '@deciphony/puff'
import type {PuffBandName, PuffBlowSummary, PuffCalibration, PuffFrame} from '@deciphony/puff'
import {computed, onBeforeUnmount, onMounted, reactive, ref, shallowRef, watch} from 'vue'

// —— 检测器 ——

const detector = new PuffDetector({includeSpectrum: true})
const running = ref(false)
const error = ref('')
const frame = shallowRef<PuffFrame | null>(null)
const calibration = ref<PuffCalibration | null>(null)
const calibrating = ref(false)

const params = reactive({
  startSnrDb: detector.options.startSnrDb,
  stopSnrDb: detector.options.stopSnrDb,
  startConfidence: detector.options.startConfidence,
  dynamicRangeDb: detector.options.dynamicRangeDb,
  autoRange: detector.options.autoRange,
  pressureCurve: detector.options.pressureCurve,
  attackMs: detector.options.attackMs,
  releaseMs: detector.options.releaseMs,
  articulationThreshold: detector.options.articulationThreshold,
})
watch(params, () => detector.setOptions({...params}), {deep: true})

type LogItem = {id: number; time: string; kind: 'start' | 'end' | 'articulation' | 'calibrated'; text: string}
const logs = ref<LogItem[]>([])
let logId = 0
function log(kind: LogItem['kind'], text: string, timeMs: number): void {
  logs.value = [{id: logId++, time: (timeMs / 1000).toFixed(2) + 's', kind, text}, ...logs.value].slice(0, 30)
}

type HistoryPoint = {t: number; pressure: number; level: number; confidence: number; blowing: boolean; articulation: boolean}
const HISTORY_MS = 6000
const history: HistoryPoint[] = []
let latest: PuffFrame | null = null

detector.on('frame', (f) => {
  latest = f
  history.push({
    t: f.time,
    pressure: f.pressure,
    level: f.level,
    confidence: f.confidence,
    blowing: f.isBlowing,
    articulation: f.articulation && !f.blowStart,
  })
  while (history.length && history[0]!.t < f.time - HISTORY_MS) history.shift()
  synth.update(f)
})
detector.on('blowStart', (f) => log('start', `开始吹气 · 置信度 ${f.confidence.toFixed(2)}`, f.time))
detector.on('articulation', (f) => {
  if (!f.blowStart) log('articulation', `吐音 · 气压 ${f.pressure.toFixed(2)}`, f.time)
})
detector.on('blowEnd', (s: PuffBlowSummary) =>
  log('end', `结束 · 时长 ${(s.duration / 1000).toFixed(2)}s · 峰值 ${s.peakPressure.toFixed(2)} · 平均 ${s.averagePressure.toFixed(2)} · 吐音 ${s.articulationCount - 1} 次`, s.endTime),
)
detector.on('calibrated', (c) => {
  calibration.value = c
  calibrating.value = false
  log('calibrated', `底噪 ${c.noiseFloorDb.toFixed(1)} dB（±${c.noiseStdDb.toFixed(1)}）`, latest?.time ?? 0)
})

async function start(): Promise<void> {
  error.value = ''
  try {
    calibrating.value = true
    await detector.start()
    running.value = true
    synth.attach(detector.context!)
  } catch (reason) {
    calibrating.value = false
    error.value = reason instanceof Error ? `${reason.name}: ${reason.message}` : String(reason)
  }
}

function stop(): void {
  detector.stop()
  running.value = false
  calibrating.value = false
  synth.silence()
}

async function recalibrate(): Promise<void> {
  calibrating.value = true
  await detector.calibrate(1000)
}

// —— 模拟乐器 ——

type InstrumentKey = 'dizi' | 'xiao' | 'ocarina'
type Instrument = {
  label: string
  baseMidi: number
  harmonics: number[]
  noise: number
  noiseHz: number
  lowpassHz: number
  /** 气压到 0.5 以上时每单位气压的音高偏移（音分） */
  bendCents: number
  /** 超吹阈值，超过后升八度；null 表示不能超吹 */
  overblow: number | null
}

const INSTRUMENTS: Record<InstrumentKey, Instrument> = {
  dizi: {label: '笛子', baseMidi: 67, harmonics: [1, 0.55, 0.3, 0.14, 0.07, 0.03], noise: 0.12, noiseHz: 3200, lowpassHz: 7000, bendCents: 30, overblow: 0.82},
  xiao: {label: '箫', baseMidi: 55, harmonics: [1, 0.22, 0.09, 0.03], noise: 0.28, noiseHz: 1300, lowpassHz: 2200, bendCents: 20, overblow: 0.9},
  ocarina: {label: '陶笛', baseMidi: 72, harmonics: [1, 0.05, 0.02], noise: 0.05, noiseHz: 2500, lowpassHz: 5000, bendCents: 60, overblow: null},
}
const SCALE = [0, 2, 4, 5, 7, 9, 11, 12]
const DEGREE_LABELS = ['1', '2', '3', '4', '5', '6', '7', '1̇']

const synthEnabled = ref(false)
const instrumentKey = ref<InstrumentKey>('dizi')
const degree = ref(0)
const sounding = ref({midi: 0, overblown: false})

function midiToName(midi: number): string {
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  return `${names[midi % 12]}${Math.floor(midi / 12) - 1}`
}

const synth = (() => {
  let ctx: AudioContext | null = null
  let osc: OscillatorNode | null = null
  let tone: GainNode | null = null
  let noiseGain: GainNode | null = null
  let noiseFilter: BiquadFilterNode | null = null
  let lowpass: BiquadFilterNode | null = null
  let master: GainNode | null = null

  function applyInstrument(): void {
    if (!ctx || !osc || !noiseFilter || !lowpass) return
    const inst = INSTRUMENTS[instrumentKey.value]
    const real = new Float32Array(inst.harmonics.length + 1)
    const imag = new Float32Array([0, ...inst.harmonics])
    osc.setPeriodicWave(ctx.createPeriodicWave(real, imag))
    noiseFilter.frequency.value = inst.noiseHz
    lowpass.frequency.value = inst.lowpassHz
  }

  return {
    attach(context: AudioContext) {
      if (ctx === context) return
      ctx = context
      master = ctx.createGain()
      master.gain.value = 0
      lowpass = ctx.createBiquadFilter()
      lowpass.type = 'lowpass'
      master.connect(lowpass).connect(ctx.destination)

      osc = ctx.createOscillator()
      tone = ctx.createGain()
      osc.connect(tone).connect(master)
      osc.start()

      const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
      const noise = ctx.createBufferSource()
      noise.buffer = buffer
      noise.loop = true
      noiseFilter = ctx.createBiquadFilter()
      noiseFilter.type = 'bandpass'
      noiseFilter.Q.value = 0.9
      noiseGain = ctx.createGain()
      noise.connect(noiseFilter).connect(noiseGain).connect(master)
      noise.start()
      applyInstrument()
    },
    applyInstrument,
    update(f: PuffFrame) {
      if (!ctx || !osc || !master || !noiseGain || !tone) return
      const inst = INSTRUMENTS[instrumentKey.value]
      const p = synthEnabled.value ? f.pressure : 0
      const overblown = inst.overblow != null && p >= inst.overblow
      const midi = inst.baseMidi + SCALE[degree.value]! + (overblown ? 12 : 0)
      const cents = inst.bendCents * Math.max(0, p - 0.5) * 2
      const freq = 440 * 2 ** ((midi - 69) / 12 + cents / 1200)
      const t = ctx.currentTime
      osc.frequency.setTargetAtTime(freq, t, 0.012)
      master.gain.setTargetAtTime(0.35 * p ** 1.3, t, 0.01)
      noiseGain.gain.setTargetAtTime(inst.noise * (0.4 + p), t, 0.01)
      tone.gain.setTargetAtTime(1, t, 0.01)
      if (p > 0.01) sounding.value = {midi, overblown}
    },
    silence() {
      if (ctx && master) master.gain.setTargetAtTime(0, ctx.currentTime, 0.02)
    },
  }
})()

watch(instrumentKey, () => synth.applyInstrument())
watch(synthEnabled, (on) => {
  if (!on) synth.silence()
})

function onKeydown(e: KeyboardEvent): void {
  const index = '12345678'.indexOf(e.key)
  if (index >= 0) degree.value = index
}

// —— 绘制 ——

const timelineRef = ref<HTMLCanvasElement | null>(null)
const spectrumRef = ref<HTMLCanvasElement | null>(null)
let raf = 0
let lastUiUpdate = 0

function fitCanvas(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const dpr = window.devicePixelRatio || 1
  const {width, height} = canvas.getBoundingClientRect()
  if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
  }
  const g = canvas.getContext('2d')!
  g.setTransform(dpr, 0, 0, dpr, 0, 0)
  return g
}

function drawTimeline(): void {
  const canvas = timelineRef.value
  if (!canvas) return
  const g = fitCanvas(canvas)
  const w = canvas.clientWidth
  const h = canvas.clientHeight
  g.clearRect(0, 0, w, h)
  const now = latest?.time ?? 0
  const x = (t: number) => w - ((now - t) / HISTORY_MS) * w
  const y = (v: number) => h - 6 - v * (h - 12)

  g.fillStyle = 'rgba(64, 145, 108, 0.12)'
  for (let i = 0; i < history.length; i++) {
    const p = history[i]!
    if (!p.blowing) continue
    const next = history[i + 1]
    g.fillRect(x(p.t), 0, Math.max(1, (next ? x(next.t) : w) - x(p.t)), h)
  }

  g.strokeStyle = '#e4e8ee'
  g.lineWidth = 1
  for (const v of [0.25, 0.5, 0.75]) {
    g.beginPath()
    g.moveTo(0, y(v))
    g.lineTo(w, y(v))
    g.stroke()
  }

  const line = (key: 'pressure' | 'level' | 'confidence', color: string, width: number, fill = false) => {
    if (!history.length) return
    g.beginPath()
    history.forEach((p, i) => (i ? g.lineTo(x(p.t), y(p[key])) : g.moveTo(x(p.t), y(p[key]))))
    if (fill) {
      g.lineTo(x(history[history.length - 1]!.t), h)
      g.lineTo(x(history[0]!.t), h)
      g.closePath()
      g.fillStyle = 'rgba(48, 111, 232, 0.18)'
      g.fill()
    } else {
      g.strokeStyle = color
      g.lineWidth = width
      g.stroke()
    }
  }
  line('pressure', '', 0, true)
  line('level', '#9aa4b1', 1)
  line('confidence', '#f0a030', 1.2)
  line('pressure', '#306fe8', 2)

  g.fillStyle = '#e04848'
  for (const p of history) if (p.articulation) g.fillRect(x(p.t) - 1, 0, 2, 10)
}

function drawSpectrum(): void {
  const canvas = spectrumRef.value
  const f = latest
  if (!canvas || !f?.spectrum) return
  const g = fitCanvas(canvas)
  const w = canvas.clientWidth
  const h = canvas.clientHeight
  g.clearRect(0, 0, w, h)
  const maxHz = Math.min(16000, f.sampleRate / 2)
  const minHz = 20
  const fx = (hz: number) => (Math.log(hz / minHz) / Math.log(maxHz / minHz)) * w
  const dy = (db: number) => h - Math.max(0, Math.min(1, (db + 110) / 90)) * h

  g.fillStyle = 'rgba(48, 111, 232, 0.55)'
  const bins = f.spectrum
  for (let i = 1; i < bins.length; i++) {
    const hz = i * f.binHz
    if (hz < minHz || hz > maxHz) continue
    const x0 = fx(hz)
    const x1 = fx(hz + f.binHz)
    const top = dy(bins[i]!)
    g.fillRect(x0, top, Math.max(1, x1 - x0 - 0.5), h - top)
  }

  const floorY = dy(f.noiseFloorDb - 30)
  g.strokeStyle = 'rgba(0,0,0,0.15)'
  g.setLineDash([4, 4])
  g.beginPath()
  g.moveTo(0, floorY)
  g.lineTo(w, floorY)
  g.stroke()
  g.setLineDash([])

  g.font = '11px sans-serif'
  g.fillStyle = '#67717e'
  for (const [name, [lo]] of Object.entries(PUFF_BANDS)) {
    if (lo > maxHz) continue
    const bx = fx(Math.max(minHz, lo))
    g.fillStyle = 'rgba(0,0,0,0.12)'
    g.fillRect(bx, 0, 1, h)
    g.fillStyle = '#67717e'
    g.fillText(name, bx + 3, 12)
  }
  g.fillStyle = '#e04848'
  const cx = fx(Math.max(minHz, f.spectralCentroid))
  g.fillRect(cx - 1, 0, 2, h)
  g.fillText('质心', cx + 3, h - 4)
}

function loop(now: number): void {
  drawTimeline()
  drawSpectrum()
  if (now - lastUiUpdate > 66) {
    frame.value = latest
    lastUiUpdate = now
  }
  raf = requestAnimationFrame(loop)
}

onMounted(() => {
  raf = requestAnimationFrame(loop)
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  window.removeEventListener('keydown', onKeydown)
  detector.dispose()
})

// —— 展示 ——

const STATE_LABEL = {calibrating: '校准中（请保持安静）', idle: '未吹气', blowing: '吹气中'} as const
const BAND_LABEL: Record<PuffBandName, string> = {
  sub: '超低 20–200', low: '低 200–800', mid: '中 800–3k', high: '高 3k–8k', air: '气声 8k–16k',
}

const fmt = (v: number | null | undefined, digits = 2, unit = '') =>
  v == null || !Number.isFinite(v) ? '—' : `${v.toFixed(digits)}${unit}`

const groups = computed(() => {
  const f = frame.value
  if (!f) return []
  return [
    {
      title: '控制量（驱动乐器）',
      rows: [
        ['pressure', '气压', fmt(f.pressure, 3), f.pressure],
        ['pressureVelocity', '气压变化 /s', fmt(f.pressureVelocity, 2)],
        ['level', '原始响度', fmt(f.level, 3), f.level],
        ['peakPressure', '本口气峰值', fmt(f.peakPressure, 3), f.peakPressure],
        ['confidence', '吹气置信度', fmt(f.confidence, 3), f.confidence],
        ['steadiness', '平稳度', fmt(f.steadiness, 3), f.steadiness],
        ['modulationRate', '气颤音频率', fmt(f.modulationRate, 2, ' Hz')],
        ['modulationDepth', '气颤音幅度', fmt(f.modulationDepth, 3), Math.min(1, f.modulationDepth * 5)],
        ['modulationClarity', '气颤音清晰度', fmt(f.modulationClarity, 3), f.modulationClarity],
      ],
    },
    {
      title: '状态与计时',
      rows: [
        ['state', '状态', f.state],
        ['isBlowing', '正在吹气', String(f.isBlowing)],
        ['blowDuration', '本口气时长', fmt(f.blowDuration / 1000, 2, ' s')],
        ['silenceDuration', '距上次结束', fmt(f.silenceDuration / 1000, 2, ' s')],
        ['blowCount', '吹气次数', String(f.blowCount)],
        ['time', '运行时间', fmt(f.time / 1000, 2, ' s')],
        ['dt', '帧间隔', fmt(f.dt, 1, ' ms')],
        ['audioTime', 'audioTime', fmt(f.audioTime, 3, ' s')],
      ],
    },
    {
      title: '响度',
      rows: [
        ['db', '电平', fmt(f.db, 1, ' dBFS')],
        ['noiseFloorDb', '底噪', fmt(f.noiseFloorDb, 1, ' dBFS')],
        ['snrDb', '信噪比', fmt(f.snrDb, 1, ' dB')],
        ['fullScaleSnrDb', '满气压信噪比', fmt(f.fullScaleSnrDb, 1, ' dB')],
        ['rms', 'RMS', fmt(f.rms, 4)],
        ['peak', '峰值', fmt(f.peak, 3), f.peak],
        ['clipping', '削波', String(f.clipping)],
        ['zeroCrossingRate', '过零率', fmt(f.zeroCrossingRate, 3)],
      ],
    },
    {
      title: '音色 / 频谱',
      rows: [
        ['spectralCentroid', '频谱质心', fmt(f.spectralCentroid, 0, ' Hz')],
        ['spectralRolloff', '85% 滚降', fmt(f.spectralRolloff, 0, ' Hz')],
        ['spectralFlatness', '全段平坦度', fmt(f.spectralFlatness, 3), f.spectralFlatness],
        ['activeFlatness', '有效频段平坦度', fmt(f.activeFlatness, 3), f.activeFlatness],
        ['localFlatness', '局部平坦度', fmt(f.localFlatness, 3), f.localFlatness],
        ['activeBand', '有效频段', `${f.activeBandLow.toFixed(0)}–${f.activeBandHigh.toFixed(0)} Hz`],
        ['spectralFlux', '频谱通量', fmt(f.spectralFlux, 2, ' dB')],
        ['periodicity', '周期性', fmt(f.periodicity, 3), f.periodicity],
        ['pitch', '音高（人声/口哨）', f.pitch ? `${f.pitch.toFixed(1)} Hz` : '—'],
      ],
    },
    {
      title: '分项得分 scores',
      rows: [
        ['scores.loudness', '响度', fmt(f.scores.loudness, 3), f.scores.loudness],
        ['scores.noisiness', '噪声感', fmt(f.scores.noisiness, 3), f.scores.noisiness],
        ['scores.aperiodicity', '非周期性', fmt(f.scores.aperiodicity, 3), f.scores.aperiodicity],
        ['scores.turbulence', '湍流', fmt(f.scores.turbulence, 3), f.scores.turbulence],
      ],
    },
  ] as {title: string; rows: [string, string, string, number?][]}[]
})

const bands = computed(() => {
  const f = frame.value
  if (!f) return []
  return (Object.keys(BAND_LABEL) as PuffBandName[]).map((name) => ({
    name,
    label: BAND_LABEL[name],
    db: f.bands[name].db,
    ratio: f.bands[name].ratio,
  }))
})
</script>

<template>
  <main class="puff-test">
    <header class="toolbar">
      <h1>@deciphony/puff 吹气检测</h1>
      <button v-if="!running" class="primary" type="button" @click="start">开始（开麦）</button>
      <button v-else type="button" @click="stop">停止</button>
      <button :disabled="!running || calibrating" type="button" @click="recalibrate">重新校准底噪（1 秒）</button>
      <span :class="['badge', frame?.state ?? 'off']">{{ running ? STATE_LABEL[frame?.state ?? 'calibrating'] : '未开启' }}</span>
      <span v-if="calibration" class="hint">底噪 {{ calibration.noiseFloorDb.toFixed(1) }} dBFS · 波动 ±{{ calibration.noiseStdDb.toFixed(1) }} dB</span>
      <span v-if="error" class="error">{{ error }}</span>
    </header>

    <section class="meters">
      <div class="meter big">
        <div class="meter-label">气压 pressure</div>
        <div class="meter-track"><div class="meter-fill pressure" :style="{width: `${(frame?.pressure ?? 0) * 100}%`}" /></div>
        <div class="meter-value">{{ fmt(frame?.pressure, 3) }}</div>
      </div>
      <div class="meter">
        <div class="meter-label">原始响度 level</div>
        <div class="meter-track"><div class="meter-fill level" :style="{width: `${(frame?.level ?? 0) * 100}%`}" /></div>
        <div class="meter-value">{{ fmt(frame?.level, 3) }}</div>
      </div>
      <div class="meter">
        <div class="meter-label">吹气置信度 confidence</div>
        <div class="meter-track"><div class="meter-fill confidence" :style="{width: `${(frame?.confidence ?? 0) * 100}%`}" /></div>
        <div class="meter-value">{{ fmt(frame?.confidence, 3) }}</div>
      </div>
    </section>

    <section class="charts">
      <div class="chart">
        <div class="chart-title">
          时间线（6 秒）
          <span class="legend"><i class="lg pressure" />气压</span>
          <span class="legend"><i class="lg level" />原始响度</span>
          <span class="legend"><i class="lg confidence" />置信度</span>
          <span class="legend"><i class="lg blowing" />吹气区间</span>
          <span class="legend"><i class="lg articulation" />吐音</span>
        </div>
        <canvas ref="timelineRef" class="canvas" />
      </div>
      <div class="chart">
        <div class="chart-title">实时频谱（对数频率轴，红线为频谱质心）</div>
        <canvas ref="spectrumRef" class="canvas" />
      </div>
    </section>

    <section class="body">
      <div class="data">
        <div v-if="!frame" class="empty">点击「开始」并允许麦克风权限，开麦后会先自动校准 0.5 秒底噪。</div>
        <div v-for="group in groups" :key="group.title" class="group">
          <h3>{{ group.title }}</h3>
          <table>
            <tr v-for="[key, label, value, bar] in group.rows" :key="key">
              <td class="key">{{ label }}<small>{{ key }}</small></td>
              <td class="value">{{ value }}</td>
              <td class="bar-cell"><div v-if="bar != null" class="mini-bar" :style="{width: `${Math.max(0, Math.min(1, bar)) * 100}%`}" /></td>
            </tr>
          </table>
        </div>
        <div v-if="bands.length" class="group">
          <h3>频带 bands</h3>
          <table>
            <tr v-for="b in bands" :key="b.name">
              <td class="key">{{ b.label }}<small>bands.{{ b.name }}</small></td>
              <td class="value">{{ fmt(b.db, 1, ' dB') }} · {{ (b.ratio * 100).toFixed(1) }}%</td>
              <td class="bar-cell"><div class="mini-bar" :style="{width: `${b.ratio * 100}%`}" /></td>
            </tr>
          </table>
        </div>
      </div>

      <aside class="side">
        <div class="group">
          <h3>模拟乐器</h3>
          <label class="row"><input v-model="synthEnabled" type="checkbox"> 用气压发声</label>
          <div class="seg">
            <button v-for="(inst, key) in INSTRUMENTS" :key="key" :class="{active: instrumentKey === key}" type="button" @click="instrumentKey = key">{{ inst.label }}</button>
          </div>
          <div class="seg notes">
            <button v-for="(label, i) in DEGREE_LABELS" :key="i" :class="{active: degree === i}" type="button" @click="degree = i">{{ label }}</button>
          </div>
          <p class="hint">键盘 1–8 切换音。气压越大越响、音高略升；笛子/箫用力吹会超吹到高八度，陶笛不能超吹但音高随气压变化更明显。</p>
          <p class="hint">当前：{{ sounding.midi ? midiToName(sounding.midi) : '—' }}{{ sounding.overblown ? '（超吹）' : '' }}</p>
        </div>

        <div class="group">
          <h3>检测参数（实时生效）</h3>
          <label class="slider">开始信噪比 {{ params.startSnrDb }} dB<input v-model.number="params.startSnrDb" max="30" min="3" step="1" type="range"></label>
          <label class="slider">保持信噪比 {{ params.stopSnrDb }} dB<input v-model.number="params.stopSnrDb" max="20" min="1" step="1" type="range"></label>
          <label class="slider">开始置信度 {{ params.startConfidence.toFixed(2) }}<input v-model.number="params.startConfidence" max="0.95" min="0.1" step="0.05" type="range"></label>
          <label class="slider">{{ params.autoRange ? '最小动态范围' : '动态范围' }} {{ params.dynamicRangeDb }} dB<input v-model.number="params.dynamicRangeDb" max="60" min="12" step="2" type="range"></label>
          <label class="row"><input v-model="params.autoRange" type="checkbox"> 自动量程（满气压跟随最大力度）</label>
          <p class="hint">
            满气压 = 信噪比 {{ frame ? frame.fullScaleSnrDb.toFixed(1) : '—' }} dB
            <button :disabled="!running" class="link" type="button" @click="detector.resetRange()">重置量程</button>
          </p>
          <label class="slider">气压曲线 {{ params.pressureCurve.toFixed(2) }}<input v-model.number="params.pressureCurve" max="2.5" min="0.4" step="0.05" type="range"></label>
          <label class="slider">起音 {{ params.attackMs }} ms<input v-model.number="params.attackMs" max="200" min="0" step="5" type="range"></label>
          <label class="slider">释音 {{ params.releaseMs }} ms<input v-model.number="params.releaseMs" max="500" min="0" step="10" type="range"></label>
          <label class="slider">吐音灵敏度 {{ params.articulationThreshold.toFixed(2) }}<input v-model.number="params.articulationThreshold" max="0.5" min="0.05" step="0.01" type="range"></label>
        </div>

        <div class="group">
          <h3>事件</h3>
          <ul class="logs">
            <li v-for="item in logs" :key="item.id" :class="item.kind"><span>{{ item.time }}</span>{{ item.text }}</li>
            <li v-if="!logs.length" class="hint">吹一口气试试</li>
          </ul>
        </div>
      </aside>
    </section>
  </main>
</template>

<style scoped>
.puff-test {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 100vh;
  padding: 16px 20px;
  box-sizing: border-box;
  color: #252525;
  background: #f4f6f8;
  font-size: 13px;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

h1 {
  margin: 0 12px 0 0;
  font-size: 18px;
}

h3 {
  margin: 0 0 8px;
  font-size: 13px;
  color: #4a5360;
}

button {
  min-height: 30px;
  padding: 0 12px;
  cursor: pointer;
  background: white;
  border: 1px solid #d0d0d0;
  border-radius: 5px;
}

button:disabled {
  cursor: default;
  opacity: 0.5;
}

.primary {
  color: white;
  background: #306fe8;
  border-color: #306fe8;
}

.badge {
  padding: 4px 10px;
  border-radius: 999px;
  background: #e6e9ee;
  color: #4a5360;
}

.badge.blowing {
  background: #40916c;
  color: white;
}

.badge.calibrating {
  background: #f0a030;
  color: white;
}

.hint {
  margin: 0;
  color: #67717e;
  font-size: 12px;
  line-height: 1.5;
}

.error {
  color: #c83232;
}

.meters {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 12px;
}

.meter {
  padding: 12px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgb(0 0 0 / 6%);
}

.meter-label {
  color: #67717e;
}

.meter-track {
  height: 14px;
  margin: 8px 0 4px;
  overflow: hidden;
  background: #eef1f5;
  border-radius: 7px;
}

.meter.big .meter-track {
  height: 26px;
  border-radius: 13px;
}

.meter-fill {
  height: 100%;
  transition: width 60ms linear;
}

.meter-fill.pressure {
  background: linear-gradient(90deg, #6aa2ff, #306fe8);
}

.meter-fill.level {
  background: #9aa4b1;
}

.meter-fill.confidence {
  background: #f0a030;
}

.meter-value {
  font-family: ui-monospace, monospace;
  font-size: 16px;
}

.meter.big .meter-value {
  font-size: 24px;
}

.charts {
  display: grid;
  grid-template-columns: 3fr 2fr;
  gap: 12px;
}

.chart {
  padding: 10px 12px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgb(0 0 0 / 6%);
}

.chart-title {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 6px;
  color: #4a5360;
}

.legend {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #67717e;
  font-size: 12px;
}

.lg {
  display: inline-block;
  width: 12px;
  height: 3px;
}

.lg.pressure { background: #306fe8; }
.lg.level { background: #9aa4b1; }
.lg.confidence { background: #f0a030; }
.lg.blowing { height: 10px; background: rgba(64, 145, 108, 0.25); }
.lg.articulation { width: 3px; height: 10px; background: #e04848; }

.canvas {
  display: block;
  width: 100%;
  height: 180px;
}

.body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 12px;
  align-items: start;
}

.data {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
  gap: 12px;
}

.group {
  padding: 12px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgb(0 0 0 / 6%);
}

.side {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty {
  grid-column: 1 / -1;
  padding: 40px;
  color: #8a939f;
  text-align: center;
  background: white;
  border: 1px dashed #ccd3dc;
  border-radius: 8px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

td {
  padding: 3px 0;
  border-bottom: 1px solid #f0f2f5;
  vertical-align: middle;
}

td.key small {
  display: block;
  color: #a0a8b3;
  font-size: 10px;
  font-family: ui-monospace, monospace;
}

td.value {
  padding: 0 8px;
  font-family: ui-monospace, monospace;
  text-align: right;
  white-space: nowrap;
}

td.bar-cell {
  width: 80px;
}

.mini-bar {
  height: 6px;
  background: #306fe8;
  border-radius: 3px;
}

.row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

button.link {
  margin-left: 6px;
  padding: 0;
  border: none;
  background: none;
  color: #306fe8;
  font-size: 12px;
  cursor: pointer;
}

button.link:disabled {
  color: #b0b7c0;
  cursor: default;
}

.seg {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
}

.seg button {
  flex: 1;
  padding: 0 4px;
}

.seg button.active {
  color: white;
  background: #40916c;
  border-color: #40916c;
}

.slider {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 6px;
  color: #4a5360;
}

.logs {
  max-height: 260px;
  margin: 0;
  padding: 0;
  overflow: auto;
  list-style: none;
}

.logs li {
  padding: 4px 0;
  border-bottom: 1px solid #f0f2f5;
  font-size: 12px;
}

.logs li span {
  display: inline-block;
  width: 56px;
  color: #a0a8b3;
  font-family: ui-monospace, monospace;
}

.logs li.start { color: #2d7a55; }
.logs li.end { color: #4a5360; }
.logs li.articulation { color: #c83232; }
.logs li.calibrated { color: #b87a10; }

@media (max-width: 1000px) {
  .meters, .charts, .body {
    grid-template-columns: 1fr;
  }
}
</style>
