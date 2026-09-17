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
  src/
    index.ts                对外导出（改 API 必改这里）
    types/types.ts          SJW / SPage / SElement / SScore / DrawStroke
    enums/drawToolEnum.ts   DrawToolEnum（pen / eraser）
    constants/elementDefaults.ts   非图片默认宽高
    api/elements.ts         addText / addImage / addAudio / addVideo
    api/scores.ts           addScore / removeScore
    api/pages.ts            addPage / insertPage / removePage
    draw/paintStrokes.ts    笔迹重绘（含橡皮 destination-out）
    assets/                 资源缓存、sjw 导入导出、图片尺寸
    components/
      SJWPDF.vue            内容区入口 + expose API + 资源缓存
      Page.vue              单页三层；挂 scores + elements + 绘制层
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
| `image` | `src` = **资源缓存 id**；`addImage({assetId})` 或 `addImageFromFile`；原始像素写 width/height |
| `audio` | 同上；`addAudio` / `addAudioFromFile`；默认 `DEFAULT_AUDIO_*`；必须用 `AudioPlayer` |
| `video` | 同上；`addVideo` / `addVideoFromFile`；原始像素写 width/height（读不到则 `DEFAULT_VIDEO_*`）；必须用 `VideoPlayer` |
| `text` | 默认 `DEFAULT_TEXT_*`；双击 → 等大 textarea |

背景：`background.src` = 资源 id；`setBackground(id)` / `setBackgroundFromFile` / `clearBackground`。无背景时白底。替换或清除时，旧背景资源若已无引用则从缓存删除（防反复换图撑爆存储）。

### drawings（绘制层笔迹）

```ts
page.drawings?: DrawStroke[]  // { tool, color?, lineWidth, points: [x,y][] }
```

- 透明 canvas；橡皮：`destination-out`
- 持久化在 **work.json**（随 `.sjw` 导入导出），不是独立资源文件
- SJWPDF：`startDraw` / `endDraw` / `setTool(tool, { color?, lineWidth? })` / `clearDrawings`
- 工具枚举：`DrawToolEnum.Pen` | `DrawToolEnum.Eraser`；仅 `startDraw` 后 canvas 才接收指针
- `setTool` 第二参数：笔触等选项，目前支持 `lineWidth`（笔触宽度）、`color`（仅笔）

新增多媒体类型：先扩 `types.ts` + `api/elements.ts` + `ElementNode.vue`，默认尺寸放 `elementDefaults.ts`。

### scores（独立迭代）

```ts
SScore = SElementBase & {
  musicScore: MusicScore
  vocalPerformance?: ScoreAudioRef  // { src, name, author? }
  accompaniment?: ScoreAudioRef
}
// ScoreAudioRef.src = zip 根目录唯一文件名（资源缓存 id）
```

- `addScore`：框的 `width/height` ← `musicScore.width/height`；`musicScore` 用 `structuredClone`
- 范唱/伴奏：见 `doc/曲谱范唱伴奏.md`（`loadAsset` → score 存 `src`；播放互斥；删曲谱清孤儿音频）
- 右键曲谱：`ctx.vocalPerformance` / `ctx.accompaniment` 为 `ResolvedScoreAudio`（含 `url`、`file`）
- 拉伸**只改框**尺寸；固有宽高不变；`Score.vue` 用 CSS `scale` 铺满
- `Score.vue` 接入 `dr-title` / `dr-lyrics` / `drPlayHighlight`（固定 show；高亮走 extensions.on）；播放：`dr-play` + `NPlayer`
- 页面 edit 只动放置框；曲谱内容在 SJWPDF 内不可编辑
- 播放：SJWPDF 暴露 `play` / `playAccompaniment` / `playVocal` / `pause` / `stop`（三者互斥）/ `addToneColor` / `setToneColorName` / `setBpm` / `getPlayer` / `getAPlayer`；`play` 默认 `PLAY_SMOOTH_ENVELOPE`
- 伴奏高亮：`slot.data.accompaniment: number[]`；范唱：`slot.data.vocalPerformance: number[]`（与 dr-time-offset 展平一致）

## 渲染结构

每页自下而上三层（`Page.vue`）：

1. **背景 div** — 白底；有图则 `<img>` + `object-fit: fill` 拉伸铺满（`background.src` → resolveSrc）
2. **svg** — `viewBox` 与页面宽高一致，`preserveAspectRatio="none"`；内挂 `scores` 再 `elements`
3. **绘制 canvas** — 透明笔迹层；默认 `pointer-events: none`；`startDraw` 后可画；数据在 `page.drawings`

模式 `mode: 'show' | 'edit'`：

- `show`：无编辑框
- `edit`：`EditFrame` 显示；选中后四角拉伸 + 顶中旋转；内容区可拖移（音频 / 视频靠边框，避免挡控件）

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

- 页面：`addPage` / `insertPage` / `removePage`
- 背景：`setBackground` / `setBackgroundFromFile` / `clearBackground`
- 元素：`addText` / `addImage` / `addImageFromFile` / `addAudio` / `addAudioFromFile` / `addVideo` / `addVideoFromFile` / `removeElement`
- 元素右键：prop `context-menu` + 事件 `beforeContextMenu`（打开前改 props）；内置删除仅 edit；整区拦截浏览器右键；见 `doc/右键菜单.md`
- 曲谱：`addScore` / `removeScore`
- 绘制：`startDraw` / `endDraw` / `setTool(tool, options?)` / `clearDrawings` / `isDrawing` / `getTool`
- 播放：`play` / `playAccompaniment` / `playVocal` / `pause` / `stop` / `addToneColor` / `setToneColorName` / `getToneColorName` / `setBpm` / `getBpm` / `getPlayer` / `getAPlayer` / `getPlaybackMode`；曲谱 `play` 默认 `PLAY_SMOOTH_ENVELOPE`
- 资源：`loadAsset` / `listAssets` / `removeAsset` / `resolveSrc` / …
- IO：`loadSjw` / `exportSjw`

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
- 绘制层：更多工具、压感、撤销栈（当前仅 pen / eraser + drawings 向量持久化）

## 相关文档

- `doc/功能文档.md` — 产品目标
- `doc/页面渲染结构.md` — 布局与模式
- `doc/文件加载.md` — sjw 格式
- `doc/曲谱范唱伴奏.md` — 范唱/伴奏使用逻辑
- `doc/右键菜单.md` — 元素/曲谱右键
- `依赖关系.md` — renderer / player
- 宿主：`packages/deciphony-test/src/views/workTest.vue`
