import type {VDom} from 'deciphony-renderer'

/** g-d / s-d 插槽内结构按钮的尺寸与定位（仅 UI 布局，数据变更走 renderEditSlotActions → dr-edit） */
export const ADD_GRAND_STAFF_BTN_W = 96
export const ADD_GRAND_STAFF_BTN_H = 36
export const DELETE_GRAND_STAFF_BTN_W = ADD_GRAND_STAFF_BTN_W
export const DELETE_GRAND_STAFF_BTN_H = ADD_GRAND_STAFF_BTN_H
export const ADD_SINGLE_STAFF_BTN_W = 20
export const ADD_SINGLE_STAFF_BTN_H = 20
export const DELETE_SINGLE_STAFF_BTN_W = ADD_SINGLE_STAFF_BTN_W
export const DELETE_SINGLE_STAFF_BTN_H = ADD_SINGLE_STAFF_BTN_H
export const ADD_MEASURE_BTN_W = 20
export const ADD_MEASURE_BTN_H = 20
/** 插槽内相邻按钮间距（g-d / s-d 统一） */
export const SLOT_BTN_GAP = 6
export const SLOT_BTN_RIGHT_MARGIN = 8

function grandStaffBtnGroupWidth() {
  return DELETE_GRAND_STAFF_BTN_W + SLOT_BTN_GAP + ADD_GRAND_STAFF_BTN_W
}

export function deleteGrandStaffBtnX(node: VDom) {
  return node.w / 2 - grandStaffBtnGroupWidth() / 2
}

export function deleteGrandStaffBtnY(node: VDom) {
  return node.h / 2 - DELETE_GRAND_STAFF_BTN_H / 2
}

export function addGrandStaffBtnX(node: VDom) {
  return deleteGrandStaffBtnX(node) + DELETE_GRAND_STAFF_BTN_W + SLOT_BTN_GAP
}

export function addGrandStaffBtnY(node: VDom) {
  return node.h / 2 - ADD_GRAND_STAFF_BTN_H / 2
}

function sSlotBtnY(node: VDom, btnH: number) {
  return node.h / 2 - btnH / 2
}

export function addMeasureBtnX(node: VDom) {
  return node.w - ADD_MEASURE_BTN_W - SLOT_BTN_RIGHT_MARGIN
}

export function addSingleStaffBtnX(node: VDom) {
  return addMeasureBtnX(node) - SLOT_BTN_GAP - ADD_SINGLE_STAFF_BTN_W
}

export function deleteSingleStaffBtnX(node: VDom) {
  return addSingleStaffBtnX(node) - SLOT_BTN_GAP - DELETE_SINGLE_STAFF_BTN_W
}

export function addSingleStaffBtnY(node: VDom) {
  return sSlotBtnY(node, ADD_SINGLE_STAFF_BTN_H)
}

export function deleteSingleStaffBtnY(node: VDom) {
  return sSlotBtnY(node, DELETE_SINGLE_STAFF_BTN_H)
}

export function addMeasureBtnY(node: VDom) {
  return sSlotBtnY(node, ADD_MEASURE_BTN_H)
}
