import type {SlotData, VDom, VDomTagType, SkinPack} from '@/types/common'
import type {GrandStaff, MusicScore} from '@/types/MusicScoreType'
import type {NodeIdMap} from '@/standardStaff/render/types'
import {
  renderScoreLevelAffiliatedSymbols,
  type LocatedSlot,
  type NoteIndex,
  type RenderAffiliatedContext,
} from '@/render/affiliated'
import {applyRelativeFramesToVDomRange, collectScoreAffiliatedFrameMap} from '@/render/vdomFrame'
import {buildMeasureNumberVDoms} from '@/render/measureNumber'
import {buildStaffAnchors} from '@/render/notation/createNotationDriver'
import {primaryStaffType} from '@/render/staffType'
import {assignVDomPatch, isVDomRenderEqual, vdomNodeKey} from '@/render/update'
import {VDomIndex, type VDomLookup} from '@/render/vdomIndex'
import type {RowLayoutResult, ScoreFrameResult} from './rowLayout'

/**
 * 行内 zIndex ≥ 该值的节点画在全局层（跨行附属、小节号）之上，其余画在之下：
 * 小节透明底 / 插槽 / 边距在下，连音线、房子记号可点；音符头在上，不被附属符号挡住。
 */
export const ROW_FRONT_Z = 1150

/** 一个渲染分组（曲谱头、某个复谱表、曲谱尾、全局层） */
export type ScoreLayerView = {
  key: string
  /** 对外节点（绝对坐标）；行内按 zIndex 升序 */
  nodes: VDom[]
  /** 实际交给组件渲染的数组：原地改过的节点换成浅拷贝，组件才会刷新 */
  back: VDom[]
  front: VDom[]
  /**
   * 整行平移量：行高变化后，下方行的对外节点坐标已原地改好，但渲染数组不动（组件不重渲染），
   * 由外层 g 的 translate(0, dy) 补上。该行下次重建 / 被 patch 时再整体换拷贝并归零。
   */
  dy: number
}

type LayerState = ScoreLayerView & {
  source: unknown
  offsetY: number
  grandStaffId?: string
  result?: RowLayoutResult
}

export type ScoreAssembleInput = {
  musicScore: MusicScore
  frame: ScoreFrameResult
  rows: { grandStaff: GrandStaff; result: RowLayoutResult }[]
  skinName: string
  /** 整份皮肤包。附属符号按锚点单谱表的谱种取其中一套 */
  skinPack: SkinPack
}

export type ScoreAssembleOutput = {
  /** 曲谱头、各复谱表、曲谱尾（按纵向顺序） */
  rows: ScoreLayerView[]
  global: ScoreLayerView
  /** 扁平对外列表：各行下层 → 全局层 → 各行上层 */
  list: VDom[]
  /** 本次重新排版的复谱表 id */
  changedRowIds: string[]
}

function hasPoints(node: VDom): boolean {
  const s = node.startPoint
  const e = node.endPoint
  return !!s && !!e && (s.x !== 0 || s.y !== 0 || e.x !== 0 || e.y !== 0)
}

type BendSpecial = NonNullable<VDom['special']['bend']>
type BendPeriod = BendSpecial['period_one']

function shiftBend(bend: BendSpecial, dy: number): BendSpecial {
  const pt = (p: { x: number; y: number }) => ({x: p.x, y: p.y + dy})
  const period = (p: BendPeriod): BendPeriod => ({
    ...p,
    relativeStartPoint: pt(p.relativeStartPoint),
    relativeEndPoint: pt(p.relativeEndPoint),
    relativeStartControlPoint: pt(p.relativeStartControlPoint),
    relativeEndControlPoint: pt(p.relativeEndControlPoint),
    ...(p.relativeTextPoint ? {relativeTextPoint: pt(p.relativeTextPoint)} : {}),
  })
  return {
    ...bend,
    period_one: period(bend.period_one),
    ...(bend.period_two ? {period_two: period(bend.period_two)} : {}),
  }
}

/**
 * 纵向平移（写入 target；target 可以是 node 自己或其拷贝）。
 * 符杠 / 连音线 / 琶音 / 推弦等按 startPoint、endPoint（推弦另有折线点）绝对坐标绘制，
 * 外层 g 还会 translate(x, y)，所以这类节点只平移点，不动 y。
 */
function translateY(target: VDom, node: VDom, dy: number): VDom {
  if (dy === 0) return target
  const bend = node.special?.bend
  if (hasPoints(node) || bend) {
    target.startPoint = {x: node.startPoint.x, y: node.startPoint.y + dy}
    target.endPoint = {x: node.endPoint.x, y: node.endPoint.y + dy}
    if (bend) target.special = {...node.special, bend: shiftBend(bend, dy)}
  } else {
    target.y = node.y + dy
  }
  return target
}

function sameSlotData(a: SlotData | undefined, b: SlotData | undefined): boolean {
  if (a === b) return true
  if (!a || !b) return false
  return a.musicScore === b.musicScore
    && a.grandStaff === b.grandStaff
    && a.singleStaff === b.singleStaff
    && a.measure === b.measure
    && a.note === b.note
    && a.info === b.info
    && a.self === b.self
}

/** 未变化的节点保留旧引用（组件跳过更新）；插槽上下文指向的数据对象换了也算变化 */
function mergeNodes(current: readonly VDom[], next: VDom[]): VDom[] {
  if (!current.length) return next
  const pool = new Map<string, VDom[]>()
  for (const node of current) {
    const key = vdomNodeKey(node)
    const list = pool.get(key)
    if (list) list.push(node)
    else pool.set(key, [node])
  }
  return next.map((node) => {
    const candidates = pool.get(vdomNodeKey(node))
    if (!candidates?.length) return node
    const at = candidates.findIndex((old) => isVDomRenderEqual(old, node) && sameSlotData(old.slotData, node.slotData))
    if (at < 0) return node
    return candidates.splice(at, 1)[0]!
  })
}

/** 全局层用的 NodeIdMap：按需从索引拼出 tag → vDom，写入只进自己的缓存 */
class LookupIdMap {
  private readonly own = new Map<string, Partial<Record<VDomTagType, VDom>>>()

  constructor(private readonly index: VDomIndex) {
  }

  get(id: string): Partial<Record<VDomTagType, VDom>> | undefined {
    const cached = this.own.get(id)
    if (cached) return cached
    const list = this.index.byTargetId(id)
    if (!list.length) return undefined
    const record: Partial<Record<VDomTagType, VDom>> = {}
    for (const node of list) record[node.tag] = node
    this.own.set(id, record)
    return record
  }

  set(id: string, record: Partial<Record<VDomTagType, VDom>>): this {
    this.own.set(id, record)
    return this
  }

  * values(): IterableIterator<Partial<Record<VDomTagType, VDom>>> {
    for (const list of this.index.lists()) {
      const id = list[0]?.targetId
      if (!id) continue
      yield this.get(id)!
    }
  }
}

/**
 * 增量组装：按复谱表缓存排版结果，只有结果对象换了的行才重新合并 / 更新索引；
 * 行高变化只把后面的行整体平移。跨行附属与小节号每次重算（量小）。
 */
export class ScoreAssembler {
  private readonly rowStates = new Map<GrandStaff, LayerState>()
  private readonly head: LayerState = this.createState('head')
  private readonly foot: LayerState = this.createState('foot')
  private readonly global: LayerState = this.createState('global')
  private readonly index = new VDomIndex()
  private readonly slotIndex = new Map<string, LocatedSlot>()
  private readonly noteIndex: NoteIndex = {staffOf: new Map(), stemUp: new Set()}
  private readonly ownerOf = new WeakMap<VDom, LayerState>()
  private readonly apiOf = new WeakMap<VDom, VDom>()
  private seq = 0
  private output: ScoreAssembleOutput | null = null

  get lookup(): VDomLookup {
    return this.index
  }

  get current(): ScoreAssembleOutput | null {
    return this.output
  }

  /** 渲染数组里的节点 → 对外节点（原地改过的节点渲染用的是拷贝） */
  toApiNode(node: VDom): VDom {
    return this.apiOf.get(node) ?? node
  }

  reset(): void {
    this.rowStates.clear()
    for (const state of [this.head, this.foot, this.global]) {
      state.source = undefined
      state.nodes = []
      state.back = []
      state.front = []
      state.dy = 0
    }
    this.index.clear()
    this.slotIndex.clear()
    this.noteIndex.staffOf.clear()
    this.noteIndex.stemUp.clear()
    this.output = null
  }

  assemble(input: ScoreAssembleInput): ScoreAssembleOutput {
    const {frame} = input
    const changedRowIds: string[] = []

    type Plan = { state: LayerState; result: RowLayoutResult; offsetY: number; rebuild: boolean }
    const plans: Plan[] = []
    let y = frame.height
    const alive = new Set<GrandStaff>()
    for (const {grandStaff, result} of input.rows) {
      alive.add(grandStaff)
      let state = this.rowStates.get(grandStaff)
      if (!state) {
        state = this.createState(`row-${++this.seq}`)
        this.rowStates.set(grandStaff, state)
      }
      state.grandStaffId = grandStaff.id
      plans.push({state, result, offsetY: y, rebuild: state.source !== result})
      y += result.height
    }

    // 先整体撤掉要换的行，再加新的：音符在行间移动时不会被后处理的行误删
    for (const [grandStaff, state] of this.rowStates) {
      if (alive.has(grandStaff)) continue
      this.dropRowIndexes(state)
      this.rowStates.delete(grandStaff)
    }
    for (const plan of plans) {
      if (plan.rebuild) this.dropRowIndexes(plan.state)
    }
    for (const plan of plans) {
      const {state, result, offsetY} = plan
      if (plan.rebuild) {
        this.rebuild(state, result, result.nodes, offsetY)
        state.result = result
        for (const [id, located] of result.slotIndex) this.slotIndex.set(id, located)
        for (const [id, staffId] of result.noteIndex.staffOf) this.noteIndex.staffOf.set(id, staffId)
        for (const id of result.noteIndex.stemUp) this.noteIndex.stemUp.add(id)
        if (state.grandStaffId) changedRowIds.push(state.grandStaffId)
      } else if (state.offsetY !== offsetY) {
        this.shift(state, offsetY)
      }
    }

    this.sync(this.head, frame, frame.head, 0)
    this.sync(this.foot, frame, frame.foot, y - frame.height)

    this.index.remove(this.global.nodes)
    this.rebuild(this.global, null, this.renderGlobal(input), 0, true)

    const rows = [this.head, ...plans.map((plan) => plan.state), this.foot]
    const back: VDom[] = []
    const front: VDom[] = []
    for (const state of rows) {
      for (const node of state.nodes) {
        if ((node.zIndex ?? 0) >= ROW_FRONT_Z) front.push(node)
        else back.push(node)
      }
    }
    this.output = {
      rows,
      global: this.global,
      list: back.concat(this.global.nodes, front),
      changedRowIds,
    }
    return this.output
  }

  /** 按 targetId 原地改第一个匹配节点，并让所在分组用新拷贝重渲染；返回是否找到 */
  patch(targetId: string, patch: Partial<VDom>): boolean {
    const node = this.index.find(targetId)
    if (!node) return false
    assignVDomPatch(node, patch)
    const state = this.ownerOf.get(node)
    if (state?.dy) {
      this.rebase(state)
    } else if (state) {
      const replace = (list: VDom[]) => {
        const at = list.findIndex((item) => this.toApiNode(item) === node)
        if (at < 0) return list
        const next = list.slice()
        next[at] = this.renderCopy(node)
        return next
      }
      state.back = replace(state.back)
      state.front = replace(state.front)
    }
    return true
  }

  private createState(key: string): LayerState {
    return {key, nodes: [], back: [], front: [], dy: 0, source: undefined, offsetY: 0}
  }

  /** 平移过的分组：全部换成按当前坐标的拷贝（组件重渲染），外层平移归零 */
  private rebase(state: LayerState): void {
    const back: VDom[] = []
    const front: VDom[] = []
    for (const node of state.nodes) {
      const copy = this.renderCopy(node)
      if (state.key !== 'global' && (node.zIndex ?? 0) >= ROW_FRONT_Z) front.push(copy)
      else back.push(copy)
    }
    state.back = back
    state.front = front
    state.dy = 0
  }

  private renderCopy(node: VDom): VDom {
    const copy = {...node}
    this.apiOf.set(copy, node)
    return copy
  }

  private dropRowIndexes(state: LayerState): void {
    this.index.remove(state.nodes)
    const old = state.result
    if (!old) return
    for (const [id, located] of old.slotIndex) {
      if (this.slotIndex.get(id) === located) this.slotIndex.delete(id)
    }
    for (const id of old.noteIndex.staffOf.keys()) this.noteIndex.staffOf.delete(id)
    for (const id of old.noteIndex.stemUp) this.noteIndex.stemUp.delete(id)
    state.result = undefined
    state.source = undefined
  }

  /** 头尾：结果变了重建，只是位置变了就平移 */
  private sync(state: LayerState, source: unknown, local: readonly VDom[], offsetY: number): void {
    if (state.source !== source) {
      this.index.remove(state.nodes)
      this.rebuild(state, source, local, offsetY)
    } else if (state.offsetY !== offsetY) {
      this.shift(state, offsetY)
    }
  }

  private rebuild(state: LayerState, source: unknown, local: readonly VDom[], offsetY: number, single = false): void {
    const placed = local.map((node) => translateY({...node}, node, offsetY))
    const nodes = mergeNodes(state.nodes, placed)
    // 平移过的分组里，复用节点的 DOM 还停在平移前的位置，要换拷贝强制重渲染
    const shifted = state.dy !== 0
    const render = (node: VDom) => shifted ? this.renderCopy(node) : node
    state.nodes = nodes
    state.source = source
    state.offsetY = offsetY
    state.dy = 0
    this.index.add(nodes)
    for (const node of nodes) this.ownerOf.set(node, state)
    if (single) {
      state.back = shifted ? nodes.map(render) : nodes
      state.front = []
      return
    }
    const back: VDom[] = []
    const front: VDom[] = []
    for (const node of nodes) {
      if ((node.zIndex ?? 0) >= ROW_FRONT_Z) front.push(render(node))
      else back.push(render(node))
    }
    state.back = back
    state.front = front
  }

  /** 对外节点原地平移；渲染数组不动，靠外层 translate */
  private shift(state: LayerState, offsetY: number): void {
    const dy = offsetY - state.offsetY
    state.offsetY = offsetY
    state.dy += dy
    for (const node of state.nodes) translateY(node, {...node}, dy)
  }

  private renderGlobal(input: ScoreAssembleInput): VDom[] {
    const {musicScore} = input
    const anchors = buildStaffAnchors(musicScore, input.skinPack)
    const firstStaffId = musicScore.grandStaffs[0]?.staves[0]?.id
    const fallback = firstStaffId ? anchors.get(firstStaffId) : undefined
    const ctx: RenderAffiliatedContext = {
      VDoms: [],
      idMap: new LookupIdMap(this.index) as unknown as NodeIdMap,
      skinName: input.skinName,
      notationType: fallback?.type ?? primaryStaffType(musicScore),
      skin: fallback?.skin,
      measureHeight: fallback?.measureHeight,
      staffAnchors: anchors,
      slotIndex: this.slotIndex,
      noteIndex: this.noteIndex,
    }
    renderScoreLevelAffiliatedSymbols(musicScore, ctx)
    const frames = collectScoreAffiliatedFrameMap(musicScore, (id) => this.slotIndex.get(id)?.slot)
    applyRelativeFramesToVDomRange(ctx.VDoms, frames)
    const nodes = ctx.VDoms.concat(buildMeasureNumberVDoms(musicScore, (id) => this.index.find(id, 'measure')))
    return nodes.sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
  }
}
