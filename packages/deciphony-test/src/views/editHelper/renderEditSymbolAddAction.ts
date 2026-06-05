import {isNoteRest, isNoteSymbol} from 'deciphony-renderer'
import type {Chronaxie, Measure, MusicScore, NoteSymbol, NotesInfo, SlotData, VDom} from 'deciphony-renderer'
import {createNoteSymbol, createNotesInfo} from '../dr-extensions/dr-edit/score-builder/factories'
import {noteSymbolSvg} from './noteSvg'

/** 占位音符头高度 */
export const NOTE_HEAD_HEIGHT = 10.49
/** 小节高度（与 renderer 默认 measureHeight 一致） */
export const MEASURE_HEIGHT = 45
/** 小节线宽度 */
export const MEASURE_LINE = 1
/** 每单位 region 高度 */
export const PER_REGION_HEIGHT = MEASURE_HEIGHT / 8
/** 展示占位音符的标定范围（px） */
export const MEASURE_ADD_HOVER_RANGE = 50
/** 初始偏移，使音符头在 region 内居中 */
export const BASE_OFFSET = (MEASURE_HEIGHT / 4 - NOTE_HEAD_HEIGHT) / 2

const NOTE_HEAD_WIDTH: Partial<Record<Chronaxie, number>> = {
    256: 16,
    128: 14.59,
    64: 14.59,
    32: 14.59,
    16: 14.59,
    8: 14.59,
    4: 14.59,
    2: 14.59,
    1: 16,
}

const CHRONAXIE_TO_SVG_KEY: Record<Chronaxie, keyof typeof noteSymbolSvg.up> = {
    256: 1,
    128: 2,
    64: 4,
    32: 8,
    16: 16,
    8: 32,
    4: 64,
    2: 128,
    1: 256,
}

export type MeasureBounds = { x: number; y: number; w: number; h: number }

export type SnapPoint =
    | { kind: 'insert'; x: number; insertIndex: number }
    | { kind: 'onNote'; x: number; noteIndex: number }

export type GhostNotePreview = {
    visible: true
    measureId: string
    /** 相对小节插槽左上角 */
    x: number
    y: number
    region: number
    direction: 'up' | 'down'
    chronaxie: Chronaxie
    svgHtml: string
    snap: SnapPoint
}

export type MeasureAddActionResult =
    | { type: 'inserted' }
    | { type: 'noteInfoAdded' }
    | { type: 'selectNote'; slot: SlotData; notesInfoId: string }

export type SlotAnchor = {
    centerX: number
    noteIndex: number
    isNoteSymbol: boolean
}

/** 当前选中项是否为「小节添加音符」模式 */
export function isMeasureAddMode(selected: SlotData | null): selected is SlotData & { measure: Measure } {
    return selected?.measure != null && selected.self === selected.measure
}

/** region > 4 符干向下，region ≤ 4 符干向上 */
export function defaultDirection(region: number): 'up' | 'down' {
    return region > 4 ? 'down' : 'up'
}

export function yFromRegion(region: number): number {
    return BASE_OFFSET + (7 - region) * PER_REGION_HEIGHT
}

/** 与 renderer noteCenterY 同网格；不限制在 0–7，支持加线区 region */
export function regionFromRelativeY(relativeY: number): number {
    const raw = 7 - (relativeY - BASE_OFFSET) / PER_REGION_HEIGHT
    return Math.round(raw)
}

export function relativeYFromSvgY(svgY: number, bounds: MeasureBounds): number {
    return svgY - bounds.y - PER_REGION_HEIGHT / 2
}

export function regionFromSvgY(svgY: number, bounds: MeasureBounds): number {
    return regionFromRelativeY(relativeYFromSvgY(svgY, bounds))
}

/** 修改 notesInfo.region；同和弦已有相同 region 时不改 */
export function setNotesInfoRegion(note: NoteSymbol, info: NotesInfo, region: number): boolean {
    if (info.region === region) return false
    const conflict = note.notesInfo.some((ni) => ni !== info && ni.region === region)
    if (conflict) return false
    info.region = region
    info.direction = defaultDirection(region)
    return true
}

export function noteHeadWidth(chronaxie: Chronaxie): number {
    return NOTE_HEAD_WIDTH[chronaxie] ?? 14.59
}

export function previewSvgHtml(chronaxie: Chronaxie, direction: 'up' | 'down'): string {
    const key = CHRONAXIE_TO_SVG_KEY[chronaxie] ?? 4
    return noteSymbolSvg[direction][key]
}

export function findMeasureSlotVDom(vDomList: VDom[], measureId: string): VDom | undefined {
    return vDomList.find(
        (node) => node.tag === 'slot' && node.slotName === 'm' && node.slotData?.measure?.id === measureId,
    )
}

/** 按小节顺序收集各音符/休止符锚点 x（相对小节左上角，取符号中心） */
export function collectSlotAnchors(vDomList: VDom[], measure: Measure, measureX: number): SlotAnchor[] {
    const anchors: SlotAnchor[] = []
    for (let noteIndex = 0; noteIndex < measure.notes.length; noteIndex++) {
        const slot = measure.notes[noteIndex]!
        let id: string | undefined
        let tag: VDom['tag']
        if (isNoteSymbol(slot)) {
            id = slot.notesInfo[0]?.id
            tag = 'noteHead'
        } else if (isNoteRest(slot)) {
            id = slot.id
            tag = 'rest'
        } else {
            continue
        }
        if (!id) continue
        const vdom = vDomList.find((node) => node.targetId === id && node.tag === tag)
        if (vdom) {
            anchors.push({
                centerX: vdom.x + vdom.w / 2 - measureX,
                noteIndex,
                isNoteSymbol: isNoteSymbol(slot),
            })
        }
    }
    return anchors
}

/**
 * 计算占位音符可吸附的 x 点位
 * - insert：符号之间及两侧，插入新 NoteSymbol
 * - onNote：已有 NoteSymbol 中心，追加 noteInfo 或选中同 region 音符头
 */
export function computeSnapPoints(measureWidth: number, anchors: SlotAnchor[]): SnapPoint[] {
    if (anchors.length === 0) {
        return [{kind: 'insert', x: measureWidth / 2, insertIndex: 0}]
    }

    const points: SnapPoint[] = []
    for (const anchor of anchors) {
        if (anchor.isNoteSymbol) {
            points.push({kind: 'onNote', x: anchor.centerX, noteIndex: anchor.noteIndex})
        }
    }

    const contentLeft = 0
    const contentRight = measureWidth
    points.push({
        kind: 'insert',
        x: (contentLeft + anchors[0]!.centerX) / 2,
        insertIndex: 0,
    })
    for (let i = 1; i < anchors.length; i++) {
        points.push({
            kind: 'insert',
            x: (anchors[i - 1]!.centerX + anchors[i]!.centerX) / 2,
            insertIndex: i,
        })
    }
    points.push({
        kind: 'insert',
        x: (anchors[anchors.length - 1]!.centerX + contentRight) / 2,
        insertIndex: anchors.length,
    })
    return points
}

export function nearestSnapPoint(relativeX: number, snapPoints: SnapPoint[]): SnapPoint {
    let best = snapPoints[0]!
    let bestDist = Math.abs(relativeX - best.x)
    for (let i = 1; i < snapPoints.length; i++) {
        const candidate = snapPoints[i]!
        const dist = Math.abs(relativeX - candidate.x)
        if (dist < bestDist) {
            best = candidate
            bestDist = dist
        }
    }
    return best
}

export function findMeasureSlotElement(root: ParentNode, measureId: string): SVGGraphicsElement | null {
    const el = root.querySelector(`[data-target-id="m-${measureId}"]`)
    return el instanceof SVGGraphicsElement ? el : null
}

/**
 * getBBox 是元素**局部**坐标；乘 getCTM 得到根 svg **用户坐标系**（viewBox 单位，与 vDom.x/y 同一套）。
 * 只用 svg 内部变换链，不涉及屏幕/CSS。
 */
export function getGraphicsBoundsInSvg(el: SVGGraphicsElement): MeasureBounds {
    const bbox = el.getBBox()
    const ctm = el.getCTM()
    const toUser = (localX: number, localY: number) => {
        if (!ctm) return {x: localX, y: localY}
        const p = new DOMPoint(localX, localY).matrixTransform(ctm)
        return {x: p.x, y: p.y}
    }
    const corners = [
        toUser(bbox.x, bbox.y),
        toUser(bbox.x + bbox.width, bbox.y),
        toUser(bbox.x, bbox.y + bbox.height),
        toUser(bbox.x + bbox.width, bbox.y + bbox.height),
    ]
    const xs = corners.map((c) => c.x)
    const ys = corners.map((c) => c.y)
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)
    return {x: minX, y: minY, w: maxX - minX, h: maxY - minY}
}

export function measureBoundsFromVDom(vDomList: VDom[], measureId: string): MeasureBounds | null {
    const measureNode = findMeasureSlotVDom(vDomList, measureId)
    if (!measureNode) return null
    return {x: measureNode.x, y: measureNode.y, w: measureNode.w, h: measureNode.h}
}

/**
 * 小节在谱面上的范围。优先用选中 g 的 getBBox（局部→getCTM→用户坐标）；
 * 与 vDom 布局一致时二者等价，DOM 不可用时回退 vDom。
 */
export function resolveMeasureBounds(
    root: ParentNode,
    measureId: string,
    vDomList: VDom[],
    preferredEl?: Element | null,
): MeasureBounds | null {
    const candidates: (SVGGraphicsElement | null | undefined)[] = [
        preferredEl instanceof SVGGraphicsElement ? preferredEl : null,
        findMeasureSlotElement(root, measureId),
    ]
    for (const el of candidates) {
        if (!el) continue
        try {
            return getGraphicsBoundsInSvg(el)
        } catch {
            /* 未挂载时回退 vDom */
        }
    }
    return measureBoundsFromVDom(vDomList, measureId)
}

export function isPointerInMeasureAddRange(
    svgX: number,
    svgY: number,
    bounds: MeasureBounds,
    hoverRange = MEASURE_ADD_HOVER_RANGE,
): boolean {
    return (
        svgX >= bounds.x
        && svgX <= bounds.x + bounds.w
        && svgY >= bounds.y - hoverRange
        && svgY <= bounds.y + bounds.h + hoverRange
    )
}

/**
 * 指针事件的 clientX/Y 是浏览器视口像素，不是谱面坐标。
 * 经逆 CTM 映射到 svg 用户坐标系（viewBox，与 vDom 相同）；滚动/缩放会更新 CTM，映射结果仍对准鼠标下的谱面点。
 */
export function pointerToSvg(svg: SVGSVGElement, clientX: number, clientY: number): { x: number; y: number } {
    const pt = svg.createSVGPoint()
    pt.x = clientX
    pt.y = clientY
    const ctm = svg.getScreenCTM()
    if (!ctm) return {x: 0, y: 0}
    return pt.matrixTransform(ctm.inverse())
}

export function buildNoteHeadSlot(
    musicScore: MusicScore,
    measureSlot: SlotData & { measure: Measure },
    note: NoteSymbol,
    info: NotesInfo,
): SlotData {
    return {
        musicScore,
        grandStaff: measureSlot.grandStaff,
        singleStaff: measureSlot.singleStaff,
        measure: measureSlot.measure,
        note,
        info,
        self: info,
    }
}

export function findNoteHeadElement(root: ParentNode, notesInfoId: string): SVGElement | null {
    const el = root.querySelector(`[data-target-id="${notesInfoId}"][data-tag="noteHead"]`)
    return el instanceof SVGElement ? el : null
}

export type ResolveGhostNoteParams = {
    selected: SlotData | null
    vDomList: VDom[]
    svgX: number
    svgY: number
    measureBounds: MeasureBounds
    chronaxie?: Chronaxie
}

/** 根据指针位置计算占位音符；不在小节标定范围时返回 null */
export function resolveGhostNotePreview(params: ResolveGhostNoteParams): GhostNotePreview | null {
    const {selected, vDomList, svgX, svgY, measureBounds, chronaxie = 64} = params
    if (!isMeasureAddMode(selected)) return null

    const measure = selected.measure
    const measureNode = findMeasureSlotVDom(vDomList, measure.id)
    if (!measureNode || !isPointerInMeasureAddRange(svgX, svgY, measureBounds)) {
        return null
    }
    const relativeX = svgX - measureNode.x
    const anchors = collectSlotAnchors(vDomList, measure, measureNode.x)
    const snapPoints = computeSnapPoints(measureNode.w, anchors)
    const snap = nearestSnapPoint(relativeX, snapPoints)
    const region = regionFromSvgY(svgY, measureBounds)
    const direction = defaultDirection(region)
    let effectiveChronaxie = chronaxie
    if (snap.kind === 'onNote') {
        const note = measure.notes[snap.noteIndex]
        if (isNoteSymbol(note)) {
            effectiveChronaxie = note.notesInfo[0]?.chronaxie ?? chronaxie
        }
    }
    const headW = noteHeadWidth(effectiveChronaxie)

    return {
        visible: true,
        measureId: measure.id,
        x: snap.x - headW / 2,
        y: yFromRegion(region),
        region,
        direction,
        chronaxie: effectiveChronaxie,
        svgHtml: previewSvgHtml(effectiveChronaxie, direction),
        snap,
    }
}

/** 小节添加模式点击：插入音符 / 追加 noteInfo / 切换为音符头选中 */
export function applyMeasureAddAction(
    slot: SlotData & { measure: Measure },
    preview: GhostNotePreview,
    musicScore: MusicScore,
): MeasureAddActionResult | null {
    const measure = slot.measure

    if (preview.snap.kind === 'insert') {
        const note = createNoteSymbol({
            region: preview.region,
            chronaxie: preview.chronaxie,
            direction: preview.direction,
        })
        const at = Math.max(0, Math.min(preview.snap.insertIndex, measure.notes.length))
        measure.notes.splice(at, 0, note)
        return {type: 'inserted'}
    }

    const note = measure.notes[preview.snap.noteIndex]
    if (!note || !isNoteSymbol(note)) return null

    const existing = note.notesInfo.find((ni) => ni.region === preview.region)
    if (existing) {
        return {
            type: 'selectNote',
            slot: buildNoteHeadSlot(musicScore, slot, note, existing),
            notesInfoId: existing.id,
        }
    }

    note.notesInfo.push(
        createNotesInfo({
            region: preview.region,
            chronaxie: note.notesInfo[0]?.chronaxie ?? preview.chronaxie,
            direction: preview.direction,
        }),
    )
    return {type: 'noteInfoAdded'}
}
