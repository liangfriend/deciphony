/**
 * 插槽按钮 → dr-edit 的桥接：默认小节数等产品策略放 editHelper，不污染 dr-edit 底层 API。
 */
import type {GrandStaff, SingleStaff, SlotData} from 'deciphony-renderer'
import {
    addMeasure,
    deleteGrandStaff,
    deleteSingleStaff,
    insertGrandStaff,
    insertSingleStaff,
} from '../dr-extensions/dr-edit/edit-util';

/** 新增复谱表时，默认单谱表的小节数 */
const NEW_GRAND_STAFF_MEASURE_COUNT = 4;

function seedMeasuresToCount(singleStaff: SingleStaff, count: number): void {
    if (count <= 0) {
        singleStaff.measures.length = 0;
        return;
    }
    while (singleStaff.measures.length < count) {
        addMeasure(singleStaff);
    }
}

/** g-d 插槽：在当前复谱表下方插入复谱表，默认单谱表含 4 个空小节 */
export function addGrandStaffFromSlot(slot: SlotData): GrandStaff {
    if (!slot.grandStaff) throw new Error('当前插槽无复谱表上下文');
    const grandStaff = insertGrandStaff(slot.musicScore, slot.grandStaff, 'after');
    const singleStaff = grandStaff.staves[0];
    if (singleStaff) {
        seedMeasuresToCount(singleStaff, NEW_GRAND_STAFF_MEASURE_COUNT);
    }
    return grandStaff;
}

/** g-d 插槽：删除当前复谱表（至少保留 1 个复谱表） */
export function deleteGrandStaffFromSlot(slot: SlotData): boolean {
    if (!slot.grandStaff) return false;
    if (slot.musicScore.grandStaffs.length <= 1) return false;
    deleteGrandStaff(slot.musicScore, slot.grandStaff);
    return true;
}

/** s-d 插槽：在 anchor 单谱表下方追加单谱表，空小节数量与 anchor 一致 */
export function addSingleStaffFromSlot(slot: SlotData) {
    if (!slot.grandStaff) throw new Error('当前插槽无复谱表上下文');
    if (!slot.singleStaff) throw new Error('当前插槽无单谱表上下文');
    const anchor = slot.singleStaff;
    const newStaff = insertSingleStaff(slot.grandStaff, anchor, 'after');
    seedMeasuresToCount(newStaff, anchor.measures.length);
    return newStaff;
}

/** s-d 插槽：删除当前单谱表（同一复谱表内至少保留 1 个单谱表） */
export function deleteSingleStaffFromSlot(slot: SlotData): boolean {
    if (!slot.grandStaff || !slot.singleStaff) return false;
    if (slot.grandStaff.staves.length <= 1) return false;
    deleteSingleStaff(slot.grandStaff, slot.singleStaff);
    return true;
}

/** s-d 插槽：在单谱表末尾追加一个小节 */
export function addMeasureFromSlot(slot: SlotData) {
    if (!slot.singleStaff) throw new Error('当前插槽无单谱表上下文');
    return addMeasure(slot.singleStaff);
}
