import {StandardStaffSkinKeyEnum} from 'deciphony-renderer'
import type {SkinItem} from 'deciphony-renderer'
import type {SkinTheme} from '../theme/types'
import {buildCreativeContent} from './creativeSymbols'
import {themedRecolor} from './svgUtils'

function creative(theme: SkinTheme, category: string, key: string, base: SkinItem): string {
    return buildCreativeContent(theme, category, key, base)
        ?? themedRecolor(base.content, theme.ink, theme.inkStroke, theme.lineCap)
}

export function buildMeasureContent(theme: SkinTheme): string {
    return creative(theme, 'measure', StandardStaffSkinKeyEnum.Measure, {content: '', w: 1, h: 45, skinKey: StandardStaffSkinKeyEnum.Measure})
}

export function buildNoteHeadContent(theme: SkinTheme, key: StandardStaffSkinKeyEnum, base: SkinItem): string {
    return creative(theme, 'noteHead', key, base)
}

export function buildRestContent(theme: SkinTheme, key: StandardStaffSkinKeyEnum, base: SkinItem): string {
    return creative(theme, 'rest', key, base)
}

export function buildClefContent(theme: SkinTheme, key: StandardStaffSkinKeyEnum, base: SkinItem): string {
    return creative(theme, 'clef', key, base)
}

export function buildAccidentalContent(theme: SkinTheme, key: StandardStaffSkinKeyEnum, base: SkinItem): string {
    return creative(theme, 'accidental', key, base)
}

export function buildBarlineContent(theme: SkinTheme, key: string, base: SkinItem): string {
    return creative(theme, 'barline', key, base)
}

export function buildKeySignatureContent(theme: SkinTheme, key: string, base: SkinItem): string {
    return creative(theme, 'keySignature', key, base)
}

export function buildNoteTailContent(theme: SkinTheme, key: StandardStaffSkinKeyEnum, base: SkinItem): string {
    return creative(theme, 'noteTail', key, base)
}

export function buildTimeSignatureContent(theme: SkinTheme, base: SkinItem): string {
    return creative(theme, 'timeSignature', '', base)
}

export function buildAugmentationDotContent(theme: SkinTheme, key: StandardStaffSkinKeyEnum, base: SkinItem): string {
    return creative(theme, 'augmentationDot', key, base)
}

export function buildAddLineContent(theme: SkinTheme): string {
    return creative(theme, 'addLine', '', {content: '', w: 16, h: 11, skinKey: StandardStaffSkinKeyEnum.AddLine_u})
}

export function buildNoteStemContent(theme: SkinTheme): string {
    return creative(theme, 'noteStem', StandardStaffSkinKeyEnum.NoteStem, {content: '', w: 1, h: 1, skinKey: StandardStaffSkinKeyEnum.NoteStem})
}

export function buildGenericContent(theme: SkinTheme, base: SkinItem): string {
    return creative(theme, 'other', '', base)
}

export function buildNumberMeasure(theme: SkinTheme): string {
    return creative(theme, 'numberMeasure', 'measure', {content: '', w: 1, h: 45, skinKey: StandardStaffSkinKeyEnum.Measure})
}

export function buildNumberGlyph(theme: SkinTheme, digit: string): string {
    return creative(theme, 'number', `number_${digit.toLowerCase()}`, {content: '', w: 14, h: 35, skinKey: StandardStaffSkinKeyEnum.Measure})
}
