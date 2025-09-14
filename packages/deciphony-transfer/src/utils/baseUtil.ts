import {ToneDuration} from "../types/type";
import {TimeSignature} from "deciphony-core/types";
import {ChronaxieEnum} from "deciphony-core/musicScoreEnum";

export function base64ToArrayBuffer(base64: string) {
    // 先去掉 dataURL 的头部（如果有的话）
    const binaryString = atob(base64.replace(/^data:.*;base64,/, ''));
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer; // 返回 ArrayBuffer
}

// 时值转换毫秒
// 时值转换毫秒
export function toneDurationToTimestamp(duration: ToneDuration, bpm: number): number {
    const match = duration.match(/^(\d+)(\.*)$/);
    if (!match) throw new Error(`Invalid duration: ${duration}`);
    const [, valueStr, dots] = match;
    const value = Number(valueStr) as ChronaxieEnum;

    // 一拍 = 四分音符
    const beatDuration = 60000 / bpm;
    const quarterDuration = beatDuration;

    // 基础音符时长
    let noteDuration = quarterDuration * (4 / value);

    // 附点
    let dotFactor = 1;
    if (dots.length === 1) dotFactor = 1.5;
    else if (dots.length === 2) dotFactor = 1.75;
    else if (dots.length === 3) dotFactor = 1.875;

    return noteDuration * dotFactor;
}

