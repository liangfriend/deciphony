/** 单套主题的视觉令牌；符号 builder 据此生成 SVG，尺寸/widthRatio 仍继承 defaultSkin */
export type SkinTheme = {
    id: string
    name: string
    ink: string
    inkStroke: string
    staffLine: string
    staffLineMuted: string
    barline: string
    barlineHeavy: string
    noteHeadFill: string
    noteHeadStroke: string
    restFill: string
    restStroke: string
    accidentalFill: string
    accidentalStroke: string
    dotFill: string
    timeSigColor: string
    timeSigFontWeight: number
    stemFill: string
    ledgerLine: string
    lineCap: 'round' | 'butt'
    measureVariant: 'bamboo' | 'glacier'
    /** 高光 / 渐变辅色 */
    accent: string
    accentSoft: string
    /** 装饰光晕色 */
    glow: string
    assets?: Record<string, string>
}

export type SkinSymbolCategory =
    | 'measure'
    | 'clef'
    | 'accidental'
    | 'barline'
    | 'keySignature'
    | 'timeSignature'
    | 'noteHead'
    | 'rest'
    | 'augmentationDot'
    | 'addLine'
    | 'noteStem'
    | 'noteTail'
    | 'noteBeam'
    | 'slur'
    | 'volta'
    | 'other'
