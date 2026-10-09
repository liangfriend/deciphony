import type {Skin, SlotConfig, VDom} from '@/types/common'
import type {GrandStaff, MusicScore} from '@/types/MusicScoreType'
import type {MusicScoreToVDomFn} from '@/render/resolveNotation'
import {buildNoteIndex, buildSlotIndex, type LocatedSlot, type NoteIndex} from '@/render/affiliated'

/** 单个复谱表（一行）的排版结果；坐标以本行顶边为 y = 0 */
export type RowLayoutResult = {
  nodes: VDom[]
  height: number
  slotIndex: Map<string, LocatedSlot>
  noteIndex: NoteIndex
}

/** 曲谱头尾（顶部留白、t / e 插槽）；e 的 y 按「没有复谱表」排，组装时再挪到最后一行之后 */
export type ScoreFrameResult = {
  head: VDom[]
  foot: VDom[]
  height: number
}

export type LayoutOptions = {skin?: Skin; skinName?: string}

/**
 * 只暴露一部分复谱表的曲谱视图：其余字段原样读原曲谱（响应式依赖照常收集）。
 * 曲谱级附属 / 小节号 / 顶部留白归全局层或头尾，这里屏蔽掉。
 */
function scoreView(musicScore: MusicScore, grandStaffs: GrandStaff[], row: boolean): MusicScore {
  return new Proxy(musicScore, {
    get(target, key) {
      if (key === 'grandStaffs') return grandStaffs
      if (key === 'affiliatedSymbols' || key === 'measureNumber') return undefined
      if (row && key === 'topSpaceHeight') return 0
      return Reflect.get(target, key)
    },
  })
}

/** 插槽上下文里的曲谱换回原曲谱（排版时传进去的是视图） */
function restoreSlotData(nodes: VDom[], view: MusicScore, musicScore: MusicScore): void {
  for (const node of nodes) {
    const data = node.slotData
    if (!data) continue
    if (data.musicScore === view) data.musicScore = musicScore
    if (data.self === view) data.self = musicScore
  }
}

function rowHeight(nodes: readonly VDom[]): number {
  const g = nodes.find((node) => node.tag === 'slot' && node.slotName === 'g')
  if (g) return g.h
  let bottom = 0
  for (const node of nodes) {
    if (node.tag === 'slot' || node.tag === 'space') bottom = Math.max(bottom, node.y + node.h)
  }
  return bottom
}

export function layoutGrandStaffRow(
  toVDom: MusicScoreToVDomFn,
  musicScore: MusicScore,
  grandStaff: GrandStaff,
  slotConfig: SlotConfig,
  options: LayoutOptions,
): RowLayoutResult {
  const staffs = [grandStaff]
  const view = scoreView(musicScore, staffs, true)
  const nodes = toVDom(view, {...slotConfig, t: undefined, e: undefined}, options)
  restoreSlotData(nodes, view, musicScore)
  return {
    nodes,
    height: rowHeight(nodes),
    slotIndex: buildSlotIndex(staffs),
    noteIndex: buildNoteIndex(staffs),
  }
}

export function layoutScoreFrame(
  toVDom: MusicScoreToVDomFn,
  musicScore: MusicScore,
  slotConfig: SlotConfig,
  options: LayoutOptions,
): ScoreFrameResult {
  const view = scoreView(musicScore, [], false)
  const nodes = toVDom(view, slotConfig, options)
  restoreSlotData(nodes, view, musicScore)
  const head: VDom[] = []
  const foot: VDom[] = []
  let height = 0
  for (const node of nodes) {
    if (node.tag === 'slot' && node.slotName === 'e') {
      foot.push(node)
    } else {
      head.push(node)
      height = Math.max(height, node.y + node.h)
    }
  }
  return {head, foot, height}
}
