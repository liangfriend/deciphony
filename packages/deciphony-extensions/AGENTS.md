# @deciphony/extensions — Agent 速读

## 定位

`@deciphony/renderer` 的扩展集合（原 `@deciphony/test/src/views/dr-extensions`）。  
宿主通过包名引用，**不要**再把扩展源码拷进业务仓库。

## 子路径

| Import | 内容 |
|--------|------|
| `@deciphony/extensions/dr-title` | 标题扩展；左侧三块独立：调号 / 拍号 /（beatUnit+bpm），有顶层属性才显示；作者 `author` 可用 `\n` 换行（编辑态 textarea 回车换行，展示时逐行右对齐、去空行）；可选 `fontFamily` |
| `@deciphony/extensions/dr-lyrics` | 歌词扩展；`LyricsSlot` 优先 `inject(DR_ROW_VDOMS_KEY)` 只用本行 vDom，不要扫全谱；可选 `fontSize` / `fontFamily` |
| `@deciphony/extensions/dr-instrument-name` | 乐器名扩展：挂 `s-l`，每个单谱表左侧显示 `singleStaff.data.instrumentName`，未设置时显示参数 `defaultInstrument`；`gap` 控制文本与曲谱间距；按首小节五线区域纵向居中，`\n` 换行 |
| `@deciphony/extensions/dr-edit` | 锚点增删谱表/小节；tab4/tab6 共用音符 API（品、弦位、拍弦、推弦、连音线类型）；新建 tab 谱默认 `ClefTypeEnum.Tab`（仅展示） |
| `@deciphony/extensions/dr-edit/score-builder` | 工厂 / 插入删除 / 定位；`createMusicScore` 默认带小节号 `measureNumber`（`createMeasureNumber`，不带括号；传 `measureNumber: false` 不加，传对象可设 `bracket` / Frame）；单 slot 附属 `createArpeggio` / `createStrumming` / `createPreludeBracketLeft` / `createPreludeBracketRight`（前奏括号 `(` / `)`）；双 slot 附属 `createPedal` / `createPitch` / `createTrill`（`TrillTypeEnum`）/ `createHairpin`（`HairpinTypeEnum`）；未显式 `beamType` 时按四分拍 onset 自动 `OnlyRight`/`Combined`/`None`；`tabNote.ts` 为吉他/尤克里里；鼓谱 `createDrumNote` / `insertDrumNote` / `appendDrumNote` 可带 `graceNotes` / `graceNotesAfter`（index0 最靠主音，默认八分、多颗默认连杠，符干方向随声部） |
| `@deciphony/extensions/dr-play` | 播放序列；指板类按 `MusicScore.type`（`Guitar` / `Ukulele` / `Bass4` / `Bass5` / `Bass6`）选空弦表 + 品；**音色**：`item.toneColor` ← `staff/score.data.instrumentValue`，泛音优先 `data.instrumentValue_harmonic`（曲谱 data 优先）再降级基础键；后续技巧同形 `instrumentValue_xxx`；鼓谱用 `drumMap`；缺省 `defaultToneColor`（`'piano'`）；**选段**：`options.range: {startNoteId, endNoteId}` / `cropDrPlaySequence(seq, range)`（`range.ts`）：note_id 比 `:` 前部分，起点 = 起始音符首次出现，终点 = 其后结束音符首次出现（整和弦保留），起止颠倒自动交换，playTime 减去起点；跨起点的延音链剩余时长移给首个保留的后续项，跨终点的链头截到结束和弦结束 |
| `@deciphony/extensions/dr-play-highlight` | 播放高亮（`drPlayHighlight` → `:extensions`，`on.renderMusicScore`）；按 `info.lookup` 找音符部件 |
| `@deciphony/extensions/dr-time-offset` | 谱音同步（`TimeOffsetEditor`；反复展开 + `data[timeProp]: number[]` 遍次） |
| `@deciphony/extensions/dr-musicxml-transfer` | MusicXML ↔ MusicScore。导入：`musicXmlFileToMusicScore(file)`（.xml/.musicxml/.mxl，返回 `{musicScore, warnings}`）或 `xmlToMusicScoreWithWarnings(xmlJson)`；`xmlRead.ts` 读成中间结构 → `xmlToMusicScore.ts` 组装五线谱。导出：`musicScoreToXml(score, {target?})`，`target` 默认 `'ms4'`（`version="4.0"`），传 `'ms3'` 则 `version="3.1"`（给 MuseScore 3）；beam 等记谱规则不变。识别不了的符号跳过并记 warning，只有不是 MusicXML 才抛错。限制：每谱表单声部（其它声部同时值并和弦、否则丢弃）；无连音结构（按记谱时值显示，小节会超长）；无八度谱号（按记谱音高画）；小节中间换调号按小节头处理 |
| `@deciphony/extensions/dr-midi-transfer` | MIDI ↔ MusicScore（自写 SMF 读写）；**依赖 dr-play、dr-edit、score-util**（见 `src/dr-midi-transfer/依赖关系.md`）；导出基于 `getDrPlaySequence`，每谱表一轨；导入为五线谱（量化、和弦、延音线、小节内变音记忆） |
| `@deciphony/extensions/dr-midi-record` | MIDI 实时录制 → 钢琴大谱表（高音 + 低音两单谱表）：`createMidiRecorder({bpm, timeSignature, measuresPerLine, onAppend})` → `start` / `noteOn` / `noteOff` / `stop`（返回 MusicScore，原地维护）；`onAppend` 每写入一组音 / 一段休止回调（谱表、小节、slot 下标、延音线 id）；`connectWebMidi` 接浏览器 MIDI；容错：`quantize`（最小音符）/ `beatSnap`（起音吸拍点）/ `minRest`（短空档并入前音）/ `latencyMs`；预备拍：`startDelayMs` + `earlyToleranceMs`（起点前半拍内按下算第一拍）；和弦窗口 + 左右手分配规则见 `src/dr-midi-record/规则.md`；依赖 dr-edit、dr-midi-transfer（`spell` / `glyphFor`） |
| `@deciphony/extensions/dr-mark` | 标记扩展：`drMark({type, flute | ocarina | xiao, staves?, scale?, color?})`（每种 type 带专属参数，类型上强制） → `:extensions`，挂 `m-d`（高度由扩展 slotConfig 给出，曲谱 `height` 宿主留够）。只看每个 noteSlot 的第一个音符；音高复用 `getDrPlaySequence`（调号 / 小节变音 / 八度记号都算上）。笛子：`type: 'flute'` + `flute.key` 必填（`G` 大G / `A` / `bB` / `C` / `D` 筒音 A4 / `E` / `F` / `highG` 小G），没有默认调；按「实际音高 − 筒音」查 `FLUTE_FINGERINGS`（筒音作 5 记唱名，x 按 / o 开 / h 半孔；0..31，以 `dr-mark/doc/笛指法.md` 为准），圆角矩形外框，框内上方小点 = 超吹层级（无点平吹 / 1 点超吹 / 2 点高音超吹）；`flute.fingerings` 覆盖；延音线后半同音默认不画。各指法表在 `*/fingering.ts` 注释里标了资料出处，改数据先对照出处；资料里没有的音不要编，留空（显示「?」）。陶笛：`type: 'ocarina'` + `ocarina.model`（`transverse12` 12 孔日式，正面 8 主孔 + 2 副孔（右食旁 / 右中旁）+ 背面 2 拇指孔 / `pendant4` 4 孔英式吊坠，只有正面）+ `ocarina.key`（`AC` / `AF` / `AG` 中音，`SC` / `SF` / `SG` 高音，`BC` 低音）都必填；按「实际音高 − do」查 `OCARINA_FINGERINGS`（12 孔 −3..17，孔序 左食 左中 左无名 左小 右食 右中 右无名 右小 | 右食副 右中副 | 左拇 右拇；4 孔 0..12，孔序 左食 左中 右食 右中，#fa / #sol / #la 暂缺），单张图、吹口朝下：12 孔为圆角三角形（尖端朝上），左右两列孔，背面 2 拇指孔画在机身底部两侧；4 孔吊坠为椭圆；外形与孔位在 `ocarina/geometry.ts`。箫：`type: 'xiao'` + `xiao.model`（`hole8` 八孔箫 背 1 + 正 7，指法以 `dr-mark/doc/萧指法.md`（G 调标准）为准，0..34 / `hole6` 六孔箫 背 1 + 正 5，0..31）+ `xiao.key`（12 个调 `C` / `bD` / … / `G` 筒音 D4 / … / `B`，筒音作 5，以 G 调为基准平移，筒音落在 G3–#F4）都必填；按「实际音高 − 筒音」查 `XIAO_FINGERINGS`（holes 首字符 = 背孔，之后正面从上到下），只画一张圆角矩形图（上方超吹圆点）：背孔（第八孔）画在正面最上一孔之上一行并左偏，八孔箫最下一孔（第一孔）也左偏。新类型：`types.ts` 加 `DrMarkType` 与 `DrMarkOptions` 联合分支（专属参数）+ `index.ts` 的 `markSlotHeight` + `MarkSlot.vue` 分支 |
| `@deciphony/extensions/dr-score3d` | 3D 曲谱可视化（依赖可选 peer `three`，不进根 barrel）。`toSingleLineMusicScore(score, {width?, height?})`（`singleLine.ts`）：多个复谱表合并成一个，第 i 个单谱表按行拼接小节，缺谱表 / 小节数不齐补空小节；换行处重复的谱号 / 调号 / 拍号提示去掉（行末 clef_b + 行首同类 clef_f 留 clef_b；行末 key/time_b + 行首同类 _f 留 _f；行首与生效值相同的 _f 删）；宽度缺省 = 原宽 × 行数；id 不变。`Score3D.vue`：单行谱交给 renderer `musicScore` 在不可见容器（真实布局，`opacity:0`）里渲染，`renderMusicScore` 后按 vDom 底边撑开高度，再 rAF + nextTick 调 `buildScoreObject3D`（`svgToObject3D.ts`）：按 DOM 顺序取 `getScreenCTM` 相对根 svg 的矩阵和计算样式，填充经 `SVGLoader.createShapes`，描边自己拆成线段矩形（支持虚线 / linecap）以便挤出，相邻同色同透明度合并成一个网格；`<text>` 栅格化成贴图贴平面（按 svg 片段缓存、跨重建复用）；不支持 image / use / 渐变 / 裁剪 / 滤镜。场景：组 `scale.y = -1`，世界 (x, −y) = 曲谱 (x, y)，z 朝向观察者；`depth` > 0 挤出用 MeshStandardMaterial + 对数深度缓冲，层间 z 间隔 0.02；`depth` = 0 平面用 MeshBasicMaterial、`depthWrite:false` 按 renderOrder 叠放；纸张为曲谱背后的长方体（正面 z = −0.5）。相机：OrbitControls（damping），按需渲染；props `background` / `camera` / `controls` / `depth` / `color` / `paper` / `textResolution` / `singleLine`；expose 见 `types.ts` 的 `Score3DExpose`（`setCamera` 可过渡 / `getCamera` / `resetCamera` / `fitView` / `focusX` / `setBackground` / `setControls` / `scoreToWorld` / `getBounds` / `rebuild` / `toDataURL` / three 原生对象 getter）。每次曲谱重绘都整份重建网格，播放高亮这类高频重绘不适合；样式全部内联（宿主不引 css 也能用）；演示页 test `score3dTest.vue` |
| `@deciphony/extensions/dr-numberNotation-transfer` | 五线↔简谱 |
| `@deciphony/extensions/dr-quick-numberNotation` | 简谱快速打谱文本 ↔ 简谱 MusicScore（规则 + 实现约定见 `src/dr-quick-numberNotation/规则.md`）：`parseQuickNumberNotation`（文本 → 中间结构）、`quickNumberNotationToMusicScore`（文本 → 谱，返回 `{musicScore, warnings}`）、`musicScoreToQuickNumberNotation`（仅简谱 → 文本）；`<` `>` 按复谱表内谱表下标跨行配对成连音线；演示页 test `quickNumberNotationTest.vue` |
| `@deciphony/extensions/chord-builder` | 和弦图编辑器（`ChordBuilder`，props: `chord: tabChord`，可选 `disabled?: ChordBuilderDisabledField[]`） |
| `@deciphony/extensions/audio-to-score` | 浏览器端单声部音频分析，输出 standardStaff MusicScore；不支持多声部混音 |
| `@deciphony/extensions/score-util` | 音高/调号工具（含 `transposeMusicScore` 同谱种转调）；`getPlayMeasureIndexes` 展开反复（dr-play / dr-time-offset / MIDI 导出 / `mergeGrandStaff` 共用）：volta `value` 从 0 起（0 = 第一遍）；跨行拆成多段的房子（前段 `openRight`、后段 `openLeft`、首尾小节相邻）先拼成一段再判断，结尾小节须是反复结束线才参与跳转 |
| `@deciphony/extensions` | 根 barrel（不含 dr-edit，避免与 score-builder 同名冲突） |

## 本地 alias（@deciphony/test）

```ts
'@deciphony/extensions': path.resolve(__dirname, '../deciphony-extensions/src')
```

Vite 会把 `@deciphony/extensions/dr-title` 解析到 `src/dr-title`。

## 依赖

peer：`vue`、`@deciphony/renderer`；MusicXML 另需 `fast-xml-parser`、`xmlbuilder`；`dr-score3d` 另需可选 peer `three`（≥ 0.160，构建时 external）。dependencies：`fflate`（解 .mxl）。

## 规范

- 新扩展：在 `src/` 下新增目录 + `index.ts`，并更新本文件与 `readme.md`、根 `package.json` exports
- 内部交叉引用用相对路径；对宿主只暴露子路径
- `editHelper` 等宿主 UI 留在 test，不要塞进本包
- 事件监听走扩展 `on`（如 `renderMusicScore`），不要在宿主组件上再挂一份同名 `@renderMusicScore`（除非宿主另有用途）
- `renderMusicScore(list, info)`：`info.lookup` 按 targetId 查找；插槽组件 `inject(DR_ROW_VDOMS_KEY)` 拿本行节点；宿主保存 vDom 列表用 `shallowRef`
