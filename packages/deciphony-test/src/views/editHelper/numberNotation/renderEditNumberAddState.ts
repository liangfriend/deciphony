import type {Chronaxie} from 'deciphony-renderer'
import type {NotesNumberInfo} from 'deciphony-renderer'
import {
  ADD_NOTE_KIND_OPTIONS as STAFF_KIND_OPTIONS,
  CHRONAXIE_OPTIONS,
  DEFAULT_ADD_NOTE_STATE as STAFF_DEFAULT,
  type AddNoteSlotKind,
} from '../renderEditAddNoteState'

export type AddNumberSlotKind = AddNoteSlotKind | 'rhythm'

export type AddNumberState = {
  kind: AddNumberSlotKind
  chronaxie: Chronaxie
  syllable: Exclude<NotesNumberInfo['syllable'], 0>
}

export const DEFAULT_ADD_NUMBER_STATE: AddNumberState = {
  kind: 'note',
  chronaxie: 64,
  syllable: 1,
}

export const ADD_NUMBER_KIND_OPTIONS: {value: AddNumberSlotKind; label: string}[] = [
  ...STAFF_KIND_OPTIONS,
  {value: 'rhythm', label: '节奏音符'},
]

export {CHRONAXIE_OPTIONS}

export function syllableForAddState(state: AddNumberState): NotesNumberInfo['syllable'] {
  if (state.kind === 'rest') return 0
  if (state.kind === 'rhythm') return 'X'
  return state.syllable
}
