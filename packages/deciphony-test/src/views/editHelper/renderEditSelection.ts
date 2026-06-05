import {isNoteSymbol} from '@/index'
import type {
    MusicScore,
    NoteNumber,
    NoteSymbol,
    SlotData,
    VDom,
} from '@/index'
import {
    locateGrandStaff,
    locateMeasure,
    locateNoteSlot,
    locateNotesInfoById,
    locateSingleStaff,
} from '../dr-extensions/dr-edit/score-builder/locate'

const MEASURE_SYMBOL_KEYS = [
    'barline_f',
    'barline_b',
    'clef_f',
    'clef_b',
    'keySignature_f',
    'keySignature_b',
    'timeSignature_f',
    'timeSignature_b',
    'startRepeat',
    'endRepeat',
] as const

function buildSlotData(
    musicScore: MusicScore,
    ctx: {
        grandStaff?: SlotData['grandStaff']
        singleStaff?: SlotData['singleStaff']
        measure?: SlotData['measure']
        note?: SlotData['note']
        info?: SlotData['info']
        self: SlotData['self']
    },
): SlotData {
    return {
        musicScore,
        grandStaff: ctx.grandStaff ?? null,
        singleStaff: ctx.singleStaff ?? null,
        measure: ctx.measure ?? null,
        note: ctx.note ?? null,
        info: ctx.info ?? null,
        self: ctx.self,
    }
}

function findMeasureById(musicScore: MusicScore, id: string) {
    for (const grandStaff of musicScore.grandStaffs) {
        for (const singleStaff of grandStaff.staves) {
            for (const measure of singleStaff.measures) {
                if (measure.id === id) {
                    return locateMeasure(musicScore, measure)
                }
            }
        }
    }
    return null
}

function findNoteSlotById(musicScore: MusicScore, id: string) {
    for (const grandStaff of musicScore.grandStaffs) {
        for (const singleStaff of grandStaff.staves) {
            for (const measure of singleStaff.measures) {
                for (const slot of measure.notes) {
                    if (slot.id === id) {
                        return locateNoteSlot(musicScore, slot)
                    }
                }
            }
        }
    }
    return null
}

function findMeasureSymbolById(musicScore: MusicScore, id: string) {
    for (const grandStaff of musicScore.grandStaffs) {
        for (const singleStaff of grandStaff.staves) {
            for (const measure of singleStaff.measures) {
                for (const key of MEASURE_SYMBOL_KEYS) {
                    const symbol = measure[key]
                    if (symbol && typeof symbol === 'object' && 'id' in symbol && symbol.id === id) {
                        return {located: locateMeasure(musicScore, measure), symbol}
                    }
                }
            }
        }
    }
    return null
}

function findAffiliatedSymbolById(musicScore: MusicScore, id: string) {
    return musicScore.affiliatedSymbols.find((sym) => sym.id === id) ?? null
}

/** 将 dr-click 的 vDom 解析为 SlotData，供编辑选中态使用 */
export function slotDataFromVDom(musicScore: MusicScore, vdom: VDom): SlotData | null {
    if (vdom.tag === 'slot' && vdom.slotData) {
        return vdom.slotData
    }

    const id = vdom.targetId
    if (!id) return null

    if (vdom.tag === 'affiliation' && vdom.special?.slur) {
        const sym = findAffiliatedSymbolById(musicScore, id)
        if (sym) {
            return buildSlotData(musicScore, {self: sym as SlotData['self']})
        }
    }

    if (vdom.tag === 'affiliation' && vdom.special?.volta != null) {
        const sym = findAffiliatedSymbolById(musicScore, id)
        if (sym) {
            return buildSlotData(musicScore, {self: sym as SlotData['self']})
        }
    }

    if (vdom.tag === 'noteHead' || vdom.tag === 'noteStem' || vdom.tag === 'noteTail') {
        const located = locateNotesInfoById(musicScore, id)
        if (located) {
            return buildSlotData(musicScore, {
                grandStaff: located.grandStaff,
                singleStaff: located.singleStaff,
                measure: located.measure,
                note: located.note,
                info: located.notesInfo,
                self: located.notesInfo,
            })
        }
    }

    if (vdom.tag === 'rest') {
        const located = findNoteSlotById(musicScore, id)
        if (located) {
            return buildSlotData(musicScore, {
                grandStaff: located.grandStaff,
                singleStaff: located.singleStaff,
                measure: located.measure,
                self: located.slot as SlotData['self'],
            })
        }
    }

    if (vdom.tag === 'measure') {
        const located = findMeasureById(musicScore, id)
        if (located) {
            return buildSlotData(musicScore, {
                grandStaff: located.grandStaff,
                singleStaff: located.singleStaff,
                measure: located.measure,
                self: located.measure,
            })
        }
    }

    const measureSymbol = findMeasureSymbolById(musicScore, id)
    if (measureSymbol?.located) {
        return buildSlotData(musicScore, {
            grandStaff: measureSymbol.located.grandStaff,
            singleStaff: measureSymbol.located.singleStaff,
            measure: measureSymbol.located.measure,
            self: measureSymbol.symbol as SlotData['self'],
        })
    }

    const noteLocated = findNoteSlotById(musicScore, id)
    if (noteLocated) {
        const slot = noteLocated.slot
        const note = isNoteSymbol(slot) ? slot : null
        return buildSlotData(musicScore, {
            grandStaff: noteLocated.grandStaff,
            singleStaff: noteLocated.singleStaff,
            measure: noteLocated.measure,
            note,
            self: (note ?? slot) as SlotData['self'],
        })
    }

    for (const grandStaff of musicScore.grandStaffs) {
        if (grandStaff.id === id) {
            return buildSlotData(musicScore, {grandStaff, self: grandStaff})
        }
        if (grandStaff.bracket?.id === id) {
            const located = locateGrandStaff(musicScore, grandStaff)
            if (located) {
                return buildSlotData(musicScore, {
                    grandStaff: located.grandStaff,
                    self: grandStaff.bracket as SlotData['self'],
                })
            }
        }
        for (const singleStaff of grandStaff.staves) {
            if (singleStaff.id === id) {
                const located = locateSingleStaff(musicScore, singleStaff)
                if (located) {
                    return buildSlotData(musicScore, {
                        grandStaff: located.grandStaff,
                        singleStaff: located.singleStaff,
                        self: singleStaff,
                    })
                }
            }
        }
    }

    const affiliated = findAffiliatedSymbolById(musicScore, id)
    if (affiliated) {
        return buildSlotData(musicScore, {self: affiliated as SlotData['self']})
    }

    const measureLocated = findMeasureById(musicScore, id)
    if (measureLocated) {
        return buildSlotData(musicScore, {
            grandStaff: measureLocated.grandStaff,
            singleStaff: measureLocated.singleStaff,
            measure: measureLocated.measure,
            self: measureLocated.measure,
        })
    }

    return null
}

export function vdomSelectionKey(vdom: VDom): string {
    return `${vdom.tag}:${vdom.targetId ?? ''}`
}
