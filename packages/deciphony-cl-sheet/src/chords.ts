/** 根音字母 */
export const CHORD_LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const

/** 升降号（'' = 还原） */
export const CHORD_ACCIDENTALS = ['', '#', 'b'] as const

export type ChordAccidental = (typeof CHORD_ACCIDENTALS)[number]

/** 常用根音写法（含同音异名） */
export const CHORD_ROOTS = [
  'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B',
] as const

/** 低音（斜线和弦）可选音，按半音排列 */
export const CHORD_BASSES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'] as const

export type ChordQuality = {
  /** 根音后缀，'' = 大三和弦 */
  value: string
  label: string
}

export const CHORD_QUALITIES: readonly ChordQuality[] = [
  {value: '', label: '大三'},
  {value: 'm', label: '小三'},
  {value: '7', label: '属七'},
  {value: 'maj7', label: '大七'},
  {value: 'm7', label: '小七'},
  {value: 'mMaj7', label: '小大七'},
  {value: 'm7b5', label: '半减七'},
  {value: 'dim', label: '减三'},
  {value: 'dim7', label: '减七'},
  {value: 'aug', label: '增三'},
  {value: 'sus2', label: '挂二'},
  {value: 'sus4', label: '挂四'},
  {value: '7sus4', label: '七挂四'},
  {value: 'add9', label: '加九'},
  {value: 'madd9', label: '小加九'},
  {value: '6', label: '大六'},
  {value: 'm6', label: '小六'},
  {value: '9', label: '属九'},
  {value: 'maj9', label: '大九'},
  {value: 'm9', label: '小九'},
  {value: '11', label: '十一'},
  {value: '13', label: '十三'},
  {value: '5', label: '强力'},
]

/** 吉他弹唱最常用的和弦（选择器快捷区） */
export const COMMON_CHORDS = [
  'C', 'Cmaj7', 'C7', 'D', 'Dm', 'Dm7', 'D7', 'Dsus4', 'E', 'Em', 'Em7', 'E7',
  'F', 'Fmaj7', 'G', 'G7', 'Gsus4', 'G/B', 'A', 'Am', 'Am7', 'A7', 'Bm', 'B7',
] as const

export type ChordParts = {
  letter: (typeof CHORD_LETTERS)[number]
  accidental: ChordAccidental
  quality: string
  bass?: string
}

const QUALITY_VALUES = new Set(CHORD_QUALITIES.map((q) => q.value))

/** ♯ / ♭ 统一成 # / b */
export function normalizeChordText(text: string): string {
  return text.trim().replace(/♯/g, '#').replace(/♭/g, 'b')
}

export function formatChord(parts: ChordParts): string {
  return parts.letter + parts.accidental + parts.quality + (parts.bass ? '/' + parts.bass : '')
}

/** 解析内置和弦名；后缀不在 CHORD_QUALITIES 里返回 null（当作自定义文本） */
export function parseChord(text: string): ChordParts | null {
  const m = /^([A-G])([#b]?)(.*?)(?:\/([A-G][#b]?))?$/.exec(normalizeChordText(text))
  if (!m || !QUALITY_VALUES.has(m[3]!)) return null
  return {
    letter: m[1] as ChordParts['letter'],
    accidental: m[2] as ChordAccidental,
    quality: m[3]!,
    bass: m[4],
  }
}

/** 内置和弦全集：根音 × 类型 */
export function listChords(roots: readonly string[] = CHORD_ROOTS): string[] {
  return roots.flatMap((root) => CHORD_QUALITIES.map((q) => root + q.value))
}
