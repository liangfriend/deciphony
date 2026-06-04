export function createSlotData(ctx) {
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
export function slotDataForMusicScore(musicScore) {
    return createSlotData({ musicScore, self: musicScore });
}
/** g 开头插槽：含 musicScore、grandStaff，self 为当前复谱表 */
export function slotDataForGrandStaff(musicScore, grandStaff) {
    return createSlotData({ musicScore, grandStaff, self: grandStaff });
}
/** s 开头插槽：在复谱表上下文上增加 singleStaff，self 为当前单谱表 */
export function slotDataForSingleStaff(musicScore, grandStaff, singleStaff) {
    return createSlotData({ musicScore, grandStaff, singleStaff, self: singleStaff });
}
/** m 开头插槽：在单谱表上下文上增加 measure，self 为当前小节 */
export function slotDataForMeasure(musicScore, grandStaff, singleStaff, measure) {
    return createSlotData({ musicScore, grandStaff, singleStaff, measure, self: measure });
}
