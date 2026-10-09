import {AccidentalTypeEnum, BeamTypeEnum, getMeasureSlots, KeySignatureTypeEnum, slotSymbol} from '@deciphony/renderer'
import type {NoteNumber} from '@deciphony/renderer'
import staffData from './其多列'
import {convertStandardStaffToNumberNotation, isNoteNumber} from './scoreBuilder'
import {createAccidental, createNotesNumberInfo} from '@deciphony/extensions/dr-edit/score-builder/factories'

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

/** 复谱表1-单谱表1-小节2、3：有音高的音符依次挂 升 / 降 / 还原 / 重升 / 重降 */
const ACCIDENTAL_DEMO = [
    AccidentalTypeEnum.Sharp,
    AccidentalTypeEnum.Flat,
    AccidentalTypeEnum.Natural,
    AccidentalTypeEnum.Double_sharp,
    AccidentalTypeEnum.Double_flat,
]
{
    const measures = data.grandStaffs[0]?.staves[0]?.measures.slice(1, 3) ?? []
    const pitched = measures
        .flatMap((m) => getMeasureSlots(m))
        .filter(isNoteNumber)
        .map((slot) => (slotSymbol(slot) as NoteNumber).notesInfo[0])
        .filter((info) => info && info.syllable !== 0 && info.syllable !== 'X')
    pitched.forEach((info, i) => {
        info!.accidental = createAccidental(ACCIDENTAL_DEMO[i % ACCIDENTAL_DEMO.length]!)
    })
}

export default data
