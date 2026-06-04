import {Midi, NoteName, NoteString} from "deciphony-core";
import {ChronaxieEnum, DotEnum} from "deciphony-core";

export type Base64 = string

export type ToneColor = Record<string, Base64>;

export type ToneDuration = `${ChronaxieEnum}${DotEnum}`
// second和duration不能同时存在
export type ToneSequence = {
    type: 'note'
    tone: string | number,
    volume: number,// 0~1
    duration: ToneDuration,
} | {
    type: 'rest',
    duration: ToneDuration,
} | {
    type: 'note'
    tone: string | number,
    volume: number,// 0~1
    second: number, // 秒
} | {
    type: 'rest',
    second: number, // 秒
};
export type Envelope = {}

declare abstract class AudioWorkletProcessor {
    readonly port: MessagePort;

    constructor();

    abstract process(
        inputs: Float32Array[][],
        outputs: Float32Array[][],
        parameters: Record<string, Float32Array>
    ): boolean;
}

declare function registerProcessor(
    name: string,
    processorCtor: typeof AudioWorkletProcessor
): void;

