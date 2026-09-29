# @deciphony/puff — Agent 速读

麦克风吹气检测。开麦后每帧（默认 16 ms）输出气压、吐音、颤音、频谱等数值，用于模拟笛子 / 箫 / 陶笛等吹奏乐器。
只做「检测 + 数值」，不负责发声；发声示例见 `packages/deciphony-test/src/views/puffTest.vue`。

## 依赖

无运行时依赖，只用浏览器 Web Audio（`getUserMedia` + `AnalyserNode`）。不依赖 renderer / player / extensions。

## 目录

```
src/
  index.ts         对外导出（改 API 必改这里）
  types.ts         PuffFrame / PuffDetectorOptions / 事件类型（字段注释即文档）
  constants.ts     DEFAULT_PUFF_OPTIONS、PUFF_BANDS、底噪常量
  features.ts      纯函数：响度 / 频谱 / 周期性（McLeod NSDF）
  puffDetector.ts  PuffDetector：麦克风管线、校准、吹气门限、气压包络、吐音、颤音、事件
```

## 用法

```ts
import {PuffDetector} from '@deciphony/puff'

const detector = new PuffDetector({dynamicRangeDb: 36})
detector.on('frame', (f) => {
  gain.setTargetAtTime(f.pressure ** 1.3, f.audioTime, 0.01) // 气压 → 音量
})
detector.on('blowStart', (f) => {})
detector.on('articulation', (f) => {}) // 吐音（含吹气开始），可用来重新起音
detector.on('blowEnd', (summary) => {}) // 时长 / 峰值 / 平均气压 / 吐音次数
await detector.start() // 必须在用户手势里调用（浏览器限制）
// detector.calibrate(1000) 重新校准；detector.setOptions({...}) 实时改参数
detector.dispose()
```

API：`start()` / `startWithStream(stream)` / `stop()` / `dispose()` / `calibrate(ms)` / `resetRange()` / `setOptions(opts)` / `on(name, cb)`（返回取消函数）/ `off`；
只读：`running` / `context` / `lastFrame` / `options` / `currentNoiseFloorDb` / `currentFullScaleSnrDb`。

## 数据怎么用（模拟乐器）

| 需求 | 字段 |
|------|------|
| 发不发声 | `isBlowing`（带迟滞与最短开 / 关时间，不抖） |
| 音量 | `pressure`（已做起音 / 释音平滑）；要自己平滑就用 `level` |
| 音高随气压（陶笛明显、笛箫轻微） | `pressure` → cents |
| 超吹到高八度（笛子 / 箫） | `pressure` 超过阈值（demo 用 0.82 / 0.9，建议加迟滞） |
| 吐音重新起音 | `articulation` 事件 / 帧字段 |
| 气颤音 | `modulationRate`（Hz）、`modulationDepth`、`modulationClarity`（淡入用） |
| 长音稳定度 | `steadiness` |
| 音色（气声多少） | `spectralCentroid`、`bands.high/air.ratio`、`localFlatness` |
| 调度 AudioParam | `audioTime`（= AudioContext.currentTime） |
| 调试 / 可视化 | `includeSpectrum` / `includeWaveform` 选项、`scores`、`snrDb`、`noiseFloorDb` |

## 判定逻辑（改算法前先读）

1. **底噪**：开麦先校准 `autoCalibrateMs`（取 dB 中位数），空闲时自适应（变安静快跟、变吵慢跟）。底噪不低于 `MIN_NOISE_FLOOR_DB`（-90），纯 0 数据不参与校准。
2. **置信度** = `loudness × aperiodicity × (0.4 + 0.6 × max(noisiness, turbulence))`，再按 30 ms 平滑。
   - `aperiodicity` 排除人声 / 哼唱 / 口哨（周期信号）——这是区分说话和吹气的主力。
   - `noisiness` 用 `localFlatness`（分块平坦度），不能换回全段平坦度：真实气流频谱倾斜严重，全段平坦度只有 0.02–0.08。
3. **门限**：`snrDb ≥ startSnrDb` 且 `confidence ≥ startConfidence` 持续 `minOnMs` 开始；低于 stop 阈值持续 `minOffMs` 结束。舌头完全断气超过 `minOffMs` 会算作新的一口气。
4. **气压**：`level = clamp01((snrDb - stopSnrDb) / (fullScaleSnrDb - stopSnrDb)) ^ pressureCurve`，再经 attack / release 包络得到 `pressure`（0..1，1 = 满）。
   - `fullScaleSnrDb` 最小为 `stopSnrDb + dynamicRangeDb`；`autoRange`（默认开）时吹得更用力就跟着上调（τ 150 ms），不吹时按 `autoRangeDecayDbPerSec` 回落。对着麦克风直吹信噪比常到 50–60 dB，固定量程会一吹就满。
   - 重新校准底噪时量程重置；也可调 `resetRange()`（换人 / 换麦克风时）。
5. **吐音**：先有深回落（谷底 ≤ 峰值 × `articulationDipRatio`），再在 `articulationWindowMs` 内回升 ≥ `articulationThreshold`。气颤音起伏不会误判。
6. **颤音**：只分析最近一次吐音之后的 `level`，重采样到 10 ms 网格、去线性趋势、自相关找 2–12 Hz 周期。清晰度 ≥ 0.5 且幅度 ≥ 0.015 才报；约 0.4 s 出结果。

## 验证方式

浏览器自动化没有麦克风，可以替换 `navigator.mediaDevices.getUserMedia` 返回合成流（滤波白噪声模拟气流、锯齿波模拟哼唱、正弦模拟口哨），或直接 `startWithStream(stream)`。
当前合成回归结果：气流 / 低频风噪 / 「sss」40–50 ms 内判为吹气；哼唱、口哨、静音不触发；吐音只在断气处触发；3 / 5 / 6.5 / 8 Hz 颤音误差 < 0.4 Hz。

## 注意

- `start()` 需要用户手势；Safari / 部分安卓的系统级降噪可能仍会削弱气流声。
- 一个页面只建议一个 detector；想和发声共用 AudioContext 就传 `audioContext`。
- 改 `PuffFrame` 字段时同步 `puffTest.vue` 的数据表。
