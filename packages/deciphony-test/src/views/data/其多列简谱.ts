import {BeamTypeEnum, KeySignatureTypeEnum} from 'deciphony-renderer'
import staffData from './其多列'
import {convertStandardStaffToNumberNotation, isNoteNumber} from './scoreBuilder'
import {createNotesNumberInfo} from '../dr-extensions/dr-edit/score-builder/factories'

/**
 * 「其多列」简谱版：结构与五线谱版一致（双复谱表、多列、反复与连音线），
 * 由五线谱数据按 F 调首调唱名自动换算 syllable / octaveDot。
 */
const data = convertStandardStaffToNumberNotation(staffData, KeySignatureTypeEnum.F)

/** 复谱表1-单谱表1-小节1：第二个音符加前倚音、后倚音 */
const secondNote = data.grandStaffs[0]?.staves[0]?.measures[0]?.notes[1]
if (isNoteNumber(secondNote)) {
    const host = secondNote.notesInfo[0]
    if (host) {
        host.graceNotes = [
            createNotesNumberInfo(2, {
                octaveDot: host.octaveDot,
                chronaxie: 16,
                beamType: BeamTypeEnum.None,
            }),
        ]
        host.graceNotesAfter = [
            createNotesNumberInfo(4, {
                octaveDot: host.octaveDot,
                chronaxie: 16,
                beamType: BeamTypeEnum.None,
            }),
        ]
    }
}

export default data
