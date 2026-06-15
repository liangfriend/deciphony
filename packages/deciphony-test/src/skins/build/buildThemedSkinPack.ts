import {defaultSkin} from '@/skins/defaultSkin'
import type {SkinItem, SkinPack, NumberNotationSkinPack, StandardStaffSkinPack} from 'deciphony-renderer'
import {NumberNotationSkinKeyEnum, StandardStaffSkinKeyEnum} from 'deciphony-renderer'
import type {SkinTheme} from '../theme/types'
import {getStandardStaffCategory} from './categories'
import {
    buildAccidentalContent,
    buildAddLineContent,
    buildAugmentationDotContent,
    buildBarlineContent,
    buildClefContent,
    buildGenericContent,
    buildKeySignatureContent,
    buildMeasureContent,
    buildNoteHeadContent,
    buildNoteStemContent,
    buildNoteBeamColorContent,
    buildSlurColorContent,
    buildVoltaColorContent,
    buildNoteTailContent,
    buildNumberGlyph,
    buildNumberMeasure,
    buildRestContent,
    buildTimeSignatureContent,
} from './symbolBuilders'
import {buildCreativeContent} from './creativeSymbols'
import {themedRecolor} from './svgUtils'

function applyStandardStaffItem(theme: SkinTheme, key: string, base: SkinItem): string {
    const cat = getStandardStaffCategory(key)
    const enumKey = key as StandardStaffSkinKeyEnum
    switch (cat) {
        case 'measure':
            return buildMeasureContent(theme)
        case 'clef':
            return buildClefContent(theme, enumKey, base)
        case 'accidental':
            return buildAccidentalContent(theme, enumKey, base)
        case 'keySignature':
            return buildKeySignatureContent(theme, key, base)
        case 'timeSignature':
            return buildTimeSignatureContent(theme, base)
        case 'noteHead':
            return buildNoteHeadContent(theme, enumKey, base)
        case 'rest':
            return buildRestContent(theme, enumKey, base)
        case 'barline':
            return buildBarlineContent(theme, key, base)
        case 'augmentationDot':
            return buildAugmentationDotContent(theme, enumKey, base)
        case 'addLine':
            return buildAddLineContent(theme)
        case 'noteStem':
            return buildNoteStemContent(theme)
        case 'noteBeam':
            return buildNoteBeamColorContent(theme)
        case 'slur':
            return buildSlurColorContent(theme)
        case 'volta':
            return buildVoltaColorContent(theme)
        case 'noteTail':
            return buildNoteTailContent(theme, enumKey, base)
        default:
            return buildGenericContent(theme, base)
    }
}

function mapStandardStaff(pack: StandardStaffSkinPack, theme: SkinTheme): StandardStaffSkinPack {
    const out = {} as StandardStaffSkinPack
    for (const key of Object.keys(pack) as StandardStaffSkinKeyEnum[]) {
        const item = pack[key]
        out[key] = {...item, content: applyStandardStaffItem(theme, key, item)}
    }
    return out
}

function getNumberNotationCategory(key: string): string {
    if (key === NumberNotationSkinKeyEnum.Measure) return 'measure'
    if (key.startsWith('number_')) return 'number'
    if (/^(C|D|E|F|G|A|B)(_|_sharp|_flat)?$/.test(key) || key === 'C_flat') return 'keySignature'
    if ([
      '2_4', '3_4', '4_4', '5_4', '6_4',
      '3_8', '4_8', '5_8', '6_8', '7_8', '9_8', '12_8',
      'common', 'cut',
      '2_2', '3_2', '4_2',
    ].includes(key)) return 'timeSignature'
    if (['sharp', 'flat', 'double_sharp', 'double_flat', 'natural'].includes(key)) return 'accidental'
    if (key.startsWith('augmentationDot_')) return 'augmentationDot'
    if (key.includes('barline') || key === 'close_line' || key === 'linked_close_line') return 'barline'
    if (key.startsWith('reduceLine_') || key === 'addline' || key === 'octaveDot') return 'line'
    if (key === NumberNotationSkinKeyEnum.Slur) return 'slur'
    if (key === NumberNotationSkinKeyEnum.Volta) return 'volta'
    return 'other'
}

function applyNumberNotationItem(theme: SkinTheme, key: string, base: SkinItem): string {
    const cat = getNumberNotationCategory(key)
    const staffKey = key as StandardStaffSkinKeyEnum
    switch (cat) {
        case 'measure':
            return buildNumberMeasure(theme)
        case 'number': {
            const digit = key.replace('number_', '').toUpperCase()
            return buildNumberGlyph(theme, digit)
        }
        case 'keySignature':
            return buildKeySignatureContent(theme, key, base)
        case 'timeSignature':
            return buildTimeSignatureContent(theme, base)
        case 'accidental':
            return buildAccidentalContent(theme, staffKey, base)
        case 'augmentationDot':
            return buildAugmentationDotContent(theme, staffKey, base)
        case 'barline':
            return buildBarlineContent(theme, key, base)
        case 'line':
            return buildCreativeContent(theme, 'line', key, base)
                ?? themedRecolor(base.content, theme.ink, theme.inkStroke, theme.lineCap)
        case 'slur':
            return buildSlurColorContent(theme)
        case 'volta':
            return buildVoltaColorContent(theme)
        default:
            return buildGenericContent(theme, base)
    }
}

function mapNumberNotation(pack: NumberNotationSkinPack, theme: SkinTheme): NumberNotationSkinPack {
    const out = {} as NumberNotationSkinPack
    for (const key of Object.keys(pack) as NumberNotationSkinKeyEnum[]) {
        const item = pack[key]
        out[key] = {...item, content: applyNumberNotationItem(theme, key, item)}
    }
    return out
}

/** 基于 defaultSkin 几何尺寸，按主题令牌与各符号 builder 生成完整皮肤包 */
export function buildThemedSkinPack(theme: SkinTheme): SkinPack {
    const {standardStaff, numberNotation} = defaultSkin
    return {
        standardStaff: mapStandardStaff(standardStaff!, theme),
        numberNotation: mapNumberNotation(numberNotation!, theme),
    }
}
