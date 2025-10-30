import {Midi, NoteName, NoteString} from "deciphony-core";
import {ChronaxieEnum, DotEnum} from "deciphony-core";

export type Base64 = string


export declare abstract class AudioWorkletProcessor {
    readonly port: MessagePort;

    constructor();

    abstract process(
        inputs: Float32Array[][],
        outputs: Float32Array[][],
        parameters: Record<string, Float32Array>
    ): boolean;
}

export declare function registerProcessor(
    name: string,
    processorCtor: typeof AudioWorkletProcessor
): void;

