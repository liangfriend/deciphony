/**
 * 吉他 / 尤克里里空弦音高，以及「品 / 当前和弦 / 空弦」换算。
 * region 0 = 1 弦。拍弦、推弦、泛音不另作音高处理。
 */

/** 标准吉他：1 弦 E4 … 6 弦 E2 */
export const GUITAR_OPEN_MIDI = [64, 59, 55, 50, 45, 40] as const

/** 标准尤克里里（高音 G 再入式）：1 弦 A4、2 弦 E4、3 弦 C4、4 弦 G4 */
export const UKULELE_OPEN_MIDI = [69, 64, 60, 67] as const

export type ChordFinger = 'x' | 'o' | number

export type ChordStringState = {finger: ChordFinger}

export type ChordBarre = {
  fret: number
  startStringNumber: number
  endStringNumber: number
}

/** 播放只用到的和弦图字段；与 tabChord 结构兼容 */
export type ChordShape = {
  name?: string
  baseFret?: number
  stringStates?: ChordStringState[]
  barres?: ChordBarre[]
}

/** 空占位和弦图（无名字、无按弦、无横按）不覆盖当前生效和弦 */
export function isChordSymbol(chord: ChordShape | null | undefined): chord is ChordShape {
  if (!chord) return false
  if (chord.name?.trim()) return true
  if (chord.stringStates?.some((state) => state.finger !== -1)) return true
  return chord.barres?.some((barre) => barre.startStringNumber <= barre.endStringNumber) ?? false
}

/**
 * 和弦图上某一弦的绝对品。
 * finger / barre.fret 为相对品：0 = 第 baseFret+1 品。
 * 'o' 空弦，'x' 闷音，-1 或未写表示这根弦没有指定。
 */
export function chordFretForString(chord: ChordShape, region: number): number | 'mute' | null {
  const baseFret = chord.baseFret ?? 0
  const state = chord.stringStates?.[region]
  if (state) {
    if (state.finger === 'x') return 'mute'
    if (state.finger === 'o') return 0
    if (typeof state.finger === 'number' && state.finger >= 0) {
      return baseFret + state.finger + 1
    }
  }
  const barre = chord.barres?.find(
    (item) =>
      item.startStringNumber <= item.endStringNumber
      && region >= item.startStringNumber
      && region <= item.endStringNumber
      && item.fret >= 0,
  )
  if (!barre) return null
  return baseFret + barre.fret + 1
}

/**
 * 有品（value >= 0，含 0）用音符自己的品；
 * value 为 x（< 0）或缺失时用当前和弦该弦；
 * 和弦也没写这根弦则空弦。和弦闷音不发声。
 */
export function resolveTabStringMidi(
  openMidi: readonly number[],
  region: number,
  value: number | null | undefined,
  chord: ChordShape | null,
): number | null {
  const open = openMidi[region]
  if (open == null) return null
  if (typeof value === 'number' && value >= 0) return open + value
  if (!chord) return open
  const fret = chordFretForString(chord, region)
  if (fret === 'mute') return null
  if (fret == null) return open
  return open + fret
}
