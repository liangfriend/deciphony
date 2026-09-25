# @deciphony/extensions

`@deciphony/renderer` 的官方扩展包。从原 `@deciphony/test/src/views/dr-extensions` 迁出，宿主通过包名 + Vite 别名引用，无需再拷贝扩展源码。

## 扩展一览

| 子路径 | 说明 |
|--------|------|
| `@deciphony/extensions/dr-title` | 标题槽 |
| `@deciphony/extensions/dr-lyrics` | 歌词槽 |
| `@deciphony/extensions/dr-edit` | 谱表/小节增删（edit-util） |
| `@deciphony/extensions/dr-edit/score-builder` | 曲谱工厂 / 定位 / 插入 |
| `@deciphony/extensions/dr-play` | 播放序列 |
| `@deciphony/extensions/dr-play-highlight` | 播放高亮（`drPlayHighlight` 放入 `:extensions`） |
| `@deciphony/extensions/dr-time-offset` | 谱音同步（`TimeOffsetEditor`） |
| `@deciphony/extensions/dr-musicxml-transfer` | MusicXML ↔ MusicScore |
| `@deciphony/extensions/dr-numberNotation-transfer` | 五线 ↔ 简谱 |
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

## Peer 依赖

- `vue`
- `@deciphony/renderer`
- `fast-xml-parser` / `xmlbuilder`（MusicXML 扩展需要）
