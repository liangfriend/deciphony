/**
 * 计算一组连杠音符的符杠斜率。
 *
 * @param stemEnds 每个符干与符杠的接点，顺序为视觉左→右。
 *                 up 方向取 stem.y（符干顶端），down 方向取 stem.y + stem.h（符干底端）。
 * @param direction 符干方向，与符杠绘制方向一致。
 *
 * 算法分三步（按优先级）：
 * 1. **水平符杠**：若中间某个符干的接点 y 与组内首/尾一样「极端」
 *    （up：不高于首尾最低点；down：不低于首尾最高点），
 *    则符杠强制水平（inclination = 0），锚点取该极端 y。
 * 2. **首尾连线斜率**：用首尾接点算初始斜率，再逐个中间符干收紧斜率，
 *    保证符杠不会从中间符干「穿出去」：
 *    - 正斜率：以首符干为锚，斜率取 min，使中间符干接点不低于符杠；
 *    - 负斜率：以尾符干为锚，斜率取 max，使中间符干接点不高于符杠。
 * 3. **斜率上限**：将斜率限制在 ±BEAM_MAX_SLOPE_DEG 以内，
 *    锚点用 pickExtremeStemEndForAnchor 取组内最靠外的一端。
 */
export declare function computeBeamSlope(stemEnds: Array<{
    x: number;
    y: number;
}>, direction: 'up' | 'down'): {
    inclination: number;
    anchor: {
        x: number;
        y: number;
    };
};
