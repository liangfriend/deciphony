import {
  DoubleNoteAffiliatedSymbolNameEnum,
  MusicScore,
  NoteNumber,
  NoteSymbolTypeEnum,
} from 'deciphony-renderer'
import type {DR_playSequence, DR_playSequence_item, Unit256} from './types'
import {getDuration} from './types'

/** 倚音播放时值：不占小节拍位，不累加 playTime */
export const GRACE_PLAY_DURATION: Unit256 = getDuration(16, 0)

export function pushPitchItem(
  seq: DR_playSequence,
  noteStaveIndex: Map<string, number>,
  staveIndex: number,
  item: DR_playSequence_item,
): void {
  seq.push(item)
  if (item.midi > 0) {
    noteStaveIndex.set(item.note_id, staveIndex)
  }
}

/** slur 端点必须为 NotesInfo.id / NotesNumberInfo.id */
export function isSlurNotesInfoEndpoint(musicScore: MusicScore, endpointId: string): boolean {
  for (const grandStaff of musicScore.grandStaffs) {
    for (const staff of grandStaff.staves) {
      for (const measure of staff.measures) {
        for (const slot of measure.notes) {
          if (!('type' in slot)) {
            const note = slot as NoteNumber
            for (const ni of note.notesInfo) {
              if (ni.id === endpointId) return true
            }
            for (const g of note.graceNotes ?? []) {
              if (g.id === endpointId) return true
            }
            for (const g of note.graceNotesAfter ?? []) {
              if (g.id === endpointId) return true
            }
            continue
          }
          if (slot.type !== NoteSymbolTypeEnum.Note) continue
          for (const ni of slot.notesInfo) {
            if (ni.id === endpointId) return true
          }
          for (const g of slot.graceNotes ?? []) {
            if (g.id === endpointId) return true
          }
          for (const g of slot.graceNotesAfter ?? []) {
            if (g.id === endpointId) return true
          }
        }
      }
    }
  }
  return false
}

function findSeqItemBySlurEndpoint(
  seq: DR_playSequence,
  endpointId: string,
): DR_playSequence_item | undefined {
  if (!endpointId) return undefined
  return seq.find((it) => it.note_id === endpointId && it.midi > 0)
}

/**
 * 同音高 slur 视为延音线：段内首音 real_duration = Σduration，其余为 0。
 */
export function applySlurTieRealDuration(
  seq: DR_playSequence,
  musicScore: MusicScore,
  noteStaveIndex: Map<string, number>,
): void {
  for (const sym of musicScore.affiliatedSymbols ?? []) {
    if (sym.name !== DoubleNoteAffiliatedSymbolNameEnum.Slur) continue
    if (!('startId' in sym) || !('endId' in sym)) continue

    if (!isSlurNotesInfoEndpoint(musicScore, sym.startId) || !isSlurNotesInfoEndpoint(musicScore, sym.endId)) {
      continue
    }
    const startItem = findSeqItemBySlurEndpoint(seq, sym.startId)
    const endItem = findSeqItemBySlurEndpoint(seq, sym.endId)
    if (!startItem || !endItem) continue

    const stave = noteStaveIndex.get(startItem.note_id)
    const endStave = noteStaveIndex.get(endItem.note_id)
    if (stave == null || stave !== endStave) continue

    const tMin = Math.min(startItem.playTime, endItem.playTime)
    const tMax = Math.max(startItem.playTime, endItem.playTime)

    const inSlur = seq
      .filter(
        (it) =>
          it.midi > 0 &&
          noteStaveIndex.get(it.note_id) === stave &&
          it.playTime >= tMin &&
          it.playTime <= tMax,
      )
      .sort((a, b) => a.playTime - b.playTime || a.note_id.localeCompare(b.note_id))

    if (inSlur.length < 2) continue

    const midis = new Set(inSlur.map((it) => it.midi))
    if (midis.size !== 1) continue

    const totalDuration = inSlur.reduce((sum, it) => sum + it.duration, 0)
    inSlur[0]!.real_duration = totalDuration
    for (let i = 1; i < inSlur.length; i++) {
      inSlur[i]!.real_duration = 0
    }
  }
}
