/**
 * renderEditTest 插槽按钮专用：复谱表/单谱表/小节的默认小节数策略仅在此实现，不污染 dr-edit。
 */
import type {GrandStaff, SingleStaff, SlotData} from '@/index';
import {
    addGrandStaff,
    addMeasure,
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

/** g-d 插槽：追加复谱表，默认单谱表含 4 个空小节 */
export function addGrandStaffFromSlot(slot: SlotData): GrandStaff {
    const grandStaff = addGrandStaff(slot.musicScore);
    const singleStaff = grandStaff.staves[0];
    if (singleStaff) {
        seedMeasuresToCount(singleStaff, NEW_GRAND_STAFF_MEASURE_COUNT);
    }
    return grandStaff;
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

/** s-d 插槽：在单谱表末尾追加一个小节 */
export function addMeasureFromSlot(slot: SlotData) {
    if (!slot.singleStaff) throw new Error('当前插槽无单谱表上下文');
    return addMeasure(slot.singleStaff);
}
