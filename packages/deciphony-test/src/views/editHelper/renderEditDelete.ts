import {isNoteRest, isNoteSymbol} from 'deciphony-renderer'
import type {
    Measure,
    MusicScore,
    NoteRest,
    NoteSymbol,
    NotesInfo,
    SlotData,
} from 'deciphony-renderer'
import {deleteMeasure} from '../dr-extensions/dr-edit/edit-util'
import {isNoteHeadSelected} from './renderEditNoteHeadDrag'
import {removeVolta} from './renderEditMeasureProperties'
import {isMeasureAddMode} from './renderEditSymbolAddAction'
import {isSlurSelected} from './renderEditSlurDrag'
import {isVoltaSelected} from './renderEditVoltaDrag'

/** 小节上可选符号（对象字段，delete 移除）；不含 barline_b */
const MEASURE_OPTIONAL_SYMBOL_KEYS = [
    'barline_f',
    'clef_f',
    'clef_b',
    'keySignature_f',
    'keySignature_b',
    'timeSignature_f',
    'timeSignature_b',
    'startRepeat',
    'endRepeat',
] as const satisfies readonly (keyof Measure)[]

export function isRestSelected(
    selected: SlotData | null,
): selected is SlotData & { measure: Measure; self: NoteRest } {
    const self = selected?.self
    return selected?.measure != null && self != null && isNoteRest(self)
}

function removeScoreAffiliatedById(musicScore: MusicScore, symbolId: string): boolean {
    const idx = musicScore.affiliatedSymbols.findIndex((sym) => sym.id === symbolId)
    if (idx < 0) return false
    musicScore.affiliatedSymbols.splice(idx, 1)
    return true
}

function collectNotesInfoIdsInMeasure(measure: Measure): string[] {
    const ids: string[] = []
    for (const slot of measure.notes) {
        if (!isNoteSymbol(slot)) continue
        for (const info of slot.notesInfo) ids.push(info.id)
        for (const info of slot.graceNotes ?? []) ids.push(info.id)
        for (const info of slot.graceNotesAfter ?? []) ids.push(info.id)
    }
    return ids
}

/** 删小节前：移除引用该小节或其中音符的曲谱级附属符号 */
function purgeScoreAffiliatedForMeasure(musicScore: MusicScore, measure: Measure): void {
    const noteIds = new Set(collectNotesInfoIdsInMeasure(measure))
    musicScore.affiliatedSymbols = musicScore.affiliatedSymbols.filter((sym) => {
        if (sym.startId === measure.id || sym.endId === measure.id) return false
        if (noteIds.has(sym.startId) || noteIds.has(sym.endId)) return false
        return true
    })
}

function purgeScoreAffiliatedForNotesInfo(musicScore: MusicScore, notesInfoId: string): void {
    musicScore.affiliatedSymbols = musicScore.affiliatedSymbols.filter(
        (sym) => sym.startId !== notesInfoId && sym.endId !== notesInfoId,
    )
}

function purgeScoreAffiliatedForNoteSymbol(musicScore: MusicScore, note: NoteSymbol): void {
    for (const id of collectNotesInfoIdsFromNote(note)) {
        purgeScoreAffiliatedForNotesInfo(musicScore, id)
    }
}

function collectNotesInfoIdsFromNote(note: NoteSymbol): string[] {
    const ids = note.notesInfo.map((info) => info.id)
    for (const info of note.graceNotes ?? []) ids.push(info.id)
    for (const info of note.graceNotesAfter ?? []) ids.push(info.id)
    return ids
}

function deleteMeasureSlot(
    musicScore: MusicScore,
    slot: SlotData & { measure: Measure; singleStaff: NonNullable<SlotData['singleStaff']> },
): boolean {
    const {singleStaff, measure} = slot
    if (singleStaff.measures.length <= 1) return false
    purgeScoreAffiliatedForMeasure(musicScore, measure)
    deleteMeasure(singleStaff, measure)
    return true
}

function deleteNoteHeadSlot(
    musicScore: MusicScore,
    slot: SlotData & { info: NotesInfo; note: NoteSymbol; measure: Measure },
): boolean {
    const {info, note, measure} = slot
    const noteIndex = measure.notes.indexOf(note)
    if (noteIndex < 0) return false

    const infoIndex = note.notesInfo.findIndex((ni) => ni.id === info.id)
    if (infoIndex < 0) return false

    if (note.notesInfo.length <= 1) {
        purgeScoreAffiliatedForNoteSymbol(musicScore, note)
        measure.notes.splice(noteIndex, 1)
    } else {
        purgeScoreAffiliatedForNotesInfo(musicScore, info.id)
        note.notesInfo.splice(infoIndex, 1)
    }
    return true
}

function deleteRestSlot(slot: SlotData & { measure: Measure; self: NoteRest }): boolean {
    const {measure, self} = slot
    const idx = measure.notes.findIndex((item) => item.id === self.id)
    if (idx < 0) return false
    measure.notes.splice(idx, 1)
    return true
}

function deleteMeasureOptionalSymbol(slot: SlotData): boolean {
    const measure = slot.measure
    if (!measure) return false
    const selfId = (slot.self as { id?: string }).id
    if (!selfId) return false

    for (const key of MEASURE_OPTIONAL_SYMBOL_KEYS) {
        const symbol = measure[key]
        if (symbol && typeof symbol === 'object' && 'id' in symbol && symbol.id === selfId) {
            delete measure[key]
            return true
        }
    }
    return false
}

function deleteSingleNoteAffiliatedById(musicScore: MusicScore, symbolId: string): boolean {
    for (const grandStaff of musicScore.grandStaffs) {
        for (const singleStaff of grandStaff.staves) {
            for (const measure of singleStaff.measures) {
                for (const slot of measure.notes) {
                    if (isNoteSymbol(slot)) {
                        for (const info of slot.notesInfo) {
                            const idx = info.affiliatedSymbols.findIndex((sym) => sym.id === symbolId)
                            if (idx >= 0) {
                                info.affiliatedSymbols.splice(idx, 1)
                                return true
                            }
                        }
                        continue
                    }
                    if (isNoteRest(slot) && slot.affiliatedSymbols?.length) {
                        const idx = slot.affiliatedSymbols.findIndex((sym) => sym.id === symbolId)
                        if (idx >= 0) {
                            slot.affiliatedSymbols.splice(idx, 1)
                            return true
                        }
                    }
                }
            }
        }
    }
    return false
}

function deleteMeasureAffiliatedById(slot: SlotData, symbolId: string): boolean {
    const measure = slot.measure
    if (!measure?.affiliatedSymbols?.length) return false
    const idx = measure.affiliatedSymbols.findIndex((sym) => sym.id === symbolId)
    if (idx < 0) return false
    measure.affiliatedSymbols.splice(idx, 1)
    return true
}

function deleteMeasureAffiliatedByIdGlobal(musicScore: MusicScore, symbolId: string): boolean {
    for (const grandStaff of musicScore.grandStaffs) {
        for (const singleStaff of grandStaff.staves) {
            for (const measure of singleStaff.measures) {
                if (!measure.affiliatedSymbols?.length) continue
                const idx = measure.affiliatedSymbols.findIndex((sym) => sym.id === symbolId)
                if (idx >= 0) {
                    measure.affiliatedSymbols.splice(idx, 1)
                    return true
                }
            }
        }
    }
    return false
}

function deleteNotesInfoSubSymbol(slot: SlotData, symbolId: string): boolean {
    const info = slot.info
    if (!info) return false
    if (info.accidental?.id === symbolId) {
        delete info.accidental
        return true
    }
    if (info.augmentationDot?.id === symbolId) {
        delete info.augmentationDot
        return true
    }
    return false
}

/**
 * 按当前选中项删除曲谱数据。
 * 数组父级：measure.notes、notesInfo、affiliatedSymbols 等 splice；
 * 对象父级：measure 可选符号字段 delete。
 */
export function deleteSelectedItem(musicScore: MusicScore, selected: SlotData | null): boolean {
    if (!selected) return false

    if (isVoltaSelected(selected)) {
        removeVolta(musicScore, selected.self.id)
        return true
    }

    if (isSlurSelected(selected)) {
        return removeScoreAffiliatedById(musicScore, selected.self.id)
    }

    if (isNoteHeadSelected(selected)) {
        return deleteNoteHeadSlot(musicScore, selected)
    }

    if (isRestSelected(selected)) {
        return deleteRestSlot(selected)
    }

    if (isMeasureAddMode(selected)) {
        if (!selected.singleStaff) return false
        return deleteMeasureSlot(musicScore, selected as SlotData & {
            measure: Measure
            singleStaff: NonNullable<SlotData['singleStaff']>
        })
    }

    if (deleteMeasureOptionalSymbol(selected)) {
        return true
    }

    const selfId = selected.self && typeof selected.self === 'object' && 'id' in selected.self
        ? String(selected.self.id)
        : null
    if (!selfId) return false

    if (deleteNotesInfoSubSymbol(selected, selfId)) {
        return true
    }

    if (selected.measure && deleteMeasureAffiliatedById(selected, selfId)) {
        return true
    }

    if (deleteMeasureAffiliatedByIdGlobal(musicScore, selfId)) {
        return true
    }

    if (deleteSingleNoteAffiliatedById(musicScore, selfId)) {
        return true
    }

    if (deleteMeasureOptionalSymbolById(musicScore, selfId)) {
        return true
    }

    return removeScoreAffiliatedById(musicScore, selfId)
}

function deleteMeasureOptionalSymbolById(musicScore: MusicScore, symbolId: string): boolean {
    for (const grandStaff of musicScore.grandStaffs) {
        for (const singleStaff of grandStaff.staves) {
            for (const measure of singleStaff.measures) {
                for (const key of MEASURE_OPTIONAL_SYMBOL_KEYS) {
                    const symbol = measure[key]
                    if (symbol && typeof symbol === 'object' && 'id' in symbol && symbol.id === symbolId) {
                        delete measure[key]
                        return true
                    }
                }
            }
        }
    }
    return false
}
