/**
 * 曲谱结构构建：工厂 + 按索引插入/删除 + 引用定位。
 * 供 edit-util 使用；对外尽量无 options，复杂参数留在 factories 内部。
 */
export * from './score-builder/index';
