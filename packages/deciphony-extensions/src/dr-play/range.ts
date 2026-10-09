import type {DR_playSequence} from './types'
import {baseNoteIdForToneLookup} from './toneColor'

/** 选段：起止音符 id（NotesInfo / NotesNumberInfo / TabNoteInfo / 休止符 id），缺省 = 从头 / 到尾 */
export type DrPlayRange = {
  startNoteId?: string | null
  endNoteId?: string | null
}

function indexOfNote(seq: DR_playSequence, noteId: string, fromTime = -Infinity): number {
  return seq.findIndex((it) => it.playTime >= fromTime && baseNoteIdForToneLookup(it.note_id) === noteId)
}

/**
 * 按选段裁剪播放序列（不改原序列，返回新数组）：
 * - 起点：起始音符在序列里第一次出现的 playTime；note_id 的 `:` 后缀（tab 多弦）忽略
 * - 终点：起点之后结束音符第一次出现的 playTime，该时刻整组音（和弦 / 其它谱表）都保留
 * - 起始音符第一次出现在结束音符之后时自动交换；反复展开后同一音符出现多次，按「先起点、再往后找终点」取
 * - 保留项 playTime 统一减去起点 playTime（从 0 开始）
 * - 延音线：链首被裁掉时，起点后第一个续音接过剩余时值；链尾超出终点时按终点那组音的结束时刻截断
 * 起始音符不在序列中返回空数组；结束音符找不到则播到结尾。
 */
export function cropDrPlaySequence(seq: DR_playSequence, range: DrPlayRange): DR_playSequence {
  let startId = range.startNoteId?.trim() || null
  let endId = range.endNoteId?.trim() || null
  if (!startId && !endId) return seq.map((it) => ({...it}))

  if (startId && endId) {
    const a = indexOfNote(seq, startId)
    const b = indexOfNote(seq, endId)
    if (a >= 0 && b >= 0 && b < a) [startId, endId] = [endId, startId]
  }

  let startTime = seq.length ? Math.min(...seq.map((it) => it.playTime)) : 0
  if (startId) {
    const a = indexOfNote(seq, startId)
    if (a < 0) return []
    startTime = seq[a]!.playTime
  }
  let endTime = Infinity
  if (endId) {
    const e = indexOfNote(seq, endId, startTime)
    if (e >= 0) endTime = seq[e]!.playTime
  }

  const kept: DR_playSequence = seq
    .filter((it) => it.playTime >= startTime && it.playTime <= endTime)
    .map((it) => ({...it}))

  // 链首在起点前：剩余时值交给起点后第一个同音高续音（real_duration = 0）
  for (const head of seq) {
    const real = head.real_duration ?? 0
    if (head.midi <= 0 || real <= 0 || head.playTime >= startTime) continue
    const headEnd = head.playTime + real
    if (headEnd <= startTime) continue
    const next = kept
      .filter((it) => it.midi === head.midi && it.real_duration === 0 && it.playTime < headEnd)
      .sort((x, y) => x.playTime - y.playTime)[0]
    if (next) next.real_duration = headEnd - next.playTime
  }

  // 链尾在终点后：按终点那组音的结束时刻截断
  if (Number.isFinite(endTime)) {
    const endGroup = kept.filter((it) => it.playTime === endTime)
    const rangeEnd = Math.max(...endGroup.map((it) => it.playTime + it.duration))
    for (const it of kept) {
      if ((it.real_duration ?? 0) > 0 && it.playTime + it.real_duration! > rangeEnd) {
        it.real_duration = Math.max(it.duration, rangeEnd - it.playTime)
      }
    }
  }

  for (const it of kept) it.playTime -= startTime
  return kept
}
