/*
 * 将 musicScore 转换为平铺的 vDom 列表
 * 计算并输出：复谱表、单谱表、13 个曲谱层面插槽
 * 小节及更细部分由调用方处理（m 插槽处预留空间）
 */

export type {NodeIdMap} from "./types";
export {musicScoreToVDom} from "./musicScoreToVDomImpl";
