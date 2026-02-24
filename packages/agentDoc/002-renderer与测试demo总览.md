# 002 - deciphony-renderer 与测试 Demo 总览

> 日期：2025-02-24  
> 目的：Agent 快速定位 deciphony-renderer 曲谱组件及其测试入口

## 一、路径说明

| 概念 | 实际路径 | 说明 |
|------|----------|------|
| 曲谱渲染库 | `packages/deciphony-renderer/` | 五线谱 + 简谱展示组件 |
| 测试 Demo 应用 | `packages/deciphony-test/` | 所有插件的测试/演示应用 |
| renderer 的测试页 | `packages/deciphony-test/src/views/renderTest.vue` | 调用 music-score 的测试页 |
| Agent 文档 | `packages/agentDoc/` | 本目录，供 Agent 阅读与续写 |

## 二、deciphony-renderer 核心结构

```
packages/deciphony-renderer/
├── src/
│   ├── index.ts              # 导出 MusicScore 组件及类型
│   ├── components/
│   │   ├── musicScore.vue    # 主入口：接收 data，输出 VDom，渲染 SVG
│   │   ├── group.vue         # 符号渲染（从 skin 取 SVG）
│   │   ├── slur.vue          # 连音线
│   │   ├── volta.vue         # 反复记号
│   │   └── beam.vue          # 符杠
│   ├── standardStaff/        # 五线谱：musicScoreToVDom、mock、enums
│   ├── numberNotation/       # 简谱：同上结构
│   ├── types/                # MusicScore、VDom、Skin 等
│   ├── enums/                # MusicScoreTypeEnum 等
│   ├── skins/                # defaultSkin、defaultSkinRed、defaultSkinBlue
│   └── render/               # diffAndMergeVDom（注意：update.ts 已删，导入可能为死代码）
├── msSymbols/                # SVG 符号资源
└── doc/                      # 规范文档、任务记录等
```

## 三、renderTest.vue 测试 Demo 要点

- **入口组件**：`<music-score ref="msRef" :data="musicScoreData" />`
- **数据来源**：`import data from "../dr-plugins/happyBirthday"`（`packages/deciphony-test/src/dr-plugins/happyBirthday.ts`）
- **插槽**：`slot-config` 可配置（如 `{'g-r':{w:50}}`），模板中 `#g`、`#s` 等插槽用于扩展（歌词、高亮框等）
- **交互**：`pointerdown` / `pointermove` / `pointerup` 监听；点击识别 `data-target-id`，可高亮并拖拽音符头改 `region`
- **updateVDom**：`msRef.updateVDom(updater)` 用于局部更新 vDom（如切换 skinName 做高亮）

## 四、当前实现状态

- **五线谱（StandardStaff）**：已完成
- **简谱（NumberNotation）**：已完成
- **编辑扩展**：规划在 `dr-plugins/dr-edit/功能.md`，尚未实现

## 五、Agent 续写建议

1. 修改曲谱逻辑时，优先阅读 `001-代码结构理解.md` 了解数据流
2. 新增符号或插槽时，参考 `deciphony-renderer/doc/` 下规范
3. 测试改动时，在 `renderTest.vue` 中切换 `happyBirthday` 数据或添加用例
