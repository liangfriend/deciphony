/** 皮肤 content 中 node.* 占位符 → 数值字符串 */
export function replaceSkinNodeVars(content, node) {
    return content
        .replaceAll('node.w', String(node.w))
        .replaceAll('node.h', String(node.h));
}
/** 求值 calc(...) 内的四则运算（先完成 node.* 替换后再调用） */
function evalCalcExpression(expr) {
    const trimmed = expr.trim();
    if (!trimmed || !/^[\d\s+\-*/().]+$/.test(trimmed))
        return NaN;
    try {
        return Function(`"use strict"; return (${trimmed});`)();
    }
    catch {
        return NaN;
    }
}
function formatCalcResult(value) {
    if (!Number.isFinite(value))
        return '0';
    const rounded = Math.round(value * 1e6) / 1e6;
    return String(rounded);
}
function negateCoord(v) {
    const n = parseFloat(v);
    if (!Number.isNaN(n))
        return formatCalcResult(-n);
    return `-${v}`;
}
/**
 * scaleAt(s, cx, cy) → translate(cx,cy) scale(s) translate(-cx,-cy)
 * 锚点坐标支持 calc(...)，与 node.* 一样先替换再求值
 */
export function expandSkinScaleAt(content) {
    return content.replace(/scaleAt\(\s*([^,]+?)\s*,\s*([^,]+?)\s*,\s*([^)]+?)\s*\)/g, (_, s, cx, cy) => {
        const scale = s.trim();
        const ax = cx.trim();
        const ay = cy.trim();
        if (ax === '0' && ay === '0')
            return `scale(${scale})`;
        return `translate(${ax}, ${ay}) scale(${scale}) translate(${negateCoord(ax)}, ${negateCoord(ay)})`;
    });
}
/** 将 content 中 calc(公式) 替换为求值结果；支持一层括号，如 calc((node.h-1.8)) */
export function evaluateSkinCalc(content) {
    let result = content;
    let prev = '';
    while (prev !== result) {
        prev = result;
        result = result.replace(/calc\(([^()]*(?:\([^()]*\)[^()]*)*)\)/g, (_, expr) => {
            const value = evalCalcExpression(expr);
            return Number.isFinite(value) ? formatCalcResult(value) : `calc(${expr})`;
        });
    }
    return result;
}
/** 皮肤 content 模板：node.* 替换 → calc(...) 求值 → scaleAt(...) 展开 */
export function applySkinContentTemplate(content, node) {
    return expandSkinScaleAt(evaluateSkinCalc(replaceSkinNodeVars(content, node)));
}
