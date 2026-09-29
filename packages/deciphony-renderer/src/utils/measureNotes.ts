import type {Measure, MeasureNoteSlot, MeasureNoteVoices} from '@/types/MusicScoreType';

/** notes 是否为鼓谱上下声部结构 */
export function isMeasureNoteVoices(notes: Measure['notes']): notes is MeasureNoteVoices {
  return !Array.isArray(notes);
}

/** 小节全部槽位：数组原样返回；上下声部按 up → down 拼接 */
export function getMeasureSlots(measure: Pick<Measure, 'notes'>): MeasureNoteSlot[] {
  const notes = measure.notes;
  if (!isMeasureNoteVoices(notes)) return notes;
  return [...(notes.up ?? []), ...(notes.down ?? [])];
}

/**
 * 可原地增删的槽位数组：数组原样返回；上下声部时返回 up 声部数组（缺省则创建）。
 * 供五线谱 / 简谱 / 六线谱的编辑与导入流程使用；只读遍历请用 getMeasureSlots。
 */
export function getMeasureNoteList(measure: Pick<Measure, 'notes'>): MeasureNoteSlot[] {
  const notes = measure.notes;
  if (!isMeasureNoteVoices(notes)) return notes;
  if (!notes.up) notes.up = [];
  return notes.up;
}

/** 小节上下声部：数组视为只有 up 声部 */
export function getMeasureVoices(measure: Pick<Measure, 'notes'>): MeasureNoteVoices {
  const notes = measure.notes;
  if (!isMeasureNoteVoices(notes)) return {up: notes, down: []};
  return {up: notes.up ?? [], down: notes.down ?? []};
}
