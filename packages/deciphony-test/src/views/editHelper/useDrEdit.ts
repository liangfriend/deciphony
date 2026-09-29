import type {DrExtension, MusicScore, SlotConfig, VDom} from '@deciphony/renderer'
import type {MaybeRefOrGetter, Ref} from 'vue'
import {nextTick, provide, ref, toValue} from 'vue'
import type {MusicScoreComponentExpose} from './useRenderEdit'
import {useRenderEdit} from './useRenderEdit'
import {DR_EDIT_INJECTION_KEY} from './editInject'
import EditSlotGdButtons from './components/EditSlotGdButtons.vue'
import EditSlotSdButtons from './components/EditSlotSdButtons.vue'
import EditMeasureOverlay from './components/EditMeasureOverlay.vue'
import {slotDataFromVDom} from './renderEditSelection'
import {
  createEmptyContextMenuState,
  resolveContextMenuEntries,
  type EditContextMenuItem,
  type EditContextMenuPayload,
  type EditContextMenuState,
} from './renderEditContextMenu'
import {EXCLUDED_INTERACTION_TAGS} from './constants'
import {deleteSelectedItem} from './renderEditDelete'

export const EDIT_SLOT_CONFIG: SlotConfig = {
  'g-r': {w: 50},
  'g-l': {w: 50},
  'g-d': {h: 40},
  's-d': {h: 20},
}

export type {DrEditApi} from './editInject'
export {DR_EDIT_INJECTION_KEY} from './editInject'
export type {
  EditContextMenuItem,
  EditContextMenuPayload,
  EditContextMenuState,
  EditContextMenuEntry,
} from './renderEditContextMenu'

export type UseDrEditOptions = {
  musicScoreRef?: Ref<MusicScoreComponentExpose | null>
  /**
   * 自定义右键菜单项。可在 `onBeforeContextMenu` 里同步改写该列表（ref / getter）。
   * 无有效项时仍拦截浏览器默认菜单，但不弹出自定义菜单。
   */
  contextMenu?: MaybeRefOrGetter<EditContextMenuItem[]>
  /** 打开菜单前回调，可改写 contextMenu */
  onBeforeContextMenu?: (payload: EditContextMenuPayload) => void
}

/**
 * 编辑扩展：slotConfig / 插槽组件 / 事件都挂在 extension 上，随 :extensions 一次注入。
 * 侧栏、快捷键、连音线拖拽层、右键菜单仍用返回的 api。
 *
 * 高频几何（连音线拖拽等）若要「立刻 updateVDom 跟手 + musicScore 防抖落盘」，
 * 必须经 scoreWriteGate.patch 改 data，不要每帧直接写曲谱。详见 功能.md 同名小节。
 */
export function useDrEdit(musicScore: MusicScore, options?: UseDrEditOptions) {
  const api = useRenderEdit(musicScore, {musicScoreRef: options?.musicScoreRef})
  provide(DR_EDIT_INJECTION_KEY, api)

  const contextMenuState = ref<EditContextMenuState>(createEmptyContextMenuState())

  function closeContextMenu() {
    contextMenuState.value = createEmptyContextMenuState()
  }

  function buildPayload(event: MouseEvent, vDom: VDom | null): EditContextMenuPayload {
    const slot =
      vDom && !EXCLUDED_INTERACTION_TAGS.has(vDom.tag)
        ? vDom.slotData ?? slotDataFromVDom(musicScore, vDom)
        : null
    return {event, vDom, slot}
  }

  async function openContextMenu(event: MouseEvent, vDom: VDom | null) {
    event.preventDefault()
    const payload = buildPayload(event, vDom)
    options?.onBeforeContextMenu?.(payload)
    await nextTick()
    const items = resolveContextMenuEntries(toValue(options?.contextMenu) ?? [], payload)
    if (!items.length) {
      closeContextMenu()
      return
    }
    contextMenuState.value = {
      open: true,
      x: event.clientX,
      y: event.clientY,
      items,
      payload,
    }
  }

  function handleDrContextMenu(event: MouseEvent, vDom: VDom) {
    void openContextMenu(event, vDom)
  }

  function handleTopContextMenu(event: MouseEvent, vDom: VDom | null) {
    void openContextMenu(event, vDom)
  }

  /** 内置「删除」菜单项：按右键命中的 slot 删除（与 Delete 键同源） */
  function createDeleteContextMenuItem(
    overrides?: Partial<Omit<EditContextMenuItem, 'callback'>>,
  ): EditContextMenuItem {
    return {
      text: '删除',
      danger: true,
      visible: (p) => p.slot != null,
      ...overrides,
      callback: (p) => {
        if (!p.slot) return
        if (!deleteSelectedItem(musicScore, p.slot)) return
        api.clearSelection()
      },
    }
  }

  const extension: DrExtension = {
    name: 'dr-edit',
    slotConfig: EDIT_SLOT_CONFIG,
    slots: {
      'g-d': EditSlotGdButtons,
      's-d': EditSlotSdButtons,
      m: EditMeasureOverlay,
    },
    on: {
      renderMusicScore: api.handleRenderMusicScore,
      'dr-click': api.handleDrClick,
      'dr-contextmenu': handleDrContextMenu,
      'dr-down': api.handleDrDown,
      'dr-enter': api.handleDrEnter,
      'dr-leave': api.handleDrLeave,
      'dr-up': api.handleDrUp,
      'top-move': api.handleTopMove,
      'top-up': api.handleTopUp,
      'top-contextmenu': handleTopContextMenu,
    },
  }

  return {
    extension,
    ...api,
    contextMenuState,
    closeContextMenu,
    createDeleteContextMenuItem,
  }
}
