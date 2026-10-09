import {isNoteSymbol, slotSymbol} from '@/index'
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
    locateNotesNumberInfoById,
    locateSingleStaff,
    locateSlotAffiliatedSymbolById,
} from '@deciphony/extensions/dr-edit/score-builder/locate'
import {locateTabBendById, locateTabNoteInfoById} from '@deciphony/extensions/dr-edit/score-builder/tabNote'
import {locateDrumNotesInfoById, locateDrumRestById} from '@deciphony/extensions/dr-edit/score-builder/drumNote'
import {getMeasureSlots, MusicScoreTypeEnum} from '@deciphony/renderer'
import {locateNoteAffiliatedById} from './renderEditNoteAffiliatedDrag'

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
                for (const slot of getMeasureSlots(measure)) {
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

/** 鼓谱音符头 / 休止符在 up、down 两个声部里查找 */
function drumSlotDataFromVDom(musicScore: MusicScore, tag: VDom['tag'], id: string): SlotData | null {
    if (tag === 'noteHead' || tag === 'noteStem' || tag === 'noteTail') {
        const located = locateDrumNotesInfoById(musicScore, id)
        if (!located) return null
        return buildSlotData(musicScore, {
            grandStaff: located.grandStaff,
            singleStaff: located.singleStaff,
            measure: located.measure,
            note: located.note as unknown as SlotData['note'],
            info: located.info as unknown as SlotData['info'],
            self: located.info as unknown as SlotData['self'],
        })
    }
    if (tag === 'rest') {
        const located = locateDrumRestById(musicScore, id)
        if (!located) return null
        return buildSlotData(musicScore, {
            grandStaff: located.grandStaff,
            singleStaff: located.singleStaff,
            measure: located.measure,
            self: located.rest as unknown as SlotData['self'],
        })
    }
    return null
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
            return buildSlotData(musicScore, {self: sym as unknown as SlotData['self']})
        }
    }

    if (vdom.tag === 'affiliation' && (vdom.special?.arpeggio || vdom.special?.strumming)) {
        const located = locateSlotAffiliatedSymbolById(musicScore, id)
        if (located) {
            return buildSlotData(musicScore, {self: located.symbol as unknown as SlotData['self']})
        }
    }

    if (vdom.tag === 'affiliation' && vdom.special?.pedal) {
        const sym = findAffiliatedSymbolById(musicScore, id)
        if (sym) {
            return buildSlotData(musicScore, {self: sym as unknown as SlotData['self']})
        }
    }

    if (vdom.tag === 'affiliation' && vdom.special?.volta != null) {
        const sym = findAffiliatedSymbolById(musicScore, id)
        if (sym) {
            return buildSlotData(musicScore, {self: sym as unknown as SlotData['self']})
        }
    }

    if (vdom.tag === 'affiliation') {
        const located = locateNoteAffiliatedById(musicScore, id)
        if (located) {
            return buildSlotData(musicScore, {
                grandStaff: located.grandStaff,
                singleStaff: located.singleStaff,
                measure: located.measure,
                note: located.note as SlotData['note'],
                info: located.info as SlotData['info'],
                self: located.symbol as unknown as SlotData['self'],
            })
        }
    }

    if (vdom.tag === 'tabNoteNumber' || vdom.tag === 'arpeggio' || vdom.tag === 'strumming') {
        const located = locateTabNoteInfoById(musicScore, id)
        if (located) {
            return buildSlotData(musicScore, {
                grandStaff: located.grandStaff,
                singleStaff: located.singleStaff,
                measure: located.measure,
                note: located.note as unknown as SlotData['note'],
                info: located.info as unknown as SlotData['info'],
                self: located.info as unknown as SlotData['self'],
            })
        }
    }

    if (vdom.tag === 'bend') {
        const located = locateTabBendById(musicScore, id)
        if (located) {
            return buildSlotData(musicScore, {
                grandStaff: located.grandStaff,
                singleStaff: located.singleStaff,
                measure: located.measure,
                note: located.note as unknown as SlotData['note'],
                info: located.info as unknown as SlotData['info'],
                self: located.bend as unknown as SlotData['self'],
            })
        }
    }

    if (musicScore.type === MusicScoreTypeEnum.DrumNotation) {
        const drumSlot = drumSlotDataFromVDom(musicScore, vdom.tag, id)
        if (drumSlot) return drumSlot
    }

    if (
        vdom.tag === 'noteHead'
        || vdom.tag === 'noteNumber'
        || vdom.tag === 'noteStem'
        || vdom.tag === 'noteTail'
    ) {
        const locatedStaff = locateNotesInfoById(musicScore, id)
        if (locatedStaff) {
            return buildSlotData(musicScore, {
                grandStaff: locatedStaff.grandStaff,
                singleStaff: locatedStaff.singleStaff,
                measure: locatedStaff.measure,
                note: locatedStaff.note,
                info: locatedStaff.notesInfo,
                self: locatedStaff.notesInfo,
            })
        }
        const locatedNumber = locateNotesNumberInfoById(musicScore, id)
        if (locatedNumber) {
            return buildSlotData(musicScore, {
                grandStaff: locatedNumber.grandStaff,
                singleStaff: locatedNumber.singleStaff,
                measure: locatedNumber.measure,
                note: locatedNumber.note,
                info: locatedNumber.notesNumberInfo,
                self: locatedNumber.notesNumberInfo,
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
                self: located.slot as unknown as SlotData['self'],
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
            self: measureSymbol.symbol as unknown as SlotData['self'],
        })
    }

    const noteLocated = findNoteSlotById(musicScore, id)
    if (noteLocated) {
        const slot = noteLocated.slot
        const body = slotSymbol(slot)
        const note = isNoteSymbol(body) ? body : null
        return buildSlotData(musicScore, {
            grandStaff: noteLocated.grandStaff,
            singleStaff: noteLocated.singleStaff,
            measure: noteLocated.measure,
            note,
            self: (note ?? body ?? slot) as unknown as SlotData['self'],
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
                    self: grandStaff.bracket as unknown as SlotData['self'],
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
        return buildSlotData(musicScore, {self: affiliated as unknown as SlotData['self']})
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
