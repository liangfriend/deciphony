import type {VDom} from '@/types/common'

/**
 * 选中态 / DOM 绑定的稳定语义键（不含 skinName、skinKey，换肤后不变）。
 * 格式：tag:targetId:slotName
 */
export function vdomSelectionKey(node: VDom): string {
  return `${node.tag}:${node.targetId ?? ''}:${node.slotName ?? ''}`
}

/**
 * 顶层事件绑定 g 的 DOM id。
 * 有 targetId 时由语义键派生；无 targetId（如 space）用 domIndex 保证唯一。
 */
export function vdomDomId(node: VDom, domIndex?: number): string {
  const safe = vdomSelectionKey(node).replace(/[^a-zA-Z0-9_-]/g, '_')
  if (node.targetId) return `dr-${safe}`
  return `dr-${safe}-${domIndex ?? 0}`
}

/** 在 svg 根下按语义键查找顶层绑定 g（有 targetId 的节点） */
export function findElementByVdomDomId(root: ParentNode, node: VDom): SVGElement | null {
  if (!node.targetId) return null
  const id = vdomDomId(node)
  const el = root.querySelector(`#${CSS.escape(id)}`)
  return el instanceof SVGElement ? el : null
}

/** 在 vDom 列表中按语义键找回节点 */
export function findVDomBySelectionKey(vDoms: readonly VDom[], key: string): VDom | undefined {
  return vDoms.find((node) => vdomSelectionKey(node) === key)
}

/** 在 vDom 列表中按 DOM id 找回节点（id 由 vdomDomId 生成） */
export function findVDomByDomId(vDoms: readonly VDom[], domId: string): VDom | undefined {
  return vDoms.find((node) => node.targetId && vdomDomId(node) === domId)
}
