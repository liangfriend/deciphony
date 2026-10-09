import type {VDom, VDomTagType} from '@/types/common'

/** 按 targetId 查 vDom（同一 targetId 可能对应多个节点：音符头、符干、插槽父 g 等） */
export type VDomLookup = {
  byTargetId(targetId: string): readonly VDom[]
  /** 按 targetId + tag 取第一个；不传 tag 取第一个 */
  find(targetId: string, tag?: VDomTagType): VDom | undefined
}

const EMPTY: readonly VDom[] = Object.freeze([]) as readonly VDom[]

/** 可增量维护的 targetId 索引：整行换新时 remove 旧节点、add 新节点 */
export class VDomIndex implements VDomLookup {
  private readonly map = new Map<string, VDom[]>()

  add(nodes: readonly VDom[]): void {
    for (const node of nodes) {
      const id = node.targetId
      if (!id) continue
      const list = this.map.get(id)
      if (list) list.push(node)
      else this.map.set(id, [node])
    }
  }

  remove(nodes: readonly VDom[]): void {
    for (const node of nodes) {
      const id = node.targetId
      if (!id) continue
      const list = this.map.get(id)
      if (!list) continue
      const at = list.indexOf(node)
      if (at < 0) continue
      if (list.length === 1) this.map.delete(id)
      else list.splice(at, 1)
    }
  }

  clear(): void {
    this.map.clear()
  }

  byTargetId(targetId: string): readonly VDom[] {
    return this.map.get(targetId) ?? EMPTY
  }

  find(targetId: string, tag?: VDomTagType): VDom | undefined {
    const list = this.map.get(targetId)
    if (!list) return undefined
    return tag ? list.find((node) => node.tag === tag) : list[0]
  }

  lists(): IterableIterator<VDom[]> {
    return this.map.values()
  }
}

/** 从扁平列表建索引（宿主自己拿到的是数组时用） */
export function createVDomLookup(list: readonly VDom[]): VDomLookup {
  const index = new VDomIndex()
  index.add(list)
  return index
}
