import type {SkinTheme} from './types'

/** 冰川主题：冰晶意象，符号不必像传统记谱 */
export const glacierTheme: SkinTheme = {
    id: 'glacier',
    name: '冰川',
    ink: '#0c2d48',
    inkStroke: '#1d4e6f',
    /** 谱线主色：在白底上仍需足够对比 */
    staffLine: '#2b7a9e',
    staffLineMuted: '#4da3c4',
    barline: '#0c2d48',
    barlineHeavy: '#4da3c4',
    noteHeadFill: '#7ec8e3',
    noteHeadStroke: '#1d4e6f',
    restFill: '#a8d8ea',
    restStroke: '#1d4e6f',
    accidentalFill: '#4da3c4',
    accidentalStroke: '#0c2d48',
    dotFill: '#d4eef7',
    timeSigColor: '#0c2d48',
    timeSigFontWeight: 600,
    stemFill: '#1d4e6f',
    ledgerLine: '#b8e0f0',
    lineCap: 'round',
    measureVariant: 'glacier',
    accent: '#e8f7fc',
    accentSoft: '#f0fbff',
    glow: '#b8e8f8',
}
