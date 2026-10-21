<script setup lang="ts">
/**
 * 和弦弹唱谱内容区：只画歌词 + 和弦（标题 / 作者不画）。
 * 每个歌词单位上方预留一行放和弦；和弦比字宽时把这个字撑宽。
 * edit 模式：点字选中并弹出和弦选择；双击 / Enter 改整行文字；拖动和弦换位置（Ctrl / Alt 复制）。
 * 数据原地修改，每次修改后 emit change。
 */
import {computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, toRaw, watch} from 'vue'
import type {
  ClChord,
  ClLyric,
  ClLyricLine,
  ClSheetAddColors,
  ClSheetData,
  ClSheetMode,
  ClSheetSelection,
} from '../types'
import {COMMON_CHORDS, listChords} from '../chords'
import {
  isSameLyricLine,
  lyricLineCharCount,
  lyricLineText,
  retextLyricLine,
  splitLyricLine,
  textToLyricLine,
} from '../lyrics'
import ChordPicker from './ChordPicker.vue'

const props = withDefaults(defineProps<{
  data: ClSheetData
  mode?: ClSheetMode
  /** 歌词字号（px） */
  fontSize?: number
  /** 和弦字号（px），缺省 = fontSize × 0.8 */
  chordFontSize?: number
  /** 行间距（px） */
  lineGap?: number
  /** 内容区内边距（px） */
  padding?: number
  /** 歌词默认颜色（#rrggbb，编辑时取色器要用） */
  color?: string
  /** 和弦默认颜色（#rrggbb） */
  chordColor?: string
  /** 新加的字写入的歌词颜色（不影响已有内容），也可用 setAddColors 改 */
  addLyricColor?: string
  /** 新加的和弦写入的颜色（不影响已有和弦），也可用 setAddColors 改 */
  addChordColor?: string
  /** 选择器「常用」区的和弦 */
  commonChords?: readonly string[]
  /** 手输时的补全列表，缺省为内置全集 */
  chords?: readonly string[]
}>(), {
  mode: 'show',
  fontSize: 18,
  lineGap: 12,
  padding: 16,
  color: '#222222',
  chordColor: '#1d6fd8',
  commonChords: () => COMMON_CHORDS,
  chords: () => listChords(),
})

const emit = defineEmits<{
  change: [data: ClSheetData]
  selectionChange: [selection: ClSheetSelection | null]
}>()

const sheet = computed(() => reactive(props.data) as ClSheetData)

/** 新加内容写入的颜色；props 给初值并跟随，setAddColors 随时改 */
const addColors = reactive<ClSheetAddColors>({})
watch(() => [props.addLyricColor, props.addChordColor], () => {
  addColors.lyric = props.addLyricColor || undefined
  addColors.chord = props.addChordColor || undefined
}, {immediate: true})

/** undefined = 不改，null / '' = 清除（之后新加的不写颜色） */
function setAddColors(colors: {lyric?: string | null; chord?: string | null}) {
  if (colors.lyric !== undefined) addColors.lyric = colors.lyric || undefined
  if (colors.chord !== undefined) addColors.chord = colors.chord || undefined
}

function getAddColors(): ClSheetAddColors {
  return {...addColors}
}

function lyricOptions() {
  return addColors.lyric ? {color: addColors.lyric} : {}
}
const isEdit = computed(() => props.mode === 'edit')
const chordSize = computed(() => props.chordFontSize ?? Math.round(props.fontSize * 0.8))

const rootEl = ref<HTMLElement | null>(null)
const pickerEl = ref<HTMLElement | null>(null)

const rootStyle = computed(() => ({
  width: `${sheet.value.width}px`,
  height: `${sheet.value.height}px`,
  padding: `${props.padding}px`,
  fontFamily: sheet.value.fontFamily || undefined,
  '--cl-font-size': `${props.fontSize}px`,
  '--cl-chord-size': `${chordSize.value}px`,
  '--cl-line-gap': `${props.lineGap}px`,
  '--cl-color': props.color,
  '--cl-chord-color': props.chordColor,
}))

function changed() {
  emit('change', props.data)
  if (selectedId.value) nextTick(updatePickerPos)
}

// —— 分组：英文单词不拆行，中文逐字；标点跟前一个字 ——

type TokenItem = {lyric: ClLyric; index: number}
type TokenGroup = {key: string; items: TokenItem[]}

const SPACE = /^\s+$/
const CJK = /[\u2E80-\u9FFF\uAC00-\uD7AF\uF900-\uFAFF\u3000-\u303F\uFF00-\uFFEF]/
const TRAILING_PUNCT = /^[，。！？、；：,.!?;:）)」』”’…]$/

function groupLine(line: ClLyricLine): TokenGroup[] {
  const groups: TokenGroup[] = []
  let word: TokenGroup | null = null
  line.forEach((lyric, index) => {
    const item = {lyric, index}
    const last = groups[groups.length - 1]
    if (SPACE.test(lyric.text)) {
      groups.push({key: lyric.id, items: [item]})
      word = null
    } else if (TRAILING_PUNCT.test(lyric.text) && last && !SPACE.test(last.items[last.items.length - 1]!.lyric.text)) {
      last.items.push(item)
    } else if (CJK.test(lyric.text)) {
      groups.push({key: lyric.id, items: [item]})
      word = null
    } else if (word) {
      word.items.push(item)
    } else {
      word = {key: lyric.id, items: [item]}
      groups.push(word)
    }
  })
  return groups
}

const lineGroups = computed(() => sheet.value.lyrics.map(groupLine))

// —— 和弦宽度：和弦可以压在后面没有和弦的字上，只有撞到下一个和弦时才把字撑开 ——

const resolvedFamily = ref('')
const fontEpoch = ref(0)
let measureCtx: CanvasRenderingContext2D | null = null

function refreshFont() {
  if (rootEl.value) resolvedFamily.value = getComputedStyle(rootEl.value).fontFamily
  fontEpoch.value++
}

function isBlank(lyric: ClLyric): boolean {
  return SPACE.test(lyric.text)
}

function measure(text: string, font: string): number {
  measureCtx ??= document.createElement('canvas').getContext('2d')
  if (!measureCtx) return 0
  measureCtx.font = font
  return measureCtx.measureText(text).width
}

/** lyric id → 需要额外撑开的宽度（px） */
const chordExtra = computed(() => {
  void fontEpoch.value
  const extra = new Map<string, number>()
  const family = resolvedFamily.value
  if (!family) return extra
  const lyricFont = `${props.fontSize}px ${family}`
  const chordFont = `600 ${chordSize.value}px ${family}`
  const gap = chordSize.value * 0.5
  for (const line of sheet.value.lyrics) {
    for (let i = 0; i < line.length; i++) {
      const chord = line[i]!.chord
      if (!chord) continue
      let room = 0
      let j = i
      do {
        const lyric = line[j]!
        const w = measure(lyric.text, lyricFont)
        room += isBlank(lyric) && lyric.underline ? Math.max(w, props.fontSize) : w
        j++
      } while (j < line.length && !line[j]!.chord)
      const need = measure(chord.text, chordFont) + (j < line.length ? gap : 0)
      if (need > room + 0.5) extra.set(line[i]!.id, Math.ceil(need - room))
    }
  }
  return extra
})

function tokenStyle(lyric: ClLyric) {
  const extra = chordExtra.value.get(lyric.id)
  return extra ? {paddingRight: `${extra}px`} : undefined
}

watch(() => [sheet.value.fontFamily, props.fontSize, props.chordFontSize], () => nextTick(refreshFont))

onMounted(() => {
  refreshFont()
  document.fonts?.addEventListener('loadingdone', refreshFont)
})

// —— 选中 ——

const selectedId = ref<string | null>(null)

function locate(id: string): ClSheetSelection | null {
  const lines = sheet.value.lyrics
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const index = lines[lineIndex]!.findIndex((l) => l.id === id)
    if (index >= 0) return {lineIndex, index, lyric: lines[lineIndex]![index]!}
  }
  return null
}

const selection = computed(() => (selectedId.value ? locate(selectedId.value) : null))
watch(selectedId, () => emit('selectionChange', selection.value))

function select(id: string | null) {
  if (id && !isEdit.value) return
  if (selectedId.value === id) return
  selectedId.value = id && locate(id) ? id : null
  if (selectedId.value) {
    nextTick(() => {
      updatePickerPos()
      nextTick(updatePickerPos)
    })
  }
}

function tokenEl(id: string): HTMLElement | null {
  return rootEl.value?.querySelector<HTMLElement>(`[data-lyric-id="${CSS.escape(id)}"]`) ?? null
}

function focusRoot() {
  rootEl.value?.focus({preventScroll: true})
}

function onTokenClick(id: string) {
  if (!isEdit.value) return
  commitEdit()
  select(id)
  focusRoot()
}

function onRootClick() {
  if (isEdit.value && editingLine.value === null) select(null)
}

function moveSelection(loc: ClSheetSelection, delta: number) {
  const lines = sheet.value.lyrics
  let li = loc.lineIndex
  let index = loc.index + delta
  while (li >= 0 && li < lines.length && (index < 0 || index >= lines[li]!.length)) {
    li += delta
    if (li < 0 || li >= lines.length) return
    index = delta > 0 ? 0 : lines[li]!.length - 1
  }
  const target = lines[li]?.[index]
  if (target) selectAndReveal(target.id)
}

function moveSelectionLine(loc: ClSheetSelection, delta: number) {
  const lines = sheet.value.lyrics
  for (let li = loc.lineIndex + delta; li >= 0 && li < lines.length; li += delta) {
    const line = lines[li]!
    if (!line.length) continue
    selectAndReveal(line[Math.min(loc.index, line.length - 1)]!.id)
    return
  }
}

function selectAndReveal(id: string) {
  select(id)
  nextTick(() => tokenEl(id)?.scrollIntoView({block: 'nearest', inline: 'nearest'}))
}

function onRootKeydown(e: KeyboardEvent) {
  if (!isEdit.value || editingLine.value !== null) return
  if ((e.target as HTMLElement).closest('input, textarea, select')) return
  const loc = selection.value
  if (!loc) return
  switch (e.key) {
    case 'ArrowLeft':
      moveSelection(loc, -1)
      break
    case 'ArrowRight':
      moveSelection(loc, 1)
      break
    case 'ArrowUp':
      moveSelectionLine(loc, -1)
      break
    case 'ArrowDown':
      moveSelectionLine(loc, 1)
      break
    case 'Delete':
    case 'Backspace':
      setChord(loc.lyric.id, null)
      break
    case 'Escape':
      select(null)
      break
    case 'Enter':
      startEdit(loc.lineIndex, charOffset(loc.lineIndex, loc.index))
      break
    default:
      return
  }
  e.preventDefault()
}

// —— 和弦 / 颜色 ——

function setChord(id: string, chord: ClChord | null) {
  const loc = locate(id)
  if (!loc) return
  if (chord) {
    const color = chord.color ?? (loc.lyric.chord ? undefined : addColors.chord)
    loc.lyric.chord = {...toRaw(chord), ...(color ? {color} : {})}
  } else {
    if (!loc.lyric.chord) return
    delete loc.lyric.chord
  }
  changed()
}

function setLyricColor(id: string, color?: string) {
  const loc = locate(id)
  if (!loc) return
  if (color) loc.lyric.color = color
  else delete loc.lyric.color
  changed()
}

function setLyricUnderline(id: string, underline: boolean) {
  const loc = locate(id)
  if (!loc || !!loc.lyric.underline === underline) return
  if (underline) loc.lyric.underline = true
  else delete loc.lyric.underline
  changed()
}

// —— 拖动和弦 ——

const DRAG_TYPE = 'application/x-cl-chord'
const dropTarget = ref<string | null>(null)

function onChordDragStart(e: DragEvent, id: string) {
  if (!isEdit.value || !e.dataTransfer) return
  commitEdit()
  e.dataTransfer.setData(DRAG_TYPE, id)
  e.dataTransfer.effectAllowed = 'copyMove'
}

function onDragOver(e: DragEvent, target: string) {
  if (!e.dataTransfer?.types.includes(DRAG_TYPE)) return
  e.preventDefault()
  e.dataTransfer.dropEffect = e.ctrlKey || e.altKey ? 'copy' : 'move'
  dropTarget.value = target
}

function onDragLeave(target: string) {
  if (dropTarget.value === target) dropTarget.value = null
}

function moveChord(fromId: string, toId: string, copy: boolean) {
  if (fromId === toId) return
  const from = locate(fromId)
  const to = locate(toId)
  const chord = from?.lyric.chord
  if (!from || !chord || !to) return
  const back = to.lyric.chord ? {...toRaw(to.lyric.chord)} : undefined
  to.lyric.chord = {...toRaw(chord)}
  if (!copy) {
    if (back) from.lyric.chord = back
    else delete from.lyric.chord
  }
  select(toId)
  changed()
}

function onTokenDrop(e: DragEvent, id: string) {
  dropTarget.value = null
  const from = e.dataTransfer?.getData(DRAG_TYPE)
  if (!from) return
  e.preventDefault()
  moveChord(from, id, e.ctrlKey || e.altKey)
}

// —— 整行文字编辑 ——

const editingLine = ref<number | null>(null)
const editingText = ref('')

function lineInput(): HTMLInputElement | null {
  return rootEl.value?.querySelector<HTMLInputElement>('.cl-sheet__input') ?? null
}

/** 第 index 个歌词单位之前的字数 */
function charOffset(lineIndex: number, index: number): number {
  return lyricLineCharCount(sheet.value.lyrics[lineIndex]!.slice(0, index))
}

function utf16Offset(text: string, chars: number): number {
  return Array.from(text).slice(0, chars).join('').length
}

function startEdit(lineIndex: number, caret?: number) {
  if (!isEdit.value) return
  commitEdit()
  select(null)
  const line = sheet.value.lyrics[lineIndex]
  if (!line) return
  editingLine.value = lineIndex
  editingText.value = lyricLineText(line)
  nextTick(() => {
    const input = lineInput()
    if (!input) return
    input.focus()
    const pos = caret === undefined ? editingText.value.length : utf16Offset(editingText.value, caret)
    input.setSelectionRange(pos, pos)
  })
}

function commitEdit(): boolean {
  const lineIndex = editingLine.value
  if (lineIndex === null) return false
  editingLine.value = null
  const line = sheet.value.lyrics[lineIndex]
  if (!line) return false
  const next = retextLyricLine(toRaw(line), editingText.value, lyricOptions())
  if (isSameLyricLine(line, next)) return false
  sheet.value.lyrics[lineIndex] = next
  changed()
  return true
}

function cancelEdit() {
  editingLine.value = null
}

function onInputBlur(lineIndex: number) {
  if (editingLine.value === lineIndex) commitEdit()
}

function onInputKeydown(e: KeyboardEvent, lineIndex: number) {
  const input = e.currentTarget as HTMLInputElement
  if (e.isComposing) return
  const caret = Array.from(editingText.value.slice(0, input.selectionStart ?? 0)).length
  const lines = sheet.value.lyrics
  switch (e.key) {
    case 'Enter': {
      e.preventDefault()
      commitEdit()
      const [head, tail] = splitLyricLine(toRaw(lines[lineIndex]!), caret)
      lines.splice(lineIndex, 1, head, tail)
      changed()
      startEdit(lineIndex + 1, 0)
      break
    }
    case 'Backspace': {
      if (lineIndex === 0 || input.selectionStart !== 0 || input.selectionEnd !== 0) return
      e.preventDefault()
      commitEdit()
      const prev = toRaw(lines[lineIndex - 1]!)
      const joinAt = lyricLineCharCount(prev)
      lines.splice(lineIndex - 1, 2, prev.concat(toRaw(lines[lineIndex]!)))
      changed()
      startEdit(lineIndex - 1, joinAt)
      break
    }
    case 'ArrowUp':
    case 'ArrowDown': {
      const target = lineIndex + (e.key === 'ArrowUp' ? -1 : 1)
      if (target < 0 || target >= lines.length) return
      e.preventDefault()
      startEdit(target, caret)
      break
    }
    case 'Escape':
      e.preventDefault()
      cancelEdit()
      focusRoot()
      break
  }
}

/** 粘贴多行：第一行接在光标处，其余拆成新行，光标后的原文接到最后一行 */
function onInputPaste(e: ClipboardEvent, lineIndex: number) {
  const input = e.currentTarget as HTMLInputElement
  const pasted = e.clipboardData?.getData('text/plain') ?? ''
  if (!/[\r\n]/.test(pasted)) return
  e.preventDefault()
  const parts = pasted.replace(/\r\n?/g, '\n').split('\n')
  const value = editingText.value
  const start = input.selectionStart ?? value.length
  const end = input.selectionEnd ?? start
  const head = value.slice(0, start) + parts[0]
  editingText.value = head + value.slice(end)
  commitEdit()
  const lines = sheet.value.lyrics
  const [first, tail] = splitLyricLine(toRaw(lines[lineIndex]!), Array.from(head).length)
  const lastText = parts[parts.length - 1]!
  const middle = parts.slice(1, -1).map((part) => textToLyricLine(part, lyricOptions()))
  lines.splice(lineIndex, 1, first, ...middle, textToLyricLine(lastText, lyricOptions()).concat(tail))
  changed()
  startEdit(lineIndex + parts.length - 1, Array.from(lastText).length)
}

// —— 行操作 ——

function insertLine(index: number, text = ''): void {
  commitEdit()
  const lines = sheet.value.lyrics
  lines.splice(Math.max(0, Math.min(index, lines.length)), 0, textToLyricLine(text, lyricOptions()))
  changed()
}

function removeLine(index: number): void {
  commitEdit()
  const lines = sheet.value.lyrics
  if (index < 0 || index >= lines.length) return
  if (selection.value?.lineIndex === index) select(null)
  lines.splice(index, 1)
  changed()
}

function moveLine(index: number, delta: number): void {
  commitEdit()
  const lines = sheet.value.lyrics
  const target = index + delta
  if (index < 0 || index >= lines.length || target < 0 || target >= lines.length) return
  const [line] = lines.splice(index, 1)
  lines.splice(target, 0, line!)
  changed()
}

function setLineText(index: number, text: string): void {
  commitEdit()
  const line = sheet.value.lyrics[index]
  if (!line) return
  sheet.value.lyrics[index] = retextLyricLine(toRaw(line), text, lyricOptions())
  changed()
}

function appendLine() {
  const index = sheet.value.lyrics.length
  insertLine(index)
  startEdit(index)
}

// —— 和弦浮层 ——

const pickerOpen = computed(() => isEdit.value && !!selection.value && editingLine.value === null)
const pickerPos = ref({left: 0, top: 0})

function updatePickerPos() {
  const id = selectedId.value
  const el = id ? tokenEl(id) : null
  if (!el) return
  const r = el.getBoundingClientRect()
  const pw = pickerEl.value?.offsetWidth ?? 340
  const ph = pickerEl.value?.offsetHeight ?? 380
  const left = Math.max(8, Math.min(r.left, window.innerWidth - pw - 8))
  let top = r.bottom + 6
  if (top + ph > window.innerHeight - 8 && r.top - ph - 6 >= 8) top = r.top - ph - 6
  pickerPos.value = {left, top}
}

function onDocPointerDown(e: PointerEvent) {
  const target = e.target as Node
  if (pickerEl.value?.contains(target) || rootEl.value?.contains(target)) return
  select(null)
}

function onViewportChange() {
  updatePickerPos()
}

function bindPickerListeners(on: boolean) {
  const method = on ? 'addEventListener' : 'removeEventListener'
  document[method]('pointerdown', onDocPointerDown as EventListener, true)
  window[method]('scroll', onViewportChange, true)
  window[method]('resize', onViewportChange)
}

watch(pickerOpen, (open) => bindPickerListeners(open))

watch(isEdit, (edit) => {
  if (edit) return
  commitEdit()
  select(null)
})

watch(() => props.data, () => {
  editingLine.value = null
  selectedId.value = null
})

onBeforeUnmount(() => {
  bindPickerListeners(false)
  document.fonts?.removeEventListener('loadingdone', refreshFont)
})

function closePicker() {
  select(null)
  focusRoot()
}

defineExpose({
  /** 当前选中（edit 模式） */
  getSelection: () => selection.value,
  /** 选中某个歌词单位并弹出和弦选择（edit 模式） */
  select: (id: string | null) => select(id),
  clearSelection: () => select(null),
  setChord,
  setLyricColor,
  setLyricUnderline,
  /** 改新加内容的默认颜色：{lyric?, chord?}，undefined 不改，null 清除 */
  setAddColors,
  getAddColors,
  insertLine,
  removeLine,
  moveLine,
  setLineText,
  /** 进入整行文字编辑，caret 为字数位置（缺省行尾） */
  startEditLine: startEdit,
  /** 提交正在编辑的行 */
  endEditLine: commitEdit,
  getElement: () => rootEl.value,
})
</script>

<template>
  <div
    ref="rootEl"
    class="cl-sheet"
    :class="{'cl-sheet--edit': isEdit}"
    :style="rootStyle"
    :tabindex="isEdit ? 0 : undefined"
    @click="onRootClick"
    @keydown="onRootKeydown"
    @scroll="onViewportChange"
  >
    <div
      v-for="(line, li) in sheet.lyrics"
      :key="li"
      class="cl-sheet__line"
      :class="{'is-editing': editingLine === li}"
    >
      <input
        v-if="editingLine === li"
        v-model="editingText"
        class="cl-sheet__input"
        placeholder="输入歌词，Enter 换行"
        @click.stop
        @blur="onInputBlur(li)"
        @keydown="onInputKeydown($event, li)"
        @paste="onInputPaste($event, li)"
      >
      <div v-else class="cl-sheet__row" @dblclick="startEdit(li)">
        <span v-for="group in lineGroups[li]" :key="group.key" class="cl-sheet__group">
          <span
            v-for="item in group.items"
            :key="item.lyric.id"
            class="cl-sheet__token"
            :class="{
              'has-chord': !!item.lyric.chord,
              'is-selected': selectedId === item.lyric.id,
              'is-drop': dropTarget === item.lyric.id,
            }"
            :style="tokenStyle(item.lyric)"
            :data-lyric-id="item.lyric.id"
            @click.stop="onTokenClick(item.lyric.id)"
            @dblclick.stop="startEdit(li, charOffset(li, item.index))"
            @dragover="onDragOver($event, item.lyric.id)"
            @dragleave="onDragLeave(item.lyric.id)"
            @drop="onTokenDrop($event, item.lyric.id)"
          >
            <span
              class="cl-sheet__chord"
              :style="item.lyric.chord?.color ? {color: item.lyric.chord.color} : undefined"
              :draggable="isEdit && !!item.lyric.chord"
              @dragstart="onChordDragStart($event, item.lyric.id)"
              @dragend="dropTarget = null"
            >{{ item.lyric.chord?.text }}</span>
            <span
              class="cl-sheet__text"
              :class="{'is-underline': item.lyric.underline, 'is-blank': isBlank(item.lyric)}"
              :style="item.lyric.color ? {color: item.lyric.color} : undefined"
            >{{ item.lyric.text }}</span>
          </span>
        </span>
      </div>
      <div v-if="isEdit && editingLine !== li" class="cl-sheet__tools" @click.stop @dblclick.stop>
        <button title="编辑文字" @click="startEdit(li)">✎</button>
        <button title="上移" :disabled="li === 0" @click="moveLine(li, -1)">↑</button>
        <button title="下移" :disabled="li === sheet.lyrics.length - 1" @click="moveLine(li, 1)">↓</button>
        <button title="下方插入一行" @click="insertLine(li + 1); startEdit(li + 1)">＋</button>
        <button title="删除这一行" @click="removeLine(li)">✕</button>
      </div>
    </div>
    <button v-if="isEdit" class="cl-sheet__add" @click.stop="appendLine">＋ 添加一行</button>

    <Teleport to="body">
      <div
        v-if="pickerOpen && selection"
        ref="pickerEl"
        class="cl-sheet__picker"
        :style="{left: `${pickerPos.left}px`, top: `${pickerPos.top}px`}"
      >
        <ChordPicker
          :chord="selection.lyric.chord"
          :text-color="selection.lyric.color"
          :underline="!!selection.lyric.underline"
          :default-chord-color="chordColor"
          :default-text-color="color"
          :common="commonChords"
          :all="chords"
          @change="setChord(selection.lyric.id, $event)"
          @text-color="setLyricColor(selection.lyric.id, $event)"
          @underline="setLyricUnderline(selection.lyric.id, $event)"
          @close="closePicker"
        />
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.cl-sheet {
  position: relative;
  box-sizing: border-box;
  overflow: auto;
  color: var(--cl-color);
  font-size: var(--cl-font-size);
  outline: none;
}

.cl-sheet__line {
  position: relative;
  margin-bottom: var(--cl-line-gap);
}

.cl-sheet__row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  row-gap: calc(var(--cl-line-gap) / 2);
  min-height: calc(var(--cl-chord-size) * 1.3 + var(--cl-font-size) * 1.45);
}

.cl-sheet__group {
  display: inline-flex;
  white-space: nowrap;
}

.cl-sheet__token {
  position: relative;
  display: inline-block;
  padding-top: calc(var(--cl-chord-size) * 1.3);
  border-radius: 3px;
}

.cl-sheet__chord {
  position: absolute;
  top: 0;
  left: 0;
  height: calc(var(--cl-chord-size) * 1.3);
  line-height: calc(var(--cl-chord-size) * 1.3);
  font-size: var(--cl-chord-size);
  font-weight: 600;
  color: var(--cl-chord-color);
  white-space: nowrap;
}

.cl-sheet__text {
  display: block;
  line-height: 1.45;
  white-space: pre;
}

/* 画在文字盒底边，宽度 = 文字宽，不受和弦撑开的 padding 影响 */
.cl-sheet__text.is-underline {
  background: linear-gradient(currentColor, currentColor) no-repeat left bottom / 100% 1px;
}

.cl-sheet__text.is-underline.is-blank {
  min-width: 1em;
}

/* —— 编辑模式 —— */

.cl-sheet--edit .cl-sheet__token {
  cursor: pointer;
}

.cl-sheet--edit .cl-sheet__token:hover {
  background: rgba(64, 158, 255, .1);
}

.cl-sheet--edit .cl-sheet__token:not(.has-chord):hover .cl-sheet__chord::before {
  content: '+';
  opacity: .35;
}

.cl-sheet--edit .cl-sheet__token.has-chord .cl-sheet__chord {
  cursor: grab;
}

.cl-sheet__token.is-selected {
  background: rgba(64, 158, 255, .18);
  box-shadow: inset 0 0 0 1px #409eff;
}

.cl-sheet__token.is-drop {
  background: rgba(103, 194, 58, .2);
  box-shadow: inset 0 0 0 1px #67c23a;
}

.cl-sheet--edit .cl-sheet__line:hover {
  background: rgba(0, 0, 0, .025);
}

.cl-sheet__input {
  box-sizing: border-box;
  width: 100%;
  margin-top: calc(var(--cl-chord-size) * 1.3);
  padding: 0 4px;
  border: 1px dashed #409eff;
  border-radius: 3px;
  background: #fff;
  color: inherit;
  font: inherit;
  line-height: 1.45;
  outline: none;
}

.cl-sheet__tools {
  position: absolute;
  top: 0;
  right: 0;
  display: none;
  gap: 2px;
  padding: 1px;
  border-radius: 4px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, .15);
}

.cl-sheet__line:hover .cl-sheet__tools {
  display: flex;
}

.cl-sheet__tools button {
  width: 20px;
  height: 18px;
  padding: 0;
  border: none;
  border-radius: 3px;
  background: none;
  color: #606266;
  font: 12px/18px system-ui, sans-serif;
  cursor: pointer;
}

.cl-sheet__tools button:hover:not(:disabled) {
  background: #ecf5ff;
  color: #409eff;
}

.cl-sheet__tools button:disabled {
  opacity: .35;
  cursor: default;
}

.cl-sheet__add {
  padding: 4px 10px;
  border: 1px dashed #c0c4cc;
  border-radius: 4px;
  background: none;
  color: #909399;
  font: 13px system-ui, sans-serif;
  cursor: pointer;
}

.cl-sheet__add:hover {
  border-color: #409eff;
  color: #409eff;
}

.cl-sheet__picker {
  position: fixed;
  z-index: 3000;
}
</style>
