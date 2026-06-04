import type {Measure, NoteSymbol, NotesInfo, SlotData, VDom} from 'deciphony-renderer'
import {
    defaultDirection,
    findMeasureSlotVDom,
    regionFromRelativeY,
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

export function regionFromPointerInMeasure(
    vDomList: VDom[],
    measureId: string,
    svgY: number,
): number | null {
    const measureNode = findMeasureSlotVDom(vDomList, measureId)
    if (!measureNode) return null
    return regionFromRelativeY(svgY - measureNode.y)
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

/** 拖拽过程中按指针 y 更新 region，返回新 region（未变化则为 null） */
export function updateNoteHeadRegionByPointerY(
    session: NoteHeadDragSession,
    vDomList: VDom[],
    svgY: number,
): number | null {
    const region = regionFromPointerInMeasure(vDomList, session.measureId, svgY)
    if (region == null) return null
    return setNotesInfoRegion(session.note, session.info, region) ? region : null
}
