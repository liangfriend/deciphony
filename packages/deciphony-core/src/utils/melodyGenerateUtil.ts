/*
* 输入歌词，拍号，小节数，生成旋律
* 返回二维数组，[小节][音符信息]
* */

import {ChronaxieEnum, DotEnum} from "../musicScoreEnum";
import {TimeSignature} from "../types";

type Melody = {
    midi: number, // -1为休止符
    lyrics: string,
    chronaxie: ChronaxieEnum,
    dot: DotEnum,
}

/**
 * 输入歌词、拍号、小节数，生成一个简单的旋律
 * 返回二维数组：[小节][音符]
 *
 * 规则（简单版）：
 * - 去掉歌词中的空白字符，每个非空字符 = 一个音符（或休止符）
 * - 每个音符时值 = 拍号分母（比如 4/4 就都是四分音符）
 * - 每小节固定 timeSignature.beat 个音符（比如 4/4 就是 4 个四分音符）
 * - 如果歌词不够，就用休止符补齐
 * - 音高按一个固定 C 大调音阶循环：C D E F G A B C
 */
export function melodyGenerate(
    lyrics: string,
    timeSignature: TimeSignature,
    measureCount: number,
): Melody[][] {
    // 1. 拆分歌词：这里简单按“字符”处理（适合中文）
    const lyricChars = [...lyrics].filter(ch => !/\s/.test(ch));

    const result: Melody[][] = [];

    // 每小节有多少“拍”/音符（在这个简单实现里：1 拍 = 1 个音符）
    const notesPerMeasure = timeSignature.beat;
    const baseChronaxie = timeSignature.chronaxie;

    // 2. 一个简单的 C 大调音阶循环
    const scale: number[] = [60, 62, 64, 65, 67, 69, 71, 72]; // C4 D4 E4 F4 G4 A4 B4 C5
    let scaleIndex = 0;
    let lyricIndex = 0;

    for (let m = 0; m < measureCount; m++) {
        const measure: Melody[] = [];

        for (let n = 0; n < notesPerMeasure; n++) {
            if (lyricIndex < lyricChars.length) {
                // 有对应歌词：生成一个带音高的音符
                measure.push({
                    midi: scale[scaleIndex % scale.length],
                    lyrics: lyricChars[lyricIndex],
                    chronaxie: baseChronaxie,
                    dot: DotEnum.None,
                });

                lyricIndex++;
                scaleIndex++;
            } else {
                // 歌词用完：用休止符补位
                measure.push({
                    midi: -1,
                    lyrics: '',
                    chronaxie: baseChronaxie,
                    dot: DotEnum.None,
                });
            }
        }

        result.push(measure);
    }

    // 简单实现假设 measureCount 足够容纳全部歌词；
    // 如果 lyricChars 比总容量还多，多余部分会被忽略。
    return result;
}

/**
 * 根据路径生成旋律
 *
 * @param lyrics 歌词
 * @param timeSignature 拍号
 * @param measureCount 小节数
 * @param linePath 路径点数组 like [[1,1],[10,10]]
 * @param options {minMidi,maxMidi}
 */
export function melodyGenerateByLine(
    lyrics: string,
    timeSignature: TimeSignature,
    measureCount: number,
    linePath: number[][],
    options: {
        minMidi: number,
        maxMidi: number
    }
): Melody[][] {


    return result;
}

// const ts: TimeSignature = {
//     beat: 4,                    // 4/4 拍
//     chronaxie: ChronaxieEnum.quarter,
// };
//
// const melody = melodyGenerate('我们后来的一起爱上对方爱上', ts, 2);
// console.log(melody)

const ts: TimeSignature = {
    beat: 4,
    chronaxie: ChronaxieEnum.quarter
};

const path = [[1, 1], [2, 5], [10, 4]];

const melody = melodyGenerateByLine(
    "床前明月光",
    ts,
    2,
    path,
    {minMidi: 60, maxMidi: 72}
);

console.log(JSON.stringify(melody, null, 2));