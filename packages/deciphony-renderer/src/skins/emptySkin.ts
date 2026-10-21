import type {SkinItem} from '@/types/common';

/**
 * 皮肤缺失占位：皮肤包里找不到 skinKey 时统一画它（纯黑方框 + ×，不跟皮肤主题色）。
 * 不属于任何皮肤包，内置在 renderer；content 按节点尺寸伸缩。
 */
export const EMPTY_SKIN_KEY = 'empty';

/** 节点没有尺寸（排版时就查不到皮肤）时的占位尺寸 */
export const EMPTY_SKIN_SIZE = {w: 12, h: 12} as const;

export const EMPTY_SKIN_ITEM: SkinItem = {
    skinKey: EMPTY_SKIN_KEY,
    w: EMPTY_SKIN_SIZE.w,
    h: EMPTY_SKIN_SIZE.h,
    content:
        '<rect x="0.5" y="0.5" width="calc(node.w-1)" height="calc(node.h-1)" fill="transparent" stroke="black" stroke-width="1"/>'
        + '<line x1="0.5" y1="0.5" x2="calc(node.w-0.5)" y2="calc(node.h-0.5)" stroke="black" stroke-width="1"/>'
        + '<line x1="calc(node.w-0.5)" y1="0.5" x2="0.5" y2="calc(node.h-0.5)" stroke="black" stroke-width="1"/>',
};

const wrapped = new WeakMap<object, object>();

/**
 * 排版用：谱种皮肤表查不到的 key 返回占位尺寸的条目（skinKey 仍是原 key），节点照常排版；
 * 绘制时 Group 在真实皮肤表里查不到同一 key，就画 EMPTY_SKIN_ITEM。
 * 只拦截缺失的字符串 key 读取（`__` 开头、then / toJSON 等探测属性除外），枚举与 in 判断不变。
 */
export function withEmptySkinFallback<T extends object>(pack: T): T {
    const hit = wrapped.get(pack);
    if (hit) return hit as T;
    const proxy = new Proxy(pack, {
        get(target, key, receiver) {
            if (typeof key !== 'string' || key in target || key.startsWith('__') || key === 'then' || key === 'toJSON') {
                return Reflect.get(target, key, receiver);
            }
            return {...EMPTY_SKIN_ITEM, skinKey: key};
        },
    });
    wrapped.set(pack, proxy);
    return proxy;
}
