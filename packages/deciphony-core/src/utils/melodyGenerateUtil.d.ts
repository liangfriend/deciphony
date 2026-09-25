import { ChronaxieEnum, DotEnum } from "../musicScoreEnum";
import { TimeSignature } from "../types";
type Melody = {
    midi: number;
    lyrics: string;
    chronaxie: ChronaxieEnum;
    dot: DotEnum;
};
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
export declare function melodyGenerate(lyrics: string, timeSignature: TimeSignature, measureCount: number): Melody[][];
export declare function melodyFix(lyrics: string, curMelody: Melody, timeSignature: TimeSignature, measureCount: number): void;
export {};
/**
 * 根据路径生成旋律
 *
 * @param lyrics 歌词
 * @param timeSignature 拍号
 * @param measureCount 小节数
 * @param linePath 路径点数组 like [[1,1],[10,10]]
 * @param options {minMidi,maxMidi}
 */
