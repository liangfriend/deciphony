# VDom 层级、插槽与符号规范

本文档整理 deciphony-renderer 中 vDom 的结构、默认 zIndex 层级、插槽类型及符号类型。

---

## 1. 默认 zIndex 层级

最终 vDom 数组会按 `zIndex` 升序排序后渲染，**数值越大越靠上**。各节点类型的默认 zIndex 如下。

### 1.1 按 zIndex 分组

| zIndex | tag / 类型 | 说明 |
|--------|------------|------|
| 1000 | slot | 除 m 外的所有插槽（t, g, g-l, g-r, g-u, g-d, s, s-l, s-r, s-u, s-d, m-u, m-d, e），未配置时 `getSlotZIndex` 返回 1000 |
| 1000 | space | 边距、留白（复谱表/单谱表上/下边距等） |
| 1000 | measure | 小节五线背景 |
| 1100 | slot (m) | 小节插槽 m（覆盖在小节上），未配置时 `getSlotZIndex` 返回 1100 |
| 1200 | clef_f, clef_b | 前置/后置谱号 |
| 1200 | keySignature_f, keySignature_b | 前置/后置调号 |
| 1200 | timeSignature_f, timeSignature_b | 前置/后置拍号 |
| 1200 | barline | 小节线 |
| 1200 | rest | 休止符 |
| 1200 | noteHead | 音符头 |
| 1200 | noteStem, noteTail | 符干、符尾 |
| 1200 | addLine | 上加线、下加线 |
| 1200 | accidental | 变音符号、附点 |
| 1200 | affiliation | 连音线(slur)、反复房子(volta) |
| 1200 | noteBeam | 符杠 |

### 1.2 按 tag 的默认 zIndex 速查表

| tag | 默认 zIndex |
|-----|-------------|
| slot | 1000（m 插槽为 1100，均可通过 slotConfig 覆盖） |
| space | 1000 |
| measure | 1000 |
| clef_f, clef_b | 1200 |
| keySignature_f, keySignature_b | 1200 |
| timeSignature_f, timeSignature_b | 1200 |
| barline | 1200 |
| rest | 1200 |
| noteHead | 1200 |
| noteStem | 1200 |
| noteTail | 1200 |
| addLine | 1200 |
| accidental | 1200 |
| affiliation | 1200 |
| noteBeam | 1200 |

---

## 2. 插槽（Slot）

插槽的 `tag` 均为 `'slot'`，`slotName` 和 `targetId` 标识具体插槽。

### 2.1 插槽列表

| slotName | targetId 格式 | slotData | 说明 |
|----------|---------------|----------|------|
| t | `t` | 无 | 顶部插槽，h = topSpaceHeight |
| g | `g-{grandStaffId}` | GrandStaff | 复谱表（含外边距） |
| g-l | `g-l-{grandStaffId}` | GrandStaff | 复谱表左侧 |
| g-r | `g-r-{grandStaffId}` | GrandStaff | 复谱表右侧 |
| g-u | `g-u-{grandStaffId}` | GrandStaff | 复谱表上方 |
| g-d | `g-d-{grandStaffId}` | GrandStaff | 复谱表下方 |
| s | `s-{staffId}` | SingleStaff | 单谱表（含外边距） |
| s-l | `s-l-{staffId}` | SingleStaff | 单谱表左侧 |
| s-r | `s-r-{staffId}` | SingleStaff | 单谱表右侧 |
| s-u | `s-u-{staffId}` | SingleStaff | 单谱表上方 |
| s-d | `s-d-{staffId}` | SingleStaff | 单谱表下方 |
| m | `m-{measureId}` | Measure | 小节主体（覆盖小节区域） |
| m-u | `m-u-{measureId}` | Measure | 小节上方 |
| m-d | `m-d-{measureId}` | Measure | 小节下方 |
| e | `e` | 无 | 底部插槽（需 slotConfig['e'].h > 0） |

### 2.2 插槽布局（纵向）

```
顶部插槽 t
─────────────────────────────────────────
复谱表上边距 (space)
复谱表上方插槽 g-u
─────────────────────────────────────────
单谱表上边距-外 (space)
单谱表上方插槽 s-u
小节上方插槽 m-u（每个小节）
单谱表上边距-内 (space)
─────────────────────────────────────────
measure（小节五线背景） + 符号 + 小节插槽 m
─────────────────────────────────────────
单谱表下边距-内 (space)
小节下方插槽 m-d（每个小节）
单谱表下方插槽 s-d
单谱表下边距-外 (space)
─────────────────────────────────────────
复谱表下方插槽 g-d
复谱表下边距 (space)
─────────────────────────────────────────
底部插槽 e（可选）
```

### 2.3 插槽默认 zIndex

通过 `getSlotZIndex(config, name)` 获取：未配置时普通插槽为 **1000**，m 插槽（覆盖小节）为 **1100**。可用 `slotConfig` 覆盖，例如：

```ts
slotConfig = {
  'm': { w: 100, h: 0, zIndex: 1050 },
  'g-r': { w: 50, zIndex: 1000 },
}
```

---

## 3. 符号（Symbol）

符号由 `renderSymbol` 及符杠、附属符号逻辑生成。所有小节上的符号（含 slur、volta）zIndex 均为 **1200**。

### 3.1 小节内符号（按 x 方向顺序）

**前置：** clef_f → keySignature_f → timeSignature_f → 音符/休止符 → **后置：** clef_b → barline → keySignature_b → timeSignature_b

| tag | targetId | 说明 |
|-----|----------|------|
| clef_f | measure.clef_f.id | 前置谱号 |
| keySignature_f | measure.keySignature_f.id | 前置调号 |
| timeSignature_f | measure.timeSignature_f.id | 前置拍号 |
| rest | note.id | 休止符 |
| noteHead | notesInfo.id | 音符头 |
| noteStem | notesInfo.id / note.id | 符干 |
| noteTail | notesInfo.id / note.id | 符尾 |
| addLine | note.id | 加线（上/下） |
| accidental | accidental.id / notesInfo.id | 变音符号 |
| clef_b | measure.clef_b.id | 后置谱号 |
| barline | measure.barline.id | 小节线 |
| keySignature_b | measure.keySignature_b.id | 后置调号 |
| timeSignature_b | measure.timeSignature_b.id | 后置拍号 |

### 3.2 附属型符号（跨音符/小节）

| tag | 说明 |
|-----|------|
| affiliation | 连音线(slur)、反复房子(volta) 等 |
| noteBeam | 符杠（由 processBeam 处理） |

### 3.3 布局型节点（非符号）

| tag | 说明 |
|-----|------|
| measure | 小节五线背景，zIndex 1000 |
| space | 边距、留白，zIndex 1000 |

---

## 4. 渲染组件分支（musicScore.vue）

vDom 按 `tag` 分流渲染：

| 条件 | 渲染组件 |
|------|----------|
| `!AFFILIATION_TAGS.has(tag)` | Group（皮肤包 SVG） |
| `AFFILIATION_TAGS.has(tag)` | `<g>` + Slur / Volta / Beam / slot |

`AFFILIATION_TAGS = ['slot', 'affiliation', 'beam', 'noteBeam']`

- **Group**：measure、clef、keySignature、timeSignature、barline、rest、noteHead、noteStem、noteTail、addLine、accidental、space 等
- **slot**：插槽内容由父组件具名插槽提供（#m, #g, #s 等）

---

## 5. 点击与 data 属性

点击时通过 `closest('[data-target-id][data-tag]')` 查找目标。需要同时具备 `data-target-id` 和 `data-tag` 才能被识别：

- **Group** 渲染的节点：自动注入 `data-target-id`、`data-tag`
- **slot 的父 g**：仅有 `data-target-id`，**无 `data-tag`**。点击 slot 区域时，若命中父 g，`tag` 可能为空，扩展层需兼容（如 `targetId` 以 `m-` 开头时仍视为小节选中）

---

## 6. VDomTagType 与 targetId 约定

常见 `tag` 见 `types/common.ts` 中 `VDomTagType`。`targetId` 约定：

- 插槽：`m-{id}`、`s-{id}`、`g-{id}` 等
- 小节级符号：对应 measure 上的对象 id（clef_f、barline 等）
- 音符：notesInfo.id（noteHead）、note.id（rest、部分 stem/tail）
