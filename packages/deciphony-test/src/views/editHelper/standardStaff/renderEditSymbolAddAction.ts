import {isNoteRest, isNoteSymbol} from 'deciphony-renderer'
import type {Chronaxie, Measure, MusicScore, NoteSymbol, NotesInfo, SlotData, VDom} from 'deciphony-renderer'
import {createNoteRest, createNoteSymbol, createNotesInfo} from '../../dr-extensions/dr-edit/score-builder/factories'
import {DEFAULT_ADD_NOTE_STATE, type AddNoteSlotKind, type AddNoteState} from '../renderEditAddNoteState'
import {noteSymbolSvg, rest as restSymbolSvg} from './noteSvg'

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
    slotKind: AddNoteSlotKind
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

const REST_PREVIEW_HEIGHT: Partial<Record<Chronaxie, number>> = {
    256: 6,
    128: 6,
    64: 10,
    32: 8,
    16: 8,
    8: 8,
    4: 8,
    2: 8,
}

const REST_PREVIEW_WIDTH: Partial<Record<Chronaxie, number>> = {
    256: 10,
    128: 10,
    64: 8,
    32: 8,
    16: 8,
    8: 8,
    4: 8,
    2: 14,
}

/** 与 renderer 休止符纵向布局一致（相对小节插槽左上角） */
export function restYFromChronaxie(chronaxie: Chronaxie): number {
    const h = REST_PREVIEW_HEIGHT[chronaxie] ?? 8
    if (chronaxie === 256) return MEASURE_HEIGHT / 4
    if (chronaxie === 128) return MEASURE_HEIGHT / 2 - h
    return (MEASURE_HEIGHT - h) / 2
}

export function restPreviewWidth(chronaxie: Chronaxie): number {
    return REST_PREVIEW_WIDTH[chronaxie] ?? 8
}

export function previewRestSvgHtml(chronaxie: Chronaxie): string {
    return restSymbolSvg[chronaxie] ?? restSymbolSvg[64]
}

export function findMeasureSlotVDom(vDomList: VDom[], measureId: string): VDom | undefined {
    return vDomList.find(
        (node) => node.tag === 'slot' && node.slotName === 'm' && node.slotData?.measure?.id === measureId,
    )
}

/** 小节背景 vDom（tag=measure，targetId 为小节 id） */
export function findMeasureVDom(vDomList: VDom[], measureId: string): VDom | undefined {
    return vDomList.find((node) => node.tag === 'measure' && node.targetId === measureId)
}

/** 小节背景 DOM（Group 层 g，与 noteHead 查找方式一致） */
export function findMeasureElement(root: ParentNode, measureId: string): SVGElement | null {
    const el = root.querySelector(`[data-target-id="${measureId}"][data-tag="measure"]`)
    return el instanceof SVGElement ? el : null
}

/** 按 svg 坐标命中 m 插槽；`forSelection` 时仅小节矩形内，否则含上下加音扩展区 */
export function resolveMeasureSlotAtPointer(
    vDomList: VDom[],
    svgX: number,
    svgY: number,
    options?: { forSelection?: boolean },
): SlotData | null {
    const hoverRange = options?.forSelection ? 0 : MEASURE_ADD_HOVER_RANGE
    for (const node of vDomList) {
        if (node.tag !== 'slot' || node.slotName !== 'm' || !node.slotData?.measure) continue
        const bounds = {x: node.x, y: node.y, w: node.w, h: node.h}
        if (isPointerInMeasureAddRange(svgX, svgY, bounds, hoverRange)) {
            return node.slotData
        }
    }
    return null
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

export function isPointerInMeasureBounds(
    svgX: number,
    svgY: number,
    bounds: MeasureBounds,
): boolean {
    return (
        svgX >= bounds.x
        && svgX <= bounds.x + bounds.w
        && svgY >= bounds.y
        && svgY <= bounds.y + bounds.h
    )
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
    addNoteState?: AddNoteState
}

/** 根据指针位置与持续添加状态计算占位符号；不在小节标定范围时返回 null */
export function resolveGhostNotePreview(params: ResolveGhostNoteParams): GhostNotePreview | null {
    const {selected, vDomList, svgX, svgY, measureBounds, addNoteState = DEFAULT_ADD_NOTE_STATE} = params
    if (!isMeasureAddMode(selected)) return null

    const measure = selected.measure
    const measureNode = findMeasureSlotVDom(vDomList, measure.id)
    if (!measureNode || !isPointerInMeasureAddRange(svgX, svgY, measureBounds)) {
        return null
    }
    const relativeX = svgX - measureNode.x
    const anchors = collectSlotAnchors(vDomList, measure, measureNode.x)
    const snapPoints = computeSnapPoints(measureNode.w, anchors)
    let snap = nearestSnapPoint(relativeX, snapPoints)
    if (addNoteState.kind === 'rest') {
        const insertPoints = snapPoints.filter((point) => point.kind === 'insert')
        if (insertPoints.length > 0) {
            snap = nearestSnapPoint(relativeX, insertPoints)
        }
    }

    const effectiveChronaxie = addNoteState.chronaxie

    if (addNoteState.kind === 'rest') {
        const restW = restPreviewWidth(effectiveChronaxie)
        return {
            visible: true,
            measureId: measure.id,
            slotKind: 'rest',
            x: snap.x - restW / 2,
            y: restYFromChronaxie(effectiveChronaxie),
            region: 0,
            direction: 'up',
            chronaxie: effectiveChronaxie,
            svgHtml: previewRestSvgHtml(effectiveChronaxie),
            snap,
        }
    }

    const region = regionFromSvgY(svgY, measureBounds)
    const direction = defaultDirection(region)
    const headW = noteHeadWidth(effectiveChronaxie)

    return {
        visible: true,
        measureId: measure.id,
        slotKind: 'note',
        x: snap.x - headW / 2,
        y: yFromRegion(region),
        region,
        direction,
        chronaxie: effectiveChronaxie,
        svgHtml: previewSvgHtml(effectiveChronaxie, direction),
        snap,
    }
}

/** 小节添加模式点击：插入音符/休止符 / 追加 noteInfo / 切换为音符头选中 */
export function applyMeasureAddAction(
    slot: SlotData & { measure: Measure },
    preview: GhostNotePreview,
    musicScore: MusicScore,
): MeasureAddActionResult | null {
    const measure = slot.measure

    if (preview.snap.kind === 'insert') {
        const at = Math.max(0, Math.min(preview.snap.insertIndex, measure.notes.length))
        if (preview.slotKind === 'rest') {
            const rest = createNoteRest({chronaxie: preview.chronaxie})
            measure.notes.splice(at, 0, rest)
            return {type: 'inserted'}
        }
        const note = createNoteSymbol({
            region: preview.region,
            chronaxie: preview.chronaxie,
            direction: preview.direction,
        })
        measure.notes.splice(at, 0, note)
        return {type: 'inserted'}
    }

    if (preview.slotKind === 'rest') return null

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
