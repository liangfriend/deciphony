# @deciphony/extensions — Agent 速读

## 定位

`@deciphony/renderer` 的扩展集合（原 `@deciphony/test/src/views/dr-extensions`）。  
宿主通过包名引用，**不要**再把扩展源码拷进业务仓库。

## 子路径

| Import | 内容 |
|--------|------|
| `@deciphony/extensions/dr-title` | 标题扩展；左侧三块独立：调号 / 拍号 /（beatUnit+bpm），有顶层属性才显示 |
| `@deciphony/extensions/dr-lyrics` | 歌词扩展 |
| `@deciphony/extensions/dr-edit` | 锚点增删谱表/小节；tab4/tab6 共用音符 API（品、弦位、拍弦、推弦、连音线类型）；新建 tab 谱默认 `ClefTypeEnum.Tab`（仅展示） |
| `@deciphony/extensions/dr-edit/score-builder` | 工厂 / 插入删除 / 定位；未显式 `beamType` 时按四分拍 onset 自动 `OnlyRight`/`Combined`/`None`；`tabNote.ts` 为吉他/尤克里里 |
| `@deciphony/extensions/dr-play` | 播放序列；tab6/tab4 按空弦音高 + 品，`x` 用当前和弦图 |
| `@deciphony/extensions/dr-play-highlight` | 播放高亮（`drPlayHighlight` → `:extensions`，`on.renderMusicScore`） |
| `@deciphony/extensions/dr-time-offset` | 谱音同步（`TimeOffsetEditor`；反复展开 + `data[timeProp]: number[]` 遍次） |
| `@deciphony/extensions/dr-musicxml-transfer` | MusicXML |
| `@deciphony/extensions/dr-numberNotation-transfer` | 五线↔简谱 |
| `@deciphony/extensions/chord-builder` | 和弦图编辑器（`ChordBuilder`，props: `chord: tabChord`，可选 `disabled?: ChordBuilderDisabledField[]`） |
| `@deciphony/extensions/audio-to-score` | 浏览器端单声部音频分析，输出 standardStaff MusicScore；不支持多声部混音 |
| `@deciphony/extensions/score-util` | 音高/调号工具（含 `transposeMusicScore` 同谱种转调） |
| `@deciphony/extensions` | 根 barrel（不含 dr-edit，避免与 score-builder 同名冲突） |

## 本地 alias（@deciphony/test）

```ts
'@deciphony/extensions': path.resolve(__dirname, '../deciphony-extensions/src')
```

Vite 会把 `@deciphony/extensions/dr-title` 解析到 `src/dr-title`。

## 依赖

peer：`vue`、`@deciphony/renderer`；MusicXML 另需 `fast-xml-parser`、`xmlbuilder`。

## 规范

- 新扩展：在 `src/` 下新增目录 + `index.ts`，并更新本文件与 `readme.md`、根 `package.json` exports
- 内部交叉引用用相对路径；对宿主只暴露子路径
- `editHelper` 等宿主 UI 留在 test，不要塞进本包
- 事件监听走扩展 `on`（如 `renderMusicScore`），不要在宿主组件上再挂一份同名 `@renderMusicScore`（除非宿主另有用途）
