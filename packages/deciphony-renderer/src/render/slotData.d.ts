import type { SlotData } from '@/types/common';
import type { GrandStaff, Measure, MusicScore, NoteNumber, NoteSymbol, NotesInfo, NotesNumberInfo, SingleStaff } from '@/types/MusicScoreType';
type SlotContext = {
    musicScore: MusicScore;
    grandStaff?: GrandStaff | null;
    singleStaff?: SingleStaff | null;
    measure?: Measure | null;
    note?: NoteSymbol | NoteNumber | null;
    info?: NotesInfo | NotesNumberInfo | null;
    self: SlotData['self'];
};
export declare function createSlotData(ctx: SlotContext): SlotData;
/** t / e 等曲谱级插槽 */
export declare function slotDataForMusicScore(musicScore: MusicScore): SlotData;
/** g 开头插槽：含 musicScore、grandStaff，self 为当前复谱表 */
export declare function slotDataForGrandStaff(musicScore: MusicScore, grandStaff: GrandStaff): SlotData;
/** s 开头插槽：在复谱表上下文上增加 singleStaff，self 为当前单谱表 */
export declare function slotDataForSingleStaff(musicScore: MusicScore, grandStaff: GrandStaff, singleStaff: SingleStaff): SlotData;
/** m 开头插槽：在单谱表上下文上增加 measure，self 为当前小节 */
export declare function slotDataForMeasure(musicScore: MusicScore, grandStaff: GrandStaff, singleStaff: SingleStaff, measure: Measure): SlotData;
export {};
