import type {VDom} from '@/types/common'
import type {MusicScore} from '@/types/MusicScoreType'
import {applyRelativeFrameToVDom} from '@/render/vdomFrame'

/** 字号 = 小节高 × 该比例 */
const FONT_RATIO = 0.3
/** 小节号底边与小节顶的间距 = 字号 × 该比例 */
const GAP_RATIO = 0.3
/** 估算文字宽度：每个字符 ≈ 字号 × 该比例 */
const CHAR_W_RATIO = 0.6
const MEASURE_NUMBER_Z = 1200

export function measureNumberText(number: number, bracket?: boolean): string {
  return bracket ? `(${number})` : String(number)
}

/**
 * 在各谱种 musicScoreToVDom 结果上追加小节号（vDoms 已按 zIndex 升序，插入后仍有序）。
 * 第 i 个复谱表（i ≥ 1）首小节上方、水平居中于谱表最左缘显示：前 i 个复谱表第一个单谱表的小节数之和 + 1。
 */
export function appendMeasureNumbers(vDoms: VDom[], musicScore: MusicScore): VDom[] {
  if (!musicScore.measureNumber) return vDoms
  const measureById = new Map<string, VDom>()
  for (const node of vDoms) {
    if (node.tag === 'measure' && node.targetId) measureById.set(node.targetId, node)
  }
  const added = buildMeasureNumberVDoms(musicScore, (id) => measureById.get(id))
  if (!added.length) return vDoms
  let at = vDoms.findIndex((node) => (node.zIndex ?? 0) > MEASURE_NUMBER_Z)
  if (at < 0) at = vDoms.length
  vDoms.splice(at, 0, ...added)
  return vDoms
}

/** 按小节 vDom 生成小节号节点（measureOf：小节 id → tag=measure 的 vDom） */
export function buildMeasureNumberVDoms(
  musicScore: MusicScore,
  measureOf: (measureId: string) => VDom | undefined,
): VDom[] {
  const mn = musicScore.measureNumber
  if (!mn) return []
  const added: VDom[] = []
  let count = 0
  musicScore.grandStaffs.forEach((grandStaff, gi) => {
    const measures = grandStaff.staves[0]?.measures ?? []
    const first = gi > 0 && measures[0] ? measureOf(measures[0].id) : undefined
    if (gi > 0 && first) {
      const number = count + 1
      const h = first.h * FONT_RATIO
      const w = measureNumberText(number, mn.bracket).length * h * CHAR_W_RATIO
      added.push(applyRelativeFrameToVDom({
        startPoint: {x: 0, y: 0},
        endPoint: {x: 0, y: 0},
        special: {measureNumber: {number, bracket: mn.bracket}},
        x: first.x - w / 2,
        y: first.y - h * GAP_RATIO - h,
        w,
        h,
        zIndex: MEASURE_NUMBER_Z,
        tag: 'measureNumber',
        skinName: first.skinName,
        targetId: mn.id,
        dataComment: '小节号',
      }, mn))
    }
    count += measures.length
  })
  return added
}
