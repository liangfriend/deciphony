import {BarlineTypeEnum} from '@/enums/musicScoreEnum'
import type {VDom, VDomTagType} from '@/types/common'
import type {Barline, MusicScore} from '@/types/MusicScoreType'

/** 两条线左右间隙小于此值（px）视为紧贴 */
const ADJACENT_GAP = 1.5

const MERGE_TAGS = new Set<VDomTagType>(['barline_f', 'barline_b', 'close_line', 'linked_close_line', 'linked_barline'])

function isLightBarline(barline: Barline): boolean {
  return barline.type === BarlineTypeEnum.Single_barline || barline.type === BarlineTypeEnum.Dashed_barline
}

function adjacent(left: VDom, right: VDom): boolean {
  const gap = right.x - (left.x + left.w)
  return right.x >= left.x && gap < ADJACENT_GAP
}

/**
 * 前置小节线紧贴左侧的线时只留一条：
 * - 行首闭合线 + 首小节前置小节线 → 去掉闭合线（含连谱闭合线）
 * - 上一小节后置小节线 + 本小节前置小节线 → 去掉细线（单 / 虚线）；两条都是粗线（如反复结束 + 反复开始）都保留
 * 连谱小节线与对应小节线同 targetId，一起去掉。
 */
export function mergeAdjacentBarlines(vDoms: VDom[], musicScore: MusicScore): VDom[] {
  const byTarget = new Map<string, VDom[]>()
  for (const node of vDoms) {
    if (!node.targetId || !MERGE_TAGS.has(node.tag)) continue
    const list = byTarget.get(node.targetId)
    if (list) list.push(node)
    else byTarget.set(node.targetId, [node])
  }
  if (!byTarget.size) return vDoms

  const find = (id: string | undefined, tag: VDomTagType) =>
    id ? byTarget.get(id)?.find((node) => node.tag === tag) : undefined
  const drop = new Set<VDom>()
  const dropBarline = (id: string, tag: VDomTagType) => {
    for (const node of byTarget.get(id) ?? []) {
      if (node.tag === tag || node.tag === 'linked_barline') drop.add(node)
    }
  }

  for (const grandStaff of musicScore.grandStaffs) {
    for (const staff of grandStaff.staves) {
      staff.measures.forEach((measure, mi) => {
        const front = measure.barline_f
        const frontNode = find(front?.id, 'barline_f')
        if (!front || !frontNode) return
        if (mi === 0) {
          const close = find(`close-${staff.id}`, 'close_line')
          if (close && adjacent(close, frontNode)) {
            drop.add(close)
            if (find(front.id, 'linked_barline')) {
              const linkedClose = find(`linked-close-${staff.id}`, 'linked_close_line')
              if (linkedClose) drop.add(linkedClose)
            }
          }
          return
        }
        const back = staff.measures[mi - 1]?.barline_b
        const backNode = find(back?.id, 'barline_b')
        if (!back || !backNode || !adjacent(backNode, frontNode)) return
        if (isLightBarline(back)) dropBarline(back.id, 'barline_b')
        else if (isLightBarline(front)) dropBarline(front.id, 'barline_f')
      })
    }
  }
  return drop.size ? vDoms.filter((node) => !drop.has(node)) : vDoms
}
