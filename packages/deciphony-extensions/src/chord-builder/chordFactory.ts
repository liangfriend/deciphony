import {NoteName} from '@deciphony/renderer'
import type {Barre, tabChord} from '@deciphony/renderer'
import {CHORD_DEFAULTS} from './constants'

export function createDefaultBarre(stringCount: number): Barre {
  const end = Math.max(0, stringCount - 1)
  return {
    fret: 0,
    startStringNumber: 0,
    endStringNumber: end,
    text: Array.from({length: stringCount}, () => '1'),
  }
}

export function createEmptyChord(partial: Partial<tabChord> = {}): tabChord {
  const stringCount = partial.stringCount ?? CHORD_DEFAULTS.stringCount
  return {
    id: partial.id ?? crypto.randomUUID(),
    width: partial.width ?? CHORD_DEFAULTS.width,
    height: partial.height ?? CHORD_DEFAULTS.height,
    stringCount,
    name: partial.name ?? '',
    fretCount: partial.fretCount ?? CHORD_DEFAULTS.fretCount,
    baseFret: partial.baseFret ?? 0,
    textSize: partial.textSize ?? CHORD_DEFAULTS.textSize,
    nameSize: partial.nameSize ?? CHORD_DEFAULTS.nameSize,
    barres: partial.barres ?? [],
    tuning:
      partial.tuning ??
      [NoteName.E, NoteName.A, NoteName.D, NoteName.G, NoteName.B, NoteName.E],
    stringStates:
      partial.stringStates ??
      Array.from({length: stringCount}, () => ({finger: -1 as const, text: ''})),
    relativeX: partial.relativeX ?? 0,
    relativeY: partial.relativeY ?? 0,
    relativeW: partial.relativeW ?? 1,
    relativeH: partial.relativeH ?? 1,
  }
}

export function createSampleCChord(): tabChord {
  return createEmptyChord({
    id: 'sample-c',
    name: 'C',
    barres: [],
    stringStates: [
      {finger: 'o', text: ''},
      {finger: 0, text: '1'},
      {finger: 'o', text: ''},
      {finger: 1, text: '2'},
      {finger: 2, text: '3'},
      {finger: 'x', text: ''},
    ],
  })
}

export function createSampleFChord(): tabChord {
  const stringCount = CHORD_DEFAULTS.stringCount
  return createEmptyChord({
    id: 'sample-f',
    name: 'F',
    barres: [createDefaultBarre(stringCount)],
    stringStates: [
      {finger: 0, text: '1'},
      {finger: 0, text: '1'},
      {finger: 1, text: '2'},
      {finger: 2, text: '3'},
      {finger: 3, text: '4'},
      {finger: 0, text: '1'},
    ],
  })
}
