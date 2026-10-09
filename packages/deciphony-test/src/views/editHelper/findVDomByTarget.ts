import type {VDom, VDomLookup, VDomTagType} from '@deciphony/renderer'

/** 按 targetId 找节点；有 lookup 时 O(1)，否则扫列表 */
export function findVDomByTarget(
  list: readonly VDom[],
  lookup: VDomLookup | null | undefined,
  targetId: string,
  pred?: (node: VDom) => boolean,
): VDom | undefined {
  const nodes = lookup ? lookup.byTargetId(targetId) : list.filter((node) => node.targetId === targetId)
  return pred ? nodes.find(pred) : nodes[0]
}

export function findVDomByTargetTag(
  list: readonly VDom[],
  lookup: VDomLookup | null | undefined,
  targetId: string,
  tag: VDomTagType,
): VDom | undefined {
  if (lookup) return lookup.find(targetId, tag)
  return list.find((node) => node.targetId === targetId && node.tag === tag)
}
