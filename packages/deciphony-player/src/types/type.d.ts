import {Midi, NoteName, NoteString} from "deciphony-core/types";
import {ChronaxieEnum, DotEnum} from "deciphony-core/enum";

export type Base64 = string

export type ToneColor = Record<Midi, Base64>;

export type ToneDuration = `${ChronaxieEnum}${DotEnum}`
export type ToneSequence = {
    type: 'note'
    midi: Midi,
    volume: number,// 0~1
    duration: ToneDuration,
} | {
    type: 'rest',
    duration: ToneDuration,
};


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
