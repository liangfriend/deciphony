import type {VDom} from '@/types/common'

function ledgerLineSuffix(node: VDom): string {
  if ((node.tag === 'addLine_u' || node.tag === 'addLine_g') && node.special?.ledgerLine != null) {
    return `|L${node.special.ledgerLine}`
  }
  return ''
}

/** 用于匹配同一渲染节点的稳定键 */
export function vdomNodeKey(node: VDom): string {
  return `${node.targetId ?? ''}|${node.tag}|${node.skinKey ?? ''}|${node.skinName ?? 'default'}${ledgerLineSuffix(node)}`
}

function isPointEqual(
  a: { x: number; y: number } | undefined,
  b: { x: number; y: number } | undefined,
): boolean {
  if (a === b) return true
  if (!a || !b) return !a && !b
  return a.x === b.x && a.y === b.y
}

/** 比较影响 Group / 附属组件绘制的字段 */
export function isVDomRenderEqual(a: VDom, b: VDom): boolean {
  return (
    a.x === b.x &&
    a.y === b.y &&
    a.w === b.w &&
    a.h === b.h &&
    a.zIndex === b.zIndex &&
    a.tag === b.tag &&
    a.targetId === b.targetId &&
    a.skinKey === b.skinKey &&
    a.skinName === b.skinName &&
    a.slotName === b.slotName &&
    a.dataComment === b.dataComment &&
    isPointEqual(a.startPoint, b.startPoint) &&
    isPointEqual(a.endPoint, b.endPoint) &&
    JSON.stringify(a.special ?? {}) === JSON.stringify(b.special ?? {})
  )
}

/**
 * 将新一轮 musicScoreToVDom 结果与当前 vDom 合并：未变化的节点保留原对象引用，
 * 以便 Vue 跳过对应 Group 的更新。
 */
export function diffAndMergeVDom(current: VDom[], next: VDom[]): VDom[] {
  if (!current.length) return next
  if (!next.length) return []

  const pool = new Map<string, VDom[]>()
  for (const node of current) {
    const key = vdomNodeKey(node)
    const list = pool.get(key)
    if (list) list.push(node)
    else pool.set(key, [node])
  }

  return next.map((newNode) => {
    const candidates = pool.get(vdomNodeKey(newNode))
    if (!candidates?.length) return newNode
    const idx = candidates.findIndex((old) => isVDomRenderEqual(old, newNode))
    if (idx < 0) return newNode
    const [reused] = candidates.splice(idx, 1)
    // slotData 是指向 musicScore 数据的引用，不参与渲染相等比较；复用旧节点对象（让 Group 跳过更新）的同时，
    // 必须同步为最新 slotData，否则整体替换为深拷贝相同数据时，复用节点仍持有旧数据引用。
    reused!.slotData = newNode.slotData
    return reused!
  })
}

/**
 * 通过 updater 修改 vDom 后做 diff 合并（暴露给外部的 updateVDom API）
 */
export function applyVDomUpdate(
  current: VDom[],
  updater: (vDom: VDom[]) => VDom[],
): VDom[] {
  const copy = current.map((node) => ({...node}))
  const result = updater(copy)
  return diffAndMergeVDom(current, result)
}
