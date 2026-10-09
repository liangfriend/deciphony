import {DoubleNoteAffiliatedSymbolNameEnum, getMeasureSlots, slotSymbol} from '@deciphony/renderer'
import type {Measure, MeasureNoteSlot, MusicScore} from '@deciphony/renderer'
import {getDrPlaySequence} from '../dr-play'

export type MarkPitchInfo = {
  /** 音符 id → 实际音高（含调号、小节内变音、八度记号） */
  midi: Map<string, number>
  /** 被延音线连过来的同音（连线终点且与起点同音高） */
  tieEnds: Set<string>
}

export function buildMarkPitchInfo(musicScore: MusicScore): MarkPitchInfo {
  const midi = new Map<string, number>()
  try {
    for (const item of getDrPlaySequence(musicScore)) {
      if (item.midi > 0 && !midi.has(item.note_id)) midi.set(item.note_id, item.midi)
    }
  } catch {
    return {midi, tieEnds: new Set()}
  }
  const tieEnds = new Set<string>()
  for (const sym of musicScore.affiliatedSymbols ?? []) {
    if (sym.name !== DoubleNoteAffiliatedSymbolNameEnum.Slur || !('startId' in sym)) continue
    const a = midi.get(sym.startId)
    if (a != null && a === midi.get(sym.endId)) tieEnds.add(sym.endId)
  }
  return {midi, tieEnds}
}

/** noteSlot 的第一个音符 id（休止 / 无音符返回 null） */
export function firstNoteId(slot: MeasureNoteSlot): string | null {
  const sym = slotSymbol(slot)
  if (!('notesInfo' in sym) || !Array.isArray(sym.notesInfo)) return null
  return sym.notesInfo[0]?.id ?? null
}

export function measureFirstNoteIds(measure: Measure | null | undefined): string[] {
  if (!measure) return []
  const out: string[] = []
  for (const slot of getMeasureSlots(measure)) {
    const id = firstNoteId(slot)
    if (id) out.push(id)
  }
  return out
}
