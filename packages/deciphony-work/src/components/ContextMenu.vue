<script lang="ts" setup>
import {computed, nextTick, onBeforeUnmount, onMounted, ref, watch} from 'vue'
import type {ContextMenuEntry} from '../types/contextMenu'

const props = defineProps<{
  x: number
  y: number
  items: ContextMenuEntry[]
}>()

const emit = defineEmits<{
  close: []
}>()

const rootRef = ref<HTMLElement | null>(null)
const pos = ref({left: props.x, top: props.y})

const style = computed(() => ({
  left: `${pos.value.left}px`,
  top: `${pos.value.top}px`,
}))

function clampToViewport() {
  const el = rootRef.value
  if (!el) return
  const pad = 8
  const rect = el.getBoundingClientRect()
  let left = props.x
  let top = props.y
  if (left + rect.width > window.innerWidth - pad) {
    left = Math.max(pad, window.innerWidth - rect.width - pad)
  }
  if (top + rect.height > window.innerHeight - pad) {
    top = Math.max(pad, window.innerHeight - rect.height - pad)
  }
  pos.value = {left, top}
}

function onDocPointerDown(ev: Event) {
  const t = ev.target
  if (t instanceof Node && rootRef.value?.contains(t)) return
  emit('close')
}

function onKeydown(ev: KeyboardEvent) {
  if (ev.key === 'Escape') emit('close')
}

function onScroll() {
  emit('close')
}

function run(item: ContextMenuEntry, ev?: Event) {
  if (item.disabled) {
    ev?.preventDefault()
    ev?.stopPropagation()
    return
  }
  ev?.preventDefault()
  ev?.stopPropagation()
  try {
    item.action()
  } finally {
    emit('close')
  }
}

onMounted(async () => {
  await nextTick()
  clampToViewport()
  // 延后绑定，避免打开菜单的同一次右键 pointer 事件立刻把菜单关掉
  requestAnimationFrame(() => {
    document.addEventListener('pointerdown', onDocPointerDown, true)
    document.addEventListener('keydown', onKeydown)
    window.addEventListener('scroll', onScroll, true)
  })
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocPointerDown, true)
  document.removeEventListener('keydown', onKeydown)
  window.removeEventListener('scroll', onScroll, true)
})

watch(
  () => [props.x, props.y] as const,
  async () => {
    pos.value = {left: props.x, top: props.y}
    await nextTick()
    clampToViewport()
  },
)
</script>

<template>
  <Teleport to="body">
    <ul
      ref="rootRef"
      class="sjw-context-menu"
      role="menu"
      :style="style"
      @contextmenu.prevent
    >
      <li
        v-for="(item, i) in items"
        :key="`${item.text}-${i}`"
        class="sjw-context-menu__item"
        :class="{
          'sjw-context-menu__item--danger': item.danger,
          'sjw-context-menu__item--disabled': item.disabled,
        }"
        :aria-disabled="item.disabled ? 'true' : undefined"
        role="menuitem"
        @pointerdown.prevent.stop="run(item, $event)"
      >
        {{ item.text }}
      </li>
    </ul>
  </Teleport>
</template>

<style scoped>
.sjw-context-menu {
  position: fixed;
  z-index: 10000;
  margin: 0;
  padding: 4px 0;
  min-width: 140px;
  list-style: none;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  font-size: 13px;
  color: #303133;
  user-select: none;
}

.sjw-context-menu__item {
  padding: 8px 14px;
  cursor: pointer;
  white-space: nowrap;
}

.sjw-context-menu__item:hover {
  background: #f5f7fa;
}

.sjw-context-menu__item--danger {
  color: #f56c6c;
}

.sjw-context-menu__item--danger:hover {
  background: #fef0f0;
}

.sjw-context-menu__item--disabled {
  color: #c0c4cc;
  cursor: not-allowed;
}

.sjw-context-menu__item--disabled:hover {
  background: transparent;
}

.sjw-context-menu__item--danger.sjw-context-menu__item--disabled {
  color: #f9c0c0;
}

.sjw-context-menu__item--danger.sjw-context-menu__item--disabled:hover {
  background: transparent;
}
</style>
