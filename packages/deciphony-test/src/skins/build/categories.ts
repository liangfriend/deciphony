import {StandardStaffSkinKeyEnum} from 'deciphony-renderer'
import type {SkinSymbolCategory} from '../theme/types'

const CLEF_KEYS = new Set<string>([
    StandardStaffSkinKeyEnum.Treble,
    StandardStaffSkinKeyEnum.Bass,
    StandardStaffSkinKeyEnum.Alto,
    StandardStaffSkinKeyEnum.Tenor,
    StandardStaffSkinKeyEnum.Treble_f,
    StandardStaffSkinKeyEnum.Bass_f,
    StandardStaffSkinKeyEnum.Alto_f,
    StandardStaffSkinKeyEnum.Tenor_f,
])

const ACCIDENTAL_KEYS = new Set<string>([
    StandardStaffSkinKeyEnum.Sharp,
    StandardStaffSkinKeyEnum.Flat,
    StandardStaffSkinKeyEnum.Double_sharp,
    StandardStaffSkinKeyEnum.Double_flat,
    StandardStaffSkinKeyEnum.Natural,
])

const BARLINE_KEYS = new Set<string>([
    StandardStaffSkinKeyEnum.Single_barline,
    StandardStaffSkinKeyEnum.Double_barline,
    StandardStaffSkinKeyEnum.StartRepeat_barline,
    StandardStaffSkinKeyEnum.EndRepeat_barline,
    StandardStaffSkinKeyEnum.Dashed_barline,
    StandardStaffSkinKeyEnum.Final_barline,
    StandardStaffSkinKeyEnum.Start_end_repeat_barline,
    StandardStaffSkinKeyEnum.Dotted_barline,
    StandardStaffSkinKeyEnum.Reverse_barline,
    StandardStaffSkinKeyEnum.Heavy_barline,
    StandardStaffSkinKeyEnum.Heavy_double_barline,
    StandardStaffSkinKeyEnum.linked_single_barline,
    StandardStaffSkinKeyEnum.linked_double_barline,
    StandardStaffSkinKeyEnum.linked_startRepeat_barline,
    StandardStaffSkinKeyEnum.linked_endRepeat_barline,
    StandardStaffSkinKeyEnum.linked_dashed_barline,
    StandardStaffSkinKeyEnum.linked_final_barline,
    StandardStaffSkinKeyEnum.linked_start_end_repeat_barline,
    StandardStaffSkinKeyEnum.linked_dotted_barline,
    StandardStaffSkinKeyEnum.linked_reverse_barline,
    StandardStaffSkinKeyEnum.linked_heavy_barline,
    StandardStaffSkinKeyEnum.linked_heavy_double_barline,
])

const TIME_SIG_KEYS = new Set<string>([
    StandardStaffSkinKeyEnum['2_4'],
    StandardStaffSkinKeyEnum['3_4'],
    StandardStaffSkinKeyEnum['4_4'],
    StandardStaffSkinKeyEnum['5_4'],
    StandardStaffSkinKeyEnum['6_4'],
    StandardStaffSkinKeyEnum['3_8'],
    StandardStaffSkinKeyEnum['4_8'],
    StandardStaffSkinKeyEnum['5_8'],
    StandardStaffSkinKeyEnum['6_8'],
    StandardStaffSkinKeyEnum['7_8'],
    StandardStaffSkinKeyEnum['9_8'],
    StandardStaffSkinKeyEnum['12_8'],
    StandardStaffSkinKeyEnum.Common,
    StandardStaffSkinKeyEnum.Cut,
    StandardStaffSkinKeyEnum['2_2'],
    StandardStaffSkinKeyEnum['3_2'],
    StandardStaffSkinKeyEnum['4_2'],
])

const NOTE_HEAD_KEYS = new Set<string>([
    StandardStaffSkinKeyEnum.NoteHead_1,
    StandardStaffSkinKeyEnum.NoteHead_2,
    StandardStaffSkinKeyEnum.NoteHead_3,
])

const REST_KEYS = new Set<string>([
    StandardStaffSkinKeyEnum.Rest_1,
    StandardStaffSkinKeyEnum.Rest_2,
    StandardStaffSkinKeyEnum.Rest_3,
    StandardStaffSkinKeyEnum.Rest_4,
    StandardStaffSkinKeyEnum.Rest_5,
    StandardStaffSkinKeyEnum.Rest_6,
    StandardStaffSkinKeyEnum.Rest_7,
    StandardStaffSkinKeyEnum.Rest_8,
    StandardStaffSkinKeyEnum.Rest_9,
])

const DOT_KEYS = new Set<string>([
    StandardStaffSkinKeyEnum.AugmentationDot_1,
    StandardStaffSkinKeyEnum.AugmentationDot_2,
    StandardStaffSkinKeyEnum.AugmentationDot_3,
])

export function getStandardStaffCategory(key: string): SkinSymbolCategory {
    if (key === StandardStaffSkinKeyEnum.Measure) return 'measure'
    if (CLEF_KEYS.has(key)) return 'clef'
    if (ACCIDENTAL_KEYS.has(key)) return 'accidental'
    if (BARLINE_KEYS.has(key)) return 'barline'
    if (TIME_SIG_KEYS.has(key)) return 'timeSignature'
    if (NOTE_HEAD_KEYS.has(key)) return 'noteHead'
    if (REST_KEYS.has(key)) return 'rest'
    if (DOT_KEYS.has(key)) return 'augmentationDot'
    if (key === StandardStaffSkinKeyEnum.AddLine_u || key === StandardStaffSkinKeyEnum.AddLine_d) return 'addLine'
    if (key === StandardStaffSkinKeyEnum.NoteStem) return 'noteStem'
    if (key === StandardStaffSkinKeyEnum.NoteBeam) return 'noteBeam'
    if (key === StandardStaffSkinKeyEnum.Slur) return 'slur'
    if (key === StandardStaffSkinKeyEnum.Volta) return 'volta'
    if (key.startsWith('noteTail_')) return 'noteTail'
    if (/^(C|D|E|F|G|A|B)(_|_sharp|_flat)?$/.test(key) || key === 'C_flat') return 'keySignature'
    return 'other'
}
