# @deciphony/cl-sheet — Agent 速读

和弦弹唱谱（吉他）：歌词 + 歌词上方的和弦。组件**只画内容区**（歌词与和弦），标题 / 作者由宿主自己画。
不依赖 renderer / player / extensions，只要 `vue`。演示页：`packages/deciphony-test/src/views/clSheetTest.vue`。

## 目录

```
src/
 index.ts 对外导出（改 API 必改这里）
 types.ts ClSheetData / ClLyric / ClChord / ClSheetSelection
 chords.ts 内置和弦表：根音 × 类型（CHORD_QUALITIES）、COMMON_CHORDS、parseChord / formatChord / listChords
 lyrics.ts 纯函数：createClSheet、textToLyricLine、retextLyricLine（改字保留和弦）、splitLyricLine、方括号写法互转
 components/
 ClSheet.vue 内容区组件（show / edit）
 ChordPicker.vue 和弦选择浮层（Teleport 到 body，fixed 定位）
```

## 数据

```ts
ClSheetData = {title, author, width, height /* 组件像素 */, fontFamily?, lyrics: ClLyric[][], data? /* 宿主自定义，组件不碰 */}
ClLyric = {id, text, color?, underline?, chord?: {text, color?}}
```

- 一行 = `ClLyric[]`；编辑时**一个字一个 ClLyric**（`Array.from` 按码点拆）。和弦挂在字上，画在字的上方、左对齐。
- 行尾 / 连续和弦挂在空格 `' '` 上（方括号写法 `[C] [G]` 解析出来也是这样）；编辑时行尾要放和弦就在文字里打空格。
- `underline`：下划线画在文字盒底边，宽度 = 文字宽（不含和弦撑开的 padding）；空格加下划线时最小宽 1em，与汉字同宽。

## 方括号文本（parseChordLyrics / stringifyChordLyrics）

- `[和弦]` 挂到紧随其后的字上；`{属性}` 只作用于紧随其后的**一个**元素：后面是 `[和弦]` 就是和弦颜色，后面是字就是这个字的歌词属性。
- 属性用逗号或空格分隔：颜色（`#fff` / `#1d6fd8` / `red` / `rgb(...)`，浏览器里用 `CSS.supports` 校验）、`u` = 下划线。例：`{red}[C]{#1d6fd8,u}好`。
- 花括号里有认不出的内容就当普通文字。导出时有颜色 / 下划线才写 `{}`，导入导出往返不丢信息。
- 颜色缺省用组件 props（`color` / `chordColor`），数据里只存改过的。
- 组件**原地修改** `data`（内部 `reactive(props.data)`，宿主传普通对象也能刷新），每次修改 emit `change`。
- 写入的对象一律先 `toRaw`，数据里不留 Vue proxy（宿主 `structuredClone` 不会炸）。

## 排版规则（ClSheet.vue）

- 根节点 `width × height` 像素，内容超出纵向滚动；一行太长自动折行，折出的每一行都留和弦位。
- 分组：英文等连续字母成一组不拆行；中日韩逐字；标点粘前一个字。
- 和弦绝对定位在字上方，可以**压在后面没有和弦的字上**；只有会撞到同一行下一个和弦（留 0.5 × 和弦字号间距）时才给这个字加 `padding-right` 撑开。宽度用 canvas `measureText` 算（字体取根节点计算样式，`document.fonts` 加载完重算）。

## 编辑模式交互

| 操作 | 行为 |
|------|------|
| 点字 | 选中并弹出和弦选择；← → 切换字（跨行）、↑ ↓ 换行；Delete / Backspace 删和弦；Esc 取消；Enter 改这一行文字 |
| 双击 / 行工具 ✎ | 整行文字输入框：Enter 在光标处拆行，行首 Backspace 与上一行合并，↑ ↓ 换行编辑，Esc 放弃，失焦提交；粘贴多行自动拆成多行 |
| 改文字 | `retextLyricLine`：按字做最长公共子序列，没改的字保留 id / 颜色 / 和弦；被删字上的和弦移到紧随的新字（否则行尾）；新字沿用前一个字的颜色和下划线 |
| 拖和弦 | HTML5 拖放到另一个字：移动（目标原有和弦则互换）；按住 Ctrl / Alt 复制 |
| 行工具 | 悬停行右上角：编辑 / 上移 / 下移 / 下方插入 / 删除；底部「添加一行」 |

浮层颜色区：和弦颜色 / 歌词颜色各一行，各有「默认」（删掉 color 字段）；歌词颜色后「同步」把这个字的歌词颜色设成它的和弦颜色（和弦没设颜色就用 `chordColor`），没有和弦时禁用；「U」切换下划线。取色器只认 `#rrggbb`，`red` / `#fff` 这类颜色显示时先用 canvas 换算。

浮层：点浮层按钮不抢焦点（`mousedown.preventDefault`，输入框 / 下拉 / 取色除外），所以选和弦后方向键仍有效；点组件和浮层以外的地方取消选中。

## 对外契约

Props：`data`、`mode?: 'show' | 'edit'`、`fontSize?`(18)、`chordFontSize?`(fontSize × 0.8)、`lineGap?`(12)、`padding?`(16)、`color?`、`chordColor?`（都要 `#rrggbb`，取色器用）、`commonChords?`、`chords?`（手输补全，缺省内置全集）

新增内容默认颜色（`ClSheetAddColors`）：props `addLyricColor` / `addChordColor` 给初值，expose `setAddColors({lyric?, chord?})` 随时改（`undefined` 不改，`null` / `''` 清除）、`getAddColors()` 读。只在**新加**时把颜色写进数据，已有内容不变：
- `lyric`：行编辑里新打的字、Enter / 插入 / 粘贴出来的新行、`insertLine` / `setLineText`（`retextLyricLine` / `textToLyricLine` 的 `options.color`，优先于「沿用前一个字的颜色」）
- `chord`：给原来**没有和弦**的字加和弦时（`setChord` / 选择器）；改已有和弦、「默认」按钮、拖动 / 复制都不染色

事件：`change(data)`、`selectionChange(ClSheetSelection | null)`（只在选中目标变化时发）

Expose：`getSelection` / `select(id)` / `clearSelection` / `setChord(id, chord | null)` / `setLyricColor(id, color?)` / `setLyricUnderline(id, underline)` / `setAddColors({lyric?, chord?})` / `getAddColors()` / `insertLine(index, text?)` / `removeLine` / `moveLine(index, delta)` / `setLineText(index, text)` / `startEditLine(index, caret?)` / `endEditLine` / `getElement`

纯函数：`createClSheet`、`textToLyricLine`、`lyricLineText`、`retextLyricLine`、`splitLyricLine`、`parseChordLyrics`（`[C]好一朵[Am]茉莉花` → 行）、`stringifyChordLyrics`、`parseChord` / `formatChord` / `listChords` / `normalizeChordText`（♯♭ → #b）

## 构建 / 发布

- `pnpm build:cl-sheet` / `pnpm publish:cl-sheet`（根目录）；产物 `dist/index.es.js`、`dist/index.cjs.js`、`dist/cl-sheet.css`（宿主需引入 `@deciphony/cl-sheet/dist/cl-sheet.css`）
- test 里通过 vite alias 指到 `src/index.ts`，不用先构建

## 未做

- 和弦指法图（可接 extensions 的 chord-builder）、移调、按小节 / 拍对齐、播放同步高亮
