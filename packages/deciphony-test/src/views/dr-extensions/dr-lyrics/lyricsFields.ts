import type {GrandStaff, Lyrics, MeasureNoteSlot, SingleStaff, VDom} from 'deciphony-renderer'
import {LYRICS_NOTE_TAGS} from './constants'

/** 空歌词项（Frame 归零） */
export function emptyLyrics(text = ''): Lyrics {
  return {
    text,
    relativeX: 0,
    relativeY: 0,
    relativeW: 0,
    relativeH: 0,
  }
}

/** 复谱表歌词取第一个单谱表 */
export function getLyricsStaff(grandStaff: GrandStaff | null | undefined): SingleStaff | null {
  return grandStaff?.staves[0] ?? null
}

/** 首谱表所有槽位 */
export function collectStaffSlots(staff: SingleStaff | null | undefined): MeasureNoteSlot[] {
  if (!staff) return []
  const out: MeasureNoteSlot[] = []
  for (const measure of staff.measures) {
    for (const slot of measure.notes) {
      out.push(slot)
    }
  }
  return out
}

/** 渲染行数：各槽 lyrics.length 的最大值 */
export function maxLyricsRowCount(staff: SingleStaff | null | undefined): number {
  let max = 0
  for (const slot of collectStaffSlots(staff)) {
    max = Math.max(max, slot.lyrics?.length ?? 0)
  }
  return max
}

/** 取槽位对齐用的音符 id（首个音符头 / 简谱音节；休止符用槽位 id） */
export function getSlotAnchorId(slot: MeasureNoteSlot): string {
  if ('notesInfo' in slot && Array.isArray(slot.notesInfo) && slot.notesInfo.length > 0) {
    return slot.notesInfo[0]!.id
  }
  return slot.id
}

/** 在 vDom 中找音符锚点；返回相对 g-d 的 x（音符左缘）及宽度 */
export function findNoteAnchorInSlot(
  vDomList: readonly VDom[],
  slot: MeasureNoteSlot,
  slotNode: VDom,
): {x: number; w: number} | null {
  const anchorId = getSlotAnchorId(slot)
  const note = vDomList.find(
    (n) => n.targetId === anchorId && LYRICS_NOTE_TAGS.has(n.tag),
  )
  if (!note) return null
  return {
    x: note.x - slotNode.x,
    w: note.w,
  }
}

/**
 * 写入第 rowIndex 行：若当前为 []（或长度不足），用空 Lyrics 补齐到 rowIndex+1。
 * 已有项一律保留，清空文本也不会裁掉尾部空项（['','',''] 保持长度）。
 */
export function writeSlotLyricLine(slot: MeasureNoteSlot, rowIndex: number, text: string): void {
  const next = slot.lyrics.map((item) => ({...item}))
  while (next.length <= rowIndex) {
    next.push(emptyLyrics())
  }
  next[rowIndex] = {
    ...next[rowIndex]!,
    text,
  }
  slot.lyrics = next
}

export function readSlotLyricLine(slot: MeasureNoteSlot, rowIndex: number): string {
  return slot.lyrics[rowIndex]?.text ?? ''
}

export function readSlotLyricOffset(
  slot: MeasureNoteSlot,
  rowIndex: number,
): {relativeX: number; relativeY: number} {
  const item = slot.lyrics[rowIndex]
  return {
    relativeX: item?.relativeX ?? 0,
    relativeY: item?.relativeY ?? 0,
  }
}

/**
 * 在首谱表所有槽位末尾追加一行空歌词（各槽补齐到 max+1）。
 * @returns 新的行数
 */
export function addLyricRow(staff: SingleStaff | null | undefined): number {
  const slots = collectStaffSlots(staff)
  if (!slots.length) return 0
  const target = maxLyricsRowCount(staff) + 1
  for (const slot of slots) {
    const next = slot.lyrics.map((item) => ({...item}))
    while (next.length < target) {
      next.push(emptyLyrics())
    }
    slot.lyrics = next
  }
  return target
}

/**
 * 删除首谱表所有槽位的第 rowIndex 行（下标从 0）。
 * 长度不足的槽位跳过。
 * @returns 删除后的行数
 */
export function removeLyricRow(staff: SingleStaff | null | undefined, rowIndex: number): number {
  if (rowIndex < 0) return maxLyricsRowCount(staff)
  for (const slot of collectStaffSlots(staff)) {
    if (slot.lyrics.length <= rowIndex) continue
    const next = slot.lyrics.map((item) => ({...item}))
    next.splice(rowIndex, 1)
    slot.lyrics = next
  }
  return maxLyricsRowCount(staff)
}
