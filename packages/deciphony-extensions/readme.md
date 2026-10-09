# @deciphony/extensions

`@deciphony/renderer` 的官方扩展包。从原 `@deciphony/test/src/views/dr-extensions` 迁出，宿主通过包名 + Vite 别名引用，无需再拷贝扩展源码。

## 扩展一览

| 子路径 | 说明 |
|--------|------|
| `@deciphony/extensions/dr-title` | 标题槽 |
| `@deciphony/extensions/dr-lyrics` | 歌词槽 |
| `@deciphony/extensions/dr-instrument-name` | 乐器名槽（s-l）：`singleStaff.data.instrumentName`，缺省显示 `defaultInstrument` |
| `@deciphony/extensions/dr-edit` | 谱表/小节增删（edit-util） |
| `@deciphony/extensions/dr-edit/score-builder` | 曲谱工厂 / 定位 / 插入 |
| `@deciphony/extensions/dr-play` | 播放序列；鼓谱需映射表 `{drumMap}`（缺省 `DEFAULT_DRUM_PLAY_MAP`）；每项 `toneColor` 取所在单谱表 `data.instrumentValue`，缺省 `{defaultToneColor}`（默认 `'piano'`） |
| `@deciphony/extensions/dr-play-highlight` | 播放高亮（`drPlayHighlight` 放入 `:extensions`） |
| `@deciphony/extensions/dr-time-offset` | 谱音同步（`TimeOffsetEditor`） |
| `@deciphony/extensions/dr-musicxml-transfer` | MusicXML ↔ MusicScore（导入支持 .xml / .musicxml / .mxl，`musicXmlFileToMusicScore` 返回 `{musicScore, warnings}`） |
| `@deciphony/extensions/dr-midi-transfer` | MIDI（.mid）↔ MusicScore；导出走 dr-play 播放序列，导入生成五线谱（依赖 dr-play、dr-edit、score-util） |
| `@deciphony/extensions/dr-midi-record` | MIDI 实时录制 → 钢琴大谱表（`createMidiRecorder` + `connectWebMidi`）；和弦窗口 + 左右手分配规则见 `src/dr-midi-record/规则.md` |
| `@deciphony/extensions/dr-mark` | 标记扩展（`drMark({type})`，挂 `m-d`）：`type: 'flute'` + `flute: {key: 'D'}`（笛子调必填）在每个 noteSlot 第一个音符下方画六孔笛指法图；`type: 'ocarina'` + `ocarina: {model: 'transverse12', key: 'AC'}` 画陶笛指法（单张图、吹口朝下；12 孔为三角形、拇指孔在底部两侧，4 孔吊坠为椭圆、只有正面）；`type: 'xiao'` + `xiao: {model: 'hole8', key: 'G'}` 画箫指法（单图，背孔左偏画在最上） |
| `@deciphony/extensions/dr-score3d` | 3D 曲谱可视化：`Score3D` 组件把曲谱转成单行复谱表，用 three.js 在 3D 场景里展示，可拖动视角；暴露相机 / 背景色等 API；`toSingleLineMusicScore` 单独可用（需要 `three`） |
| `@deciphony/extensions/dr-numberNotation-transfer` | 五线 ↔ 简谱 |
| `@deciphony/extensions/dr-quick-numberNotation` | 简谱快速打谱：文本 ↔ 简谱 MusicScore（规则见 `src/dr-quick-numberNotation/规则.md`） |
| `@deciphony/extensions/chord-builder` | 和弦图编辑器（`ChordBuilder`，传入 `chord: tabChord`） |
| `@deciphony/extensions/audio-to-score` | 清晰单声部音频 → SJ 五线谱（浏览器端实验版） |
| `@deciphony/extensions/score-util` | 调号/音高/小节位置等工具 |

也可 `import { … } from '@deciphony/extensions'` 使用根 barrel。

## 本地开发（@deciphony/test）

```ts
// vite.config.ts
'@deciphony/extensions': path.resolve(__dirname, '../deciphony-extensions/src'),
```

```ts
import { drTitle } from '@deciphony/extensions/dr-title'
```

## 乐器名

```ts
import {drInstrumentName} from '@deciphony/extensions/dr-instrument-name'

// 单谱表：staff.data.instrumentName = '小提琴'（支持 '\n' 换行）；未设置时显示默认乐器
// gap：文本与曲谱的间距（px，默认 6，可传 ref 动态调整）
const extensions = [drInstrumentName({defaultInstrument: '钢琴', width: 64, gap: 10})]
```

## 简谱快速打谱

```ts
import {
  musicScoreToQuickNumberNotation,
  quickNumberNotationToMusicScore,
} from '@deciphony/extensions/dr-quick-numberNotation'

// 一行一个单谱表，空行分隔复谱表；options 透传标题 / 调号 / 拍号（缺省 4/4）/ bpm / 宽高
const {musicScore, warnings} = quickNumberNotationToMusicScore(
  '5. 4. <7. >6. .5(.6) | .7 .5 .5/ 5- |4',
  {timeSignature: TimeSignatureTypeEnum['4_4']},
)

// 仅简谱；文本表达不了的内容（变音记号等）跳过并写入 warnings
const {text} = musicScoreToQuickNumberNotation(musicScore)
```

## 单声部音频转谱

```ts
import {audioToScore} from '@deciphony/extensions/audio-to-score'

const {musicScore, notes, bpm, warnings} = await audioToScore(file, {
  bpm: 'auto',
  quantize: 16,
})
```

输入支持 `Blob` / `File` / `ArrayBuffer` / `AudioBuffer`。当前实现针对清晰哼唱和单音乐器；
和弦、钢琴双手及完整歌曲混音不属于本地 DSP 首版的支持范围。

## 3D 曲谱

```vue
<script setup lang="ts">
import {ref} from 'vue'
import {Score3D, type Score3DExpose} from '@deciphony/extensions/dr-score3d'
import {drTitle} from '@deciphony/extensions/dr-title'

const view = ref<Score3DExpose | null>(null)
// view.value.setCamera({position: {x: 0, y: 0, z: 800}, target: {x: 400, y: -200, z: 0}}, {duration: 800})
// view.value.setBackground('#000') / fitView() / focusX(1200) / resetCamera() / getCamera()
</script>

<template>
  <div style="height: 600px">
    <Score3D ref="view" :music-score="score" :extensions="[drTitle()]" background="#1f2228" :depth="2"/>
  </div>
</template>
```

- 先把多行（多个复谱表）合并成一个复谱表的单行谱，再交给 `musicScore` 在不可见容器里渲染，读取 SVG 转成 three 网格（形状挤出 `depth` 厚度，文字栅格化成贴图）
- 世界坐标：x = 曲谱 x（px），y = −曲谱 y，z 朝向观察者；`scoreToWorld(x, y)` 换算
- 左键旋转、右键平移、滚轮缩放（OrbitControls，可用 `controls` / `setControls` 配置）
- 只适合展示：曲谱内容不可点击编辑；播放高亮会让整份重建，暂不建议接 `drPlayHighlight`

## Peer 依赖

- `vue`
- `@deciphony/renderer`
- `fast-xml-parser` / `xmlbuilder`（MusicXML 扩展需要）
- `three`（可选，仅 `dr-score3d` 需要，≥ 0.160）
