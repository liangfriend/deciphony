import {
  DoubleNoteAffiliatedSymbolNameEnum,
  DoubleSlotAffiliatedSymbolNameEnum,
  getMeasureSlots,
  isNoteNumberSymbol,
  isNoteSymbol,
  KeySignatureTypeEnum,
  MusicScore,
  NoteNumber,
  PitchTypeEnum,
  slotSymbol,
  type MeasureNoteSlot,
} from '@deciphony/renderer'
import type {DR_playSequence, DR_playSequence_item, Unit256} from './types'
import {getDuration} from './types'

/** 倚音播放时值：不占小节拍位，不累加 playTime */
export const GRACE_PLAY_DURATION: Unit256 = getDuration(16, 0)

/** 播放初始调：顶层 keySignature；小节上再有调号则覆盖。拍号不参与时值（chronaxie 已是绝对时值） */
export function initialPlayKeySignature(score: MusicScore): KeySignatureTypeEnum {
  return score.keySignature ?? KeySignatureTypeEnum.C
}

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

function visitNoteNumberEndpoints(note: NoteNumber, endpointId: string): boolean {
  for (const ni of note.notesInfo) {
    if (ni.id === endpointId) return true
  }
  for (const g of note.graceNotes ?? []) {
    if (g.id === endpointId) return true
  }
  for (const g of note.graceNotesAfter ?? []) {
    if (g.id === endpointId) return true
  }
  return false
}

function visitNoteSymbolEndpoints(note: import('@deciphony/renderer').NoteSymbol, endpointId: string): boolean {
  for (const ni of note.notesInfo) {
    if (ni.id === endpointId) return true
  }
  for (const g of note.graceNotes ?? []) {
    if (g.id === endpointId) return true
  }
  for (const g of note.graceNotesAfter ?? []) {
    if (g.id === endpointId) return true
  }
  return false
}

/** slur 端点必须为 NotesInfo.id / NotesNumberInfo.id */
export function isSlurNotesInfoEndpoint(musicScore: MusicScore, endpointId: string): boolean {
  for (const grandStaff of musicScore.grandStaffs) {
    for (const staff of grandStaff.staves) {
      for (const measure of staff.measures) {
        for (const measureSlot of getMeasureSlots(measure)) {
          const slot = slotSymbol(measureSlot)
          if (isNoteNumberSymbol(slot)) {
            if (visitNoteNumberEndpoints(slot as NoteNumber, endpointId)) return true
            continue
          }
          if (isNoteSymbol(slot)) {
            if (visitNoteSymbolEndpoints(slot, endpointId)) return true
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
 * 同音高 slur 视为延音线：链首 real_duration = 整条链 Σduration，其余为 0。
 * - 首尾同音高，且段内每个起音时刻都有该音高（和弦中其它音不影响）才算延音线
 * - 多条首尾相接的延音线（A→B、B→C）合并为一条链
 */
export function applySlurTieRealDuration(
  seq: DR_playSequence,
  musicScore: MusicScore,
  noteStaveIndex: Map<string, number>,
): void {
  const tieNext = new Map<DR_playSequence_item, DR_playSequence_item>()
  const tieTargets = new Set<DR_playSequence_item>()

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

    if (startItem.midi !== endItem.midi) continue
    const tieMidi = startItem.midi

    const tMin = Math.min(startItem.playTime, endItem.playTime)
    const tMax = Math.max(startItem.playTime, endItem.playTime)

    const inSpan = seq.filter(
      (it) =>
        it.midi > 0 &&
        noteStaveIndex.get(it.note_id) === stave &&
        it.playTime >= tMin &&
        it.playTime <= tMax,
    )
    const tieTimes = new Set(inSpan.filter((it) => it.midi === tieMidi).map((it) => it.playTime))
    if (inSpan.some((it) => !tieTimes.has(it.playTime))) continue

    const chain = inSpan
      .filter((it) => it.midi === tieMidi)
      .sort((a, b) => a.playTime - b.playTime || String(a.note_id).localeCompare(String(b.note_id)))
    if (chain.length < 2) continue

    for (let i = 0; i + 1 < chain.length; i++) {
      if (chain[i + 1]!.playTime === chain[i]!.playTime) continue
      tieNext.set(chain[i]!, chain[i + 1]!)
      tieTargets.add(chain[i + 1]!)
    }
  }

  for (const head of tieNext.keys()) {
    if (tieTargets.has(head)) continue
    let total = head.duration
    let cur = tieNext.get(head)
    while (cur) {
      total += cur.duration
      cur.real_duration = 0
      cur = tieNext.get(cur)
    }
    head.real_duration = total
  }
}

// —— pitch（八度记号）——

type SlotStaffPath = {
  grandStaffIndex: number
  staffIndex: number
  measureIndex: number
  noteIndex: number
  slot: MeasureNoteSlot
}

function locateMeasureNoteSlot(musicScore: MusicScore, slotId: string): SlotStaffPath | null {
  for (let gi = 0; gi < musicScore.grandStaffs.length; gi++) {
    const gs = musicScore.grandStaffs[gi]!
    for (let si = 0; si < gs.staves.length; si++) {
      const staff = gs.staves[si]!
      for (let mi = 0; mi < staff.measures.length; mi++) {
        const measure = staff.measures[mi]!
        const slots = getMeasureSlots(measure)
        for (let ni = 0; ni < slots.length; ni++) {
          const slot = slots[ni]!
          if (slot.id === slotId) {
            return {grandStaffIndex: gi, staffIndex: si, measureIndex: mi, noteIndex: ni, slot}
          }
        }
      }
    }
  }
  return null
}

/** 从槽内收集播放序列用的 note_id（NotesInfo / NotesNumberInfo / TabNoteInfo） */
function collectPlayNoteIdsFromSlot(slot: MeasureNoteSlot): string[] {
  const body = slotSymbol(slot)
  const ids: string[] = []
  if (!('notesInfo' in body) || !Array.isArray(body.notesInfo)) return ids
  for (const ni of body.notesInfo) ids.push(ni.id)
  if ('graceNotes' in body) for (const g of body.graceNotes ?? []) ids.push(g.id)
  if ('graceNotesAfter' in body) for (const g of body.graceNotesAfter ?? []) ids.push(g.id)
  return ids
}

/**
 * 同谱表上自 startSlot 至 endSlot（含）按谱面顺序收集播放 note_id。
 * 起止不在同一谱表则返回空。
 */
function collectPlayNoteIdsInPitchSpan(
  musicScore: MusicScore,
  startId: string,
  endId: string,
): Set<string> {
  const start = locateMeasureNoteSlot(musicScore, startId)
  const end = locateMeasureNoteSlot(musicScore, endId)
  const out = new Set<string>()
  if (!start || !end) return out
  if (start.grandStaffIndex !== end.grandStaffIndex || start.staffIndex !== end.staffIndex) {
    return out
  }

  const staff = musicScore.grandStaffs[start.grandStaffIndex]!.staves[start.staffIndex]!
  const startKey = start.measureIndex * 1e6 + start.noteIndex
  const endKey = end.measureIndex * 1e6 + end.noteIndex
  const lo = Math.min(startKey, endKey)
  const hi = Math.max(startKey, endKey)

  for (let mi = 0; mi < staff.measures.length; mi++) {
    const measure = staff.measures[mi]!
    const slots = getMeasureSlots(measure)
    for (let ni = 0; ni < slots.length; ni++) {
      const key = mi * 1e6 + ni
      if (key < lo || key > hi) continue
      for (const id of collectPlayNoteIdsFromSlot(slots[ni]!)) {
        out.add(id)
      }
    }
  }
  return out
}

/** 8va=12 / 15ma=24 / 22ma=36；pitch_down 为负 */
export function pitchMidiDelta(
  name: DoubleSlotAffiliatedSymbolNameEnum.Pitch_up | DoubleSlotAffiliatedSymbolNameEnum.Pitch_down,
  type?: PitchTypeEnum,
): number {
  const semitones =
    type === PitchTypeEnum['22ma'] ? 36
      : type === PitchTypeEnum['15ma'] ? 24
        : 12
  return name === DoubleSlotAffiliatedSymbolNameEnum.Pitch_up ? semitones : -semitones
}

function seqItemMatchesPitchNoteId(noteId: string, wrappedIds: Set<string>): boolean {
  if (wrappedIds.has(noteId)) return true
  // tab 多音：`${infoId}:${region}`
  const colon = noteId.indexOf(':')
  if (colon > 0 && wrappedIds.has(noteId.slice(0, colon))) return true
  return false
}

/**
 * 检测 musicScore.affiliatedSymbols 中的 pitch_up / pitch_down，
 * 对其起止 slot（含）之间同谱表音符的 midi 做八度偏移。
 */
export function applyPitchOctaveOffset(seq: DR_playSequence, musicScore: MusicScore): void {
  for (const sym of musicScore.affiliatedSymbols ?? []) {
    if (
      sym.name !== DoubleSlotAffiliatedSymbolNameEnum.Pitch_up
      && sym.name !== DoubleSlotAffiliatedSymbolNameEnum.Pitch_down
    ) {
      continue
    }
    if (!('startId' in sym) || !('endId' in sym)) continue

    const wrapped = collectPlayNoteIdsInPitchSpan(musicScore, sym.startId, sym.endId)
    if (!wrapped.size) continue

    const delta = pitchMidiDelta(sym.name, sym.data?.pitch?.type)
    if (delta === 0) continue

    for (const it of seq) {
      if (it.midi <= 0) continue
      if (!seqItemMatchesPitchNoteId(it.note_id, wrapped)) continue
      it.midi += delta
    }
  }
}
