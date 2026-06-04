/** 简谱音符垂直布局（主音与倚音共用） */
export declare function noteCenterY(measureY: number, measureHeight: number, stackIndex: number, noteH?: number, yOffset?: number): number;
/** 和弦各声部八度点累加 y 偏移 */
export declare function computeOctaveDotYOffsets(allNotes: {
    syllable: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 'X';
    octaveDot?: number;
}[], dotH: number, fOff: number, spacing: number, lastEdgeMargin: number): number[];
