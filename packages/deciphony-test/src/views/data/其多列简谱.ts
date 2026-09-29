import {BeamTypeEnum, getMeasureSlots, KeySignatureTypeEnum, slotSymbol} from '@deciphony/renderer'
import type {NoteNumber} from '@deciphony/renderer'
import staffData from './其多列'
import {convertStandardStaffToNumberNotation, isNoteNumber} from './scoreBuilder'
import {createNotesNumberInfo} from '@deciphony/extensions/dr-edit/score-builder/factories'

/**
 * 「其多列」简谱版：结构与五线谱版一致（双复谱表、多列、反复与连音线），
 * 由五线谱数据按 F 调首调唱名自动换算 syllable / octaveDot。
 */
const data = convertStandardStaffToNumberNotation(staffData, KeySignatureTypeEnum.F)

/** 复谱表1-单谱表1-小节1：第二个音符加前倚音、后倚音 */
const firstMeasure = data.grandStaffs[0]?.staves[0]?.measures[0]
const secondNote = firstMeasure ? getMeasureSlots(firstMeasure)[1] : undefined
if (secondNote && isNoteNumber(secondNote)) {
    const note = slotSymbol(secondNote) as NoteNumber
    const host = note.notesInfo[0]
    if (host) {
        note.graceNotes = [
            createNotesNumberInfo(2, {
                octaveDot: host.octaveDot,
                chronaxie: 16,
                beamType: BeamTypeEnum.None,
            }),
        ]
        note.graceNotesAfter = [
            createNotesNumberInfo(4, {
                octaveDot: host.octaveDot,
                chronaxie: 16,
                beamType: BeamTypeEnum.None,
            }),
        ]
    }
}

export default data
