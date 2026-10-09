<script lang="ts" setup>
import {computed, nextTick, ref, watch} from 'vue'
import type {SElement, STextElement} from '../types/types'
import {visibleSourceRect} from '../api/crop'
import EditFrame from './EditFrame.vue'
import AudioPlayer from './AudioPlayer.vue'
import VideoPlayer from './VideoPlayer.vue'

const props = defineProps<{
  element: SElement
  editable: boolean
  selected: boolean
  resolveSrc: (src: string) => string
  /** 裁剪模式（仅图片）：显示整张原图（裁掉部分由 EditFrame 蒙白），四角改裁剪区域 */
  cropping?: boolean
}>()

const emit = defineEmits<{
  select: []
  contextmenu: [ev: MouseEvent]
}>()

const textEditing = ref(false)
const draft = ref('')
const inputRef = ref<HTMLTextAreaElement | null>(null)

watch(
  () => props.selected,
  (sel) => {
    if (!sel && textEditing.value) commitText()
  },
)

watch(
  () => props.editable,
  (ed) => {
    if (!ed && textEditing.value) commitText()
  },
)

function isText(el: SElement): el is STextElement {
  return el.type === 'text'
}

async function startTextEdit() {
  if (!props.editable || !isText(props.element)) return
  emit('select')
  draft.value = props.element.text
  textEditing.value = true
  await nextTick()
  inputRef.value?.focus()
  inputRef.value?.select()
}

function commitText() {
  if (!textEditing.value || !isText(props.element)) return
  props.element.text = draft.value
  textEditing.value = false
}

function onTextKeydown(ev: KeyboardEvent) {
  if (ev.key === 'Escape') {
    draft.value = isText(props.element) ? props.element.text : draft.value
    textEditing.value = false
    ev.preventDefault()
  }
  // Enter 换行；Ctrl/Cmd+Enter 提交
  if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) {
    commitText()
    ev.preventDefault()
  }
}

function onBodyDblclick() {
  if (isText(props.element)) startTextEdit()
}

/** 裁剪模式下的源尺寸与整张原图在框局部坐标里的位置；无原始尺寸时不进入裁剪 */
const imageCrop = computed(() => {
  const el = props.element
  if (!props.cropping || el.type !== 'image' || !el.naturalWidth || !el.naturalHeight) return null
  const source = {width: el.naturalWidth, height: el.naturalHeight}
  const view = visibleSourceRect(el.crop, source)
  const sx = el.width / view.width
  const sy = el.height / view.height
  return {
    source,
    x: -view.x * sx,
    y: -view.y * sy,
    width: source.width * sx,
    height: source.height * sy,
  }
})
</script>

<template>
  <EditFrame
    :editable="editable"
    :element="element"
    :move-on-body="element.type !== 'audio' && element.type !== 'video' && !textEditing"
    :selected="selected"
    :crop-source="imageCrop?.source ?? null"
    @body-dblclick="onBodyDblclick"
    @contextmenu="emit('contextmenu', $event)"
    @select="emit('select')"
  >
    <image
      v-if="element.type === 'image' && imageCrop"
      :height="imageCrop.height"
      :href="resolveSrc(element.src)"
      pointer-events="none"
      preserveAspectRatio="none"
      :width="imageCrop.width"
      :x="imageCrop.x"
      :y="imageCrop.y"
    />
    <svg
      v-else-if="element.type === 'image' && element.crop && element.naturalWidth && element.naturalHeight"
      :height="element.height"
      overflow="hidden"
      preserveAspectRatio="none"
      :viewBox="`${element.crop.x} ${element.crop.y} ${element.crop.width} ${element.crop.height}`"
      :width="element.width"
      x="0"
      y="0"
    >
      <image
        :height="element.naturalHeight"
        :href="resolveSrc(element.src)"
        preserveAspectRatio="none"
        :width="element.naturalWidth"
        x="0"
        y="0"
      />
    </svg>
    <image
      v-else-if="element.type === 'image'"
      preserveAspectRatio="none"
      :height="element.height"
      :href="resolveSrc(element.src)"
      :width="element.width"
      x="0"
      y="0"
    />
    <foreignObject
      v-else-if="element.type === 'audio'"
      :height="element.height"
      :width="element.width"
      x="0"
      y="0"
    >
      <div
        xmlns="http://www.w3.org/1999/xhtml"
        class="sjw-el__box"
        :data-sjw-element-id="element.id"
        @contextmenu.prevent.stop="emit('contextmenu', $event)"
      >
        <AudioPlayer :src="resolveSrc(element.src)"/>
      </div>
    </foreignObject>
    <foreignObject
      v-else-if="element.type === 'video'"
      :height="element.height"
      :width="element.width"
      x="0"
      y="0"
    >
      <div
        xmlns="http://www.w3.org/1999/xhtml"
        class="sjw-el__box"
        :data-sjw-element-id="element.id"
        @contextmenu.prevent.stop="emit('contextmenu', $event)"
      >
        <VideoPlayer :src="resolveSrc(element.src)"/>
      </div>
    </foreignObject>
    <foreignObject
      v-else-if="element.type === 'text'"
      :height="element.height"
      :width="element.width"
      x="0"
      y="0"
    >
      <div
        xmlns="http://www.w3.org/1999/xhtml"
        class="sjw-el__box"
        @contextmenu.prevent.stop="emit('contextmenu', $event)"
      >
        <textarea
          v-if="textEditing"
          ref="inputRef"
          v-model="draft"
          class="sjw-el__input"
          :style="{
            color: element.color ?? '#303133',
            fontFamily: element.fontFamily ?? 'sans-serif',
            fontSize: `${element.fontSize ?? 24}px`,
          }"
          @blur="commitText"
          @keydown="onTextKeydown"
          @pointerdown.stop
        />
        <div
          v-else
          class="sjw-el__text"
          :style="{
            color: element.color ?? '#303133',
            fontFamily: element.fontFamily ?? 'sans-serif',
            fontSize: `${element.fontSize ?? 24}px`,
          }"
          @dblclick.stop="startTextEdit"
        >{{ element.text }}</div>
      </div>
    </foreignObject>
  </EditFrame>
</template>

<style scoped>
.sjw-el__box {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}

.sjw-el__text {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  padding: 4px 8px;
  overflow: hidden;
  word-break: break-word;
  line-height: 1.3;
  user-select: none;
}

.sjw-el__input {
  display: block;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  margin: 0;
  padding: 4px 8px;
  border: 1px solid #409eff;
  border-radius: 2px;
  outline: none;
  resize: none;
  background: #fff;
  line-height: 1.3;
  overflow: auto;
}
</style>
