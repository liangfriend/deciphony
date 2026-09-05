# @deciphony/work

sjw 课件展示与产出：单页内容区渲染、多媒体/曲谱放置、资源缓存、`.sjw` 导入导出。

## 文档

| 文档 | 用途 |
|------|------|
| [AGENTS.md](./AGENTS.md) | **给 Agent / 后续开发的规范与架构**（优先阅读） |
| [doc/功能文档.md](./doc/功能文档.md) | 产品能力 |
| [doc/页面渲染结构.md](./doc/页面渲染结构.md) | 三层布局与编辑模式 |
| [doc/文件加载.md](./doc/文件加载.md) | sjw zip 与资源映射 |
| [依赖关系.md](./依赖关系.md) | 与 renderer / player |

## 快速使用

```vue
<SJWPDF ref="pdf" :data="sjw" :page-index="0" mode="edit" />
```

缩略图栏由宿主自己做；通过 `ref` 调用 `loadAsset` / `addImage` / `setBackground` / `exportSjw` 等。

本地验证：`packages/deciphony-test` → `workTest.vue`。
