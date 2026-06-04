import type {SlotData} from '@/types/common';
import type {
  GrandStaff,
  Measure,
  MusicScore,
  NoteNumber,
  NoteSymbol,
  NotesInfo,
  NotesNumberInfo,
  SingleStaff,
} from '@/types/MusicScoreType';

type SlotContext = {
  musicScore: MusicScore;
  grandStaff?: GrandStaff | null;
  singleStaff?: SingleStaff | null;
  measure?: Measure | null;
  note?: NoteSymbol | NoteNumber | null;
  info?: NotesInfo | NotesNumberInfo | null;
  self: SlotData['self'];
};

export function createSlotData(ctx: SlotContext): SlotData {
  return {
    musicScore: ctx.musicScore,
    grandStaff: ctx.grandStaff ?? null,
    singleStaff: ctx.singleStaff ?? null,
    measure: ctx.measure ?? null,
    note: ctx.note ?? null,
    info: ctx.info ?? null,
    self: ctx.self,
  };
}

/** t / e 等曲谱级插槽 */
export function slotDataForMusicScore(musicScore: MusicScore): SlotData {
  return createSlotData({musicScore, self: musicScore});
}

/** g 开头插槽：含 musicScore、grandStaff，self 为当前复谱表 */
export function slotDataForGrandStaff(musicScore: MusicScore, grandStaff: GrandStaff): SlotData {
  return createSlotData({musicScore, grandStaff, self: grandStaff});
}

/** s 开头插槽：在复谱表上下文上增加 singleStaff，self 为当前单谱表 */
export function slotDataForSingleStaff(
  musicScore: MusicScore,
  grandStaff: GrandStaff,
  singleStaff: SingleStaff,
): SlotData {
  return createSlotData({musicScore, grandStaff, singleStaff, self: singleStaff});
}

/** m 开头插槽：在单谱表上下文上增加 measure，self 为当前小节 */
export function slotDataForMeasure(
  musicScore: MusicScore,
  grandStaff: GrandStaff,
  singleStaff: SingleStaff,
  measure: Measure,
): SlotData {
  return createSlotData({musicScore, grandStaff, singleStaff, measure, self: measure});
}
