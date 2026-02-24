# deciphony-renderer 扩展测试

本目录为 deciphony-renderer 曲谱组件的专用测试入口，每个扩展一个子文件夹。

## 架构

- **useDrRenderCore.ts**：核心 composable，提供共享状态（msRef、musicScoreData、highlightTargetId）与事件分发
- 各扩展通过 `registerPointerDown` / `registerPointerMove` / `registerPointerUp` / `registerRenderMusicScore` 注册处理函数
- 多扩展可同时注册，事件触发时按注册顺序依次执行

## 结构

```
dr-render-extensions/
├── README.md              # 本说明
├── useDrRenderCore.ts     # 核心：共享状态 + 事件注册
├── dr-edit/               # 曲谱编辑扩展
│   ├── index.vue          # 测试页（核心 + 扩展 + 插槽）
│   └── useDrEdit.ts       # 编辑逻辑，向核心注册 handler
└── [未来扩展]/            # 如：dr-lyrics、dr-annotate，各自注册即可
```

## 复用与迁移

1. 创建扩展子目录，编写 `useDrXxx(core)`，内部调用 `core.registerPointerDown` 等
2. 在页面中：`const core = useDrRenderCore(...)` → `useDrEdit(core)` → `useDrLyrics(core)` ...
3. 模板使用 `core` 的 msRef、musicScoreData、highlightTargetId 及事件函数
