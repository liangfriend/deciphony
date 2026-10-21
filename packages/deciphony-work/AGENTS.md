# @deciphony/work — Agent 开发指南

给后续大模型 / 开发者的速读文档。改本包前先读完本节与 `doc/` 下短文，再动代码。

## 定位

| 项 | 说明 |
|----|------|
| 包名 | `@deciphony/work` |
| 职责 | sjw 课件**单页内容区**渲染与资源 IO（类似 PDF 一页） |
| 不负责 | 左侧缩略图栏、完整编辑器壳、曲谱内部记谱逻辑 |
| 宿主示例 | `packages/deciphony-test/src/views/workTest.vue` |
| 依赖 | peer：`vue`、`@deciphony/renderer`、`@deciphony/player`、`@deciphony/extensions`；zip：`fflate` |

**SJWPDF** 只接收 `data` + `pageIndex` + `mode`，渲染当前页。缩略图、工具栏由外部自定义。

## 目录速查

```
packages/deciphony-work/
  AGENTS.md                 ← 本文
  doc/
    功能文档.md             产品能力清单
    页面渲染结构.md         三层 + 模式 + 元素约定
    文件加载.md             .sjw zip 结构与资源映射
    曲谱范唱伴奏.md         范唱/伴奏缓存、引用、播放与删除
    右键菜单.md             context-menu / beforeContextMenu
    导出与裁剪.md           图片 zip / PDF 导出、图片与曲谱裁剪
  src/
    index.ts                对外导出（改 API 必改这里）
    types/types.ts          SJW / SPage / SElement / SScore / DrawStroke
    enums/drawToolEnum.ts   DrawToolEnum（pen / eraser）
    constants/elementDefaults.ts   非图片默认宽高
    api/elements.ts         addText / addImage / addAudio / addVideo
    api/scores.ts           addScore / removeScore
    api/pages.ts            addPage / insertPage / removePage
    api/crop.ts             cropImage / cropScore / clearCrop（裁剪 + 调框）
    render/scoreDisplay.ts  曲谱展示配置（插槽宽 / 歌词字号 / 乐器名 / 可见区域），Score.vue 与导出共用
    export/                 导出：renderPage（整页画 canvas）/ scoreSnapshot（离屏渲染曲谱 svg）/ textBox / pdfWriter / exportWork
    draw/paintStrokes.ts    笔迹重绘（含橡皮 destination-out）
    assets/                 资源缓存、sjw 导入导出、图片尺寸
    components/
      SJWPDF.vue            内容区入口 + expose API + 资源缓存
      Page.vue              单页多层；scores + elements + 持久绘制
      AnnotateLayer.vue     show 教学标注层（铺满 SJWPDF 内容区，按页内存缓存）
      EditFrame.vue         通用编辑框（移/拉/转）
      ElementNode.vue       多媒体节点
      Score.vue             曲谱节点（musicScore + dr-title/dr-lyrics 展示 + 播放高亮注册）
      AudioPlayer.vue       可缩放自定义音频条
      VideoPlayer.vue       可缩放自定义视频播放器
    play/scorePlayback.ts   NPlayer + dr-play 序列封装
```

## 数据模型（必须遵守）

### SJW / 页面

- `SJW`：`{ name, author, pages, assetNames? }`（assetNames：id → 自定义名称）
- `SPage`：`width/height`、`background?: { src: 资源id }`、`thumbnail?`、`scores?`、`elements?`、`drawings?`（绘制层笔迹）
- **曲谱与多媒体分栏**：曲谱只进 `scores`，多媒体只进 `elements`。不要把 MusicScore 塞进 `elements`。

### 放置框 `SElementBase`

所有可拖拽框（多媒体 + 曲谱）共用：

- 存储：`x, y` = **未旋转包围盒左上角**；`width/height`；`rotation?`（度）
- 交互几何：**一律以几何中心为基准**
  - 变换：`translate(x,y) rotate(θ, w/2, h/2)`
  - 拉伸：中心固定，对侧同步扩展
  - 旋转：只改 `θ`，枢轴为中心
- 实现见 `EditFrame.vue`，不要另起一套枢轴语义

### elements

| type | 要点 |
|------|------|
| `image` | `src` = **资源缓存 id**；`addImage({assetId})` 或 `addImageFromFile`；原始像素写 width/height，并记 `naturalWidth/naturalHeight`；可选 `crop`（原始像素矩形） |
| `audio` | 同上；`addAudio` / `addAudioFromFile`；默认 `DEFAULT_AUDIO_*`；必须用 `AudioPlayer` |
| `video` | 同上；`addVideo` / `addVideoFromFile`；原始像素写 width/height（读不到则 `DEFAULT_VIDEO_*`）；必须用 `VideoPlayer` |
| `text` | 默认 `DEFAULT_TEXT_*`；双击 → 等大 textarea |

背景：`background.src` = 资源 id；`setBackground(id)` / `setBackgroundFromFile` / `clearBackground`。无背景时白底。替换或清除时，旧背景资源若已无引用则从缓存删除（防反复换图撑爆存储）。

### drawings（编辑模式持久笔迹）

```ts
page.drawings?: DrawStroke[]  // { tool, color?, lineWidth, points: [x,y][] }
```

- 透明 canvas；橡皮：`destination-out`
- 持久化在 **work.json**（随 `.sjw` 导入导出），不是独立资源文件
- 仅 **edit** 下 `startDraw` 写入本层

### 教学标注层（展示模式，不序列化）

- `mode=show` 时在 SJWPDF 内容区最上挂一层透明 canvas（`AnnotateLayer.vue`，不在 `Page.vue` 内）
- **尺寸 = SJWPDF 内容区**（`.sjw-pdf__page-wrap`，至少铺满视口、随滚动），可画到白板之外；ResizeObserver 跟随尺寸
- 笔迹坐标以**白板左上角**为原点（可为负 / 超出页宽高），重绘时按白板当前偏移平移，窗口变化不错位
- **同一套** API：`startDraw` / `endDraw` / `setTool` / `clearDrawings` / `isDrawing` / `getTool`；按当前 `mode` 分流到标注层
- 笔迹按 **page.id** 缓存在内存；**不写** `page.drawings`，不进 `.sjw`
- **换页不自动丢弃**；切 edit 再回 show 仍在；仅 `clearAnnotations()` 或 show 下 `clearDrawings()` 清**当前页**；组件卸载才整表清空
- `clearAnnotations()`：只清当前页标注，不动 `page.drawings`
- 工具枚举：`DrawToolEnum.Pen` | `DrawToolEnum.Eraser`；仅 `startDraw` 后对应 canvas 才接收指针
- `setTool` 第二参数：`lineWidth`、`color`（仅笔）

新增多媒体类型：先扩 `types.ts` + `api/elements.ts` + `ElementNode.vue`，默认尺寸放 `elementDefaults.ts`。

### scores（独立迭代）

```ts
SScore = SElementBase & {
  musicScore: MusicScore
  skin?: string            // 可选，皮肤资源 id（zip 根目录 .json = SkinPack）
  vocalPerformance?: ScoreAudioRef  // { src, name, author? }
  accompaniment?: ScoreAudioRef
  crop?: SCropRect         // 可选，裁剪区域（musicScore.width/height 坐标系）
}
// ScoreAudioRef.src / skin = zip 根目录唯一文件名（资源缓存 id）
```

- `addScore`：框的 `width/height` ← `musicScore.width/height`；`musicScore` 用 `structuredClone`；`skin` 只存资源 id
- SJWPDF.addScore 的 `skin`：id / `{ assetId }` / `{ file }` / SkinPack / Skin（对象每次序列化为新 `.json` 再 loadAsset）
- 范唱/伴奏：见 `doc/曲谱范唱伴奏.md`（`loadAsset` → score 存 `src`；播放互斥；删曲谱清孤儿音频 / 皮肤）
- 右键曲谱：`ctx.vocalPerformance` / `ctx.accompaniment` 为 `ResolvedScoreAudio`（含 `url`、`file`）
- 拉伸**只改框**尺寸；固有宽高不变；反过来宿主改 `musicScore.width/height`（如右键「高度修改」）时，框按当前显示比例跟着伸缩、内容左上角不动（`syncScoreFrame`，在 `Score.vue` 里监听；有裁剪则保留裁剪，超出新范围才截断）；`Score.vue` 用 CSS `translate + scale` 把可见区域（crop 或整份）铺满框
- `Score.vue` 接入 `dr-title` / `dr-lyrics` / `drPlayHighlight`（固定 show；高亮走 extensions.on）；有 `score.skin` 则从缓存读 JSON 传给 musicScore；播放：`dr-play` + `NPlayer`
- 页面 edit 只动放置框；曲谱内容在 SJWPDF 内不可编辑
- 播放：SJWPDF 暴露 `play` / `playAccompaniment` / `playVocal` / `pause` / `stop`（三者互斥）/ `addToneColor` / `setToneColorName` / `setBpm` / `getPlayer` / `getAPlayer`；`play` 默认 `PLAY_SMOOTH_ENVELOPE`
- 选段播放：`play(scoreIndex, { range: { startNoteId, endNoteId } })`，裁剪交给 dr-play `range`（规则见 `doc/曲谱范唱伴奏.md`）；range 不同不续播、从头播选段
- 选段模式：`startRangeSelect(scoreId, initial?)` / `endRangeSelect()` / `clearRangeSelect()` / `getRangeSelect()`；状态只在内存（`ScoreRangeSelect`），换页自动结束。开启后该曲谱音符可点：第 1 下起点、第 2 下终点、第 3 下重设起点；每次变化发 `rangeChange`（`ScoreRangeChangePayload`）。起止音符加 `sjw-range-start`（绿）/ `sjw-range-end`（蓝）高亮；选段期间该曲谱的编辑框隐藏、不可拖。`play` 不会自动读选段，宿主传 `getRangeSelect()`
- 伴奏高亮：`slot.data.accompaniment: number[]`；范唱：`slot.data.vocalPerformance: number[]`（与 dr-time-offset 展平一致）

### 裁剪（图片 + 曲谱）

- 数据：`crop?: SCropRect = {x, y, width, height}`，**源坐标**（图片 = 原始像素，曲谱 = musicScore 坐标）；框只显示这块并拉伸铺满；裁到整份源时删掉 `crop`
- API：`cropImage(id, {startX, startY, endX, endY}, {keepFrame?})`（async，缺原始尺寸先读资源）/ `cropScore(...)` / `clearCrop(id)`；起止先后不限，超出源范围截断
- 默认保持当前显示比例，框随之变小，裁出的区域中心在页面上不动（含旋转）；`keepFrame: true` 框不动、拉伸铺满
- 渲染：图片 = 嵌套 `<svg viewBox=crop>` 包整图；曲谱 = `Score.vue` 内层 transform；导出按同一规则取源区域
- 裁剪模式：`startCrop(id?)`（默认选中项）/ `endCrop()` / `getCropTarget()` + 事件 `cropModeChange`；框变橙、不能旋转，四角 nw/ne/se/sw 分别改 起点xy / 终点x+起点y / 终点xy / 起点x+终点y，对角与内容不动，可外拖恢复；整份源虚线框 + 裁掉部分蒙白（`EditFrame` 的 `cropSource` prop，内容组件在裁剪模式下画整份源）；Esc / Enter / 选中别的 / 换页 / 切 show / 开始绘制或选段退出；右键内置「裁剪」/「完成裁剪」
- 细节见 `doc/导出与裁剪.md`

### 导出（图片 zip / PDF）

- **不截 DOM**：`renderPageToCanvas` 按数据逐层画 canvas（白底 → 背景 → 曲谱 → 元素 → page.drawings），所有页都能导，编辑框 / 选中态不会进去
- 曲谱：离屏挂载 renderer（扩展与插槽配置同 `Score.vue`，来自 `render/scoreDisplay.ts`），克隆 svg、内联计算样式；**`foreignObject` 必须按布局转成 svg**（dr-title 展示行就用了），否则画进 canvas 会污染画布、导出失败
- 文本按 `ElementNode` 的 CSS 规则手动排版（padding 4/8、行高 1.3、垂直居中、空白合并、break-word）；改文本样式时两边一起改
- 视频画首帧（取不到画黑底三角）；**音频不导出**；show 教学标注不导出
- PDF：自写最小 PDF（`pdfWriter.ts`），每页一张图，页面尺寸 = 逻辑 px × 0.75pt；默认无损（RGB + zlib），`imageType: 'jpeg'` 更小
- 图片：只导一页时直接返回 png/jpeg；多页才打 zip（`01.png`…按页码补零），`type: 'jpeg'` 可选

## 渲染结构

每页自下而上（`Page.vue`）：

1. **背景 div** — 白底；有图则 `<img>` + `object-fit: fill` 拉伸铺满（`background.src` → resolveSrc）
2. **svg** — `viewBox` 与页面宽高一致，`preserveAspectRatio="none"`；内挂 `scores` 再 `elements`
3. **持久绘制 canvas** — `page.drawings`；默认 `pointer-events: none`；**edit** 下 `startDraw` 后可画

SJWPDF 内容区之上（`SJWPDF.vue` → `AnnotateLayer.vue`）：

4. **教学标注 canvas** — 仅 **show** 显示；铺满 SJWPDF 内容区（可画到白板外）；同套绘制 API；不序列化

模式 `mode: 'show' | 'edit'`：

- `show`：无编辑框；可开教学标注层
- `edit`：`EditFrame` 显示；选中后四角拉伸 + 顶中旋转；内容区可拖移（音频 / 视频靠边框，避免挡控件）；持久绘制

缩略图：外部用 `page.thumbnail`（文件名/http）或缩放挂载 `Page`（`thumbnail` prop）。**不要**在 SJWPDF 内做侧栏。

## 资源与 .sjw

包内扁平：

```
work.json
21546134543.png
….mp3
```

- 缓存：`id → { id, name, file }`（`loadAsset`）；每条必须有自定义 `name`
- zip 内文件名 = id；`work.json.assetNames` 持久化名称
- 放到页面：按 id（缓存没有则失败）或 `*FromFile`（内部先 loadAsset）
- `src` / `background.src` / `thumbnail`：id 走 `resolveSrc`；http(s)/data: 原样
- `removeAsset(id, { removeUsages })`：默认被引用则拒绝
- `loadSjw` / `exportSjw`：`parseSjw` / `buildSjwBlob`（fflate）

## SJWPDF 对外契约

Props：`data: SJW`、`pageIndex: number`、`mode?: 'show'|'edit'`、`contextMenu?: ElementContextMenuItem[]`

Expose（宿主 `ref` 调用）大致包括：

- 选中：事件 `selectionChange(SjwSelection)`（选中 / 取消 / 换页 / 切 show / 选中项被删都会触发；只在目标对象变化时发，改属性不重复发）+ `getSelection()` / `clearSelection()`；`SjwSelection = {kind:'score', score} | {kind:'element', element} | null`，对象是 data 里的原对象；show 模式恒为 null。选中 id 存在 `Page.vue`（`selectionChange` 发 id、换页清空），SJWPDF 按当前页解析成对象
- 页面：`addPage` / `insertPage` / `removePage`
- 背景：`setBackground` / `setBackgroundFromFile` / `clearBackground`
- 元素：`addText` / `addImage` / `addImageFromFile` / `addAudio` / `addAudioFromFile` / `addVideo` / `addVideoFromFile` / `removeElement`
- 元素右键：prop `context-menu` + 事件 `beforeContextMenu`（打开前改 props）；内置删除仅 edit；整区拦截浏览器右键；见 `doc/右键菜单.md`
- 曲谱：`addScore` / `removeScore`
- 裁剪：`cropImage` / `cropScore` / `clearCrop`（当前页）；按复谱表：`cropScoreByGrandStaff(id, from, to, {keepY?})`（0=标题，1..n=第几个复谱表；`keepY: true` 钉死框 x/y）/ `getScoreVerticalBands(id)`；裁剪模式 `startCrop` / `endCrop` / `getCropTarget`，事件 `cropModeChange`
- 绘制：`startDraw` / `endDraw` / `setTool(tool, options?)` / `clearDrawings` / `clearAnnotations` / `isDrawing` / `getTool`（edit→持久层；show→教学标注）
- 选段：`startRangeSelect` / `endRangeSelect` / `clearRangeSelect` / `getRangeSelect`；事件 `rangeChange`
- 播放：`play(scoreIndex?, { range? })` / `playAccompaniment` / `playVocal` / `pause` / `stop` / `addToneColor` / `setToneColorName` / `getToneColorName` / `setBpm` / `getBpm` / `getPlayer` / `getAPlayer` / `getPlaybackMode`；曲谱 `play` 默认 `PLAY_SMOOTH_ENVELOPE`；NPlayer 序列 `data` 带 dr-play 的 `lyric`（有歌词才有）；音色按单谱表：`singleStaff.data.instrumentValue` 优先，缺省用 `setToneColorName` 的默认音色（需都已 `addToneColor`）
- 资源：`loadAsset` / `listAssets` / `removeAsset` / `resolveSrc` / …
- IO：`loadSjw` / `exportSjw` / `exportImages({pages?, scale?, type?, filename?, onProgress?})`（单页图片 / 多页 zip）/ `exportPdf({pages?, scale?, imageType?, filename?, onProgress?})` / `exportPageImage(pageIndex?, options?)`

纯函数也从包入口导出（`addScore`、`parseSjw` 等），改行为时 **组件 expose 与 `api/*` 保持一致**。

## 开发规范（后续改动请遵守）

1. **职责边界**：侧栏、路由、全局工具栏放宿主；本包只做页内容 + 资源缓存 + 放置交互。
2. **曲谱 vs 多媒体**：曲谱进 `scores` + `Score.vue`；多媒体进 `elements` + `ElementNode.vue`。
3. **几何**：禁止改成「左上角旋转」或「对侧固定拉伸」等另一套模型，除非同步改本文与 `EditFrame` 注释。
4. **图片尺寸**：添加时读原始宽高写入框；拉伸改框，不改源文件。
5. **音频 / 视频 UI**：必须可随框缩放（自定义 `AudioPlayer` / `VideoPlayer`）。拉伸只改框。
6. **svg 绝对布局**：页面与曲谱相关 svg 使用 `preserveAspectRatio="none"`，viewBox 与逻辑宽高一致。
7. **导出入口**：新 API / 类型务必更新 `src/index.ts`。
8. **测试**：优先在 `@deciphony/test` 的 `workTest.vue` 验证；Vite 通过 alias 指到 work / renderer 源码。
9. **文档**：行为变更时同步 `doc/页面渲染结构.md`、`doc/文件加载.md` 与本文「必须遵守」段落。

## 未做 / 预留（勿假装已完成）

- 背景图资源
- 曲谱框内的记谱编辑（应走 renderer 扩展 / 独立编辑流）
- http 资源的缓存与离线打包策略
- 多页连续滚动（当前一页一显）
- 绘制层：更多工具、压感、撤销栈（当前仅 pen / eraser；持久 drawings + show 教学标注内存层）
- 矢量 PDF / 可选中文字（当前每页一张位图）- 导出时曲谱 / 页面里的 web 字体：svg 画成图片后取不到页面 @font-face，文字回退系统字体（Bravura 符号是 path，不受影响）

## 相关文档

- `doc/功能文档.md` — 产品目标
- `doc/页面渲染结构.md` — 布局与模式
- `doc/文件加载.md` — sjw 格式
- `doc/曲谱范唱伴奏.md` — 范唱/伴奏使用逻辑
- `doc/右键菜单.md` — 元素/曲谱右键
- `doc/导出与裁剪.md` — 图片 zip / PDF 导出、裁剪
- `依赖关系.md` — renderer / player
- 宿主：`packages/deciphony-test/src/views/workTest.vue`
