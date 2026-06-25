/**
 * 吉他谱符杠：首、末符干终点连线定斜率，不做线谱式中间收紧与最大角限制。
 */

export type StemEndPoint = { x: number; y: number };

/** 由首末符干终点 (x,y) 得符杠直线：y = anchor.y + inclination * (x - anchor.x) */
export function computeGuitarTabBeamFromStemEnds(
    stemEnds: StemEndPoint[],
): { inclination: number; anchor: StemEndPoint } {
    const first = stemEnds[0]!;
    const last = stemEnds[stemEnds.length - 1]!;
    const dx = last.x - first.x;
    const inclination = dx === 0 ? 0 : (last.y - first.y) / dx;
    return {inclination, anchor: first};
}
