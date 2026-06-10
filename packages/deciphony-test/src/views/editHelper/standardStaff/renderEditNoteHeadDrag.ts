import type {Measure, NoteSymbol, NotesInfo, SlotData, VDom} from 'deciphony-renderer'
import {
    type MeasureBounds,
    pointerToSvg,
    regionFromSvgY,
    resolveMeasureBounds,
    setNotesInfoRegion,
} from './renderEditSymbolAddAction'

/** 当前选中项是否为「音符头选中」模式 */
export function isNoteHeadSelected(
    selected: SlotData | null,
): selected is SlotData & { info: NotesInfo; note: NoteSymbol; measure: Measure } {
    return selected?.info != null && selected.self === selected.info && selected.note != null && selected.measure != null
}

export type NoteHeadDragSession = {
    pointerId: number
    notesInfoId: string
    info: NotesInfo
    note: NoteSymbol
    measureId: string
}

export function createNoteHeadDragSession(
    event: PointerEvent,
    slot: SlotData & { info: NotesInfo; note: NoteSymbol; measure: Measure },
): NoteHeadDragSession {
    return {
        pointerId: event.pointerId,
        notesInfoId: slot.info.id,
        info: slot.info,
        note: slot.note,
        measureId: slot.measure.id,
    }
}

/** 拖拽过程中按指针 y 更新 region，返回新 region（未变化则为 null） */
export function updateNoteHeadRegionByPointerY(
    session: NoteHeadDragSession,
    bounds: MeasureBounds,
    svgY: number,
): number | null {
    const region = regionFromSvgY(svgY, bounds)
    return setNotesInfoRegion(session.note, session.info, region) ? region : null
}

/**
 * 在顶层 svg 上跟踪指针（top-move），按小节 bounds 换算 region。
 * 不依赖音符头 g 的 dr-move，鼠标略超出音符头范围仍可拖拽。
 */
export function updateNoteHeadDragFromPointer(
    session: NoteHeadDragSession,
    svg: SVGSVGElement,
    root: ParentNode,
    vDomList: VDom[],
    clientX: number,
    clientY: number,
): number | null {
    const bounds = resolveMeasureBounds(root, session.measureId, vDomList)
    if (!bounds) return null
    const {y} = pointerToSvg(svg, clientX, clientY)
    return updateNoteHeadRegionByPointerY(session, bounds, y)
}
