import type {SlotData, VDom} from '@deciphony/renderer'

/** 曲谱右键菜单回调入参（与 item.callback / beforeContextMenu 一致） */
export type EditContextMenuPayload = {
  event: MouseEvent
  /** 命中符号；空白区域为 null（仅 top-contextmenu） */
  vDom: VDom | null
  /** 由 vDom 解析的 SlotData；解析失败为 null */
  slot: SlotData | null
}

/** 宿主自定义菜单项（useDrEdit options.contextMenu） */
export type EditContextMenuItem = {
  text: string
  danger?: boolean
  visible?: (payload: EditContextMenuPayload) => boolean
  disabled?: boolean | ((payload: EditContextMenuPayload) => boolean)
  callback: (payload: EditContextMenuPayload) => void
}

/** 已解析、可直接渲染的菜单项 */
export type EditContextMenuEntry = {
  text: string
  danger?: boolean
  disabled: boolean
  action: () => void
}

export type EditContextMenuState = {
  open: boolean
  x: number
  y: number
  items: EditContextMenuEntry[]
  payload: EditContextMenuPayload | null
}

export function createEmptyContextMenuState(): EditContextMenuState {
  return {open: false, x: 0, y: 0, items: [], payload: null}
}

export function resolveContextMenuEntries(
  items: EditContextMenuItem[],
  payload: EditContextMenuPayload,
): EditContextMenuEntry[] {
  return items
    .filter((item) => item.visible?.(payload) !== false)
    .map((item) => {
      const disabled =
        typeof item.disabled === 'function' ? item.disabled(payload) : Boolean(item.disabled)
      return {
        text: item.text,
        danger: item.danger,
        disabled,
        action: () => {
          if (disabled) return
          item.callback(payload)
        },
      }
    })
}
