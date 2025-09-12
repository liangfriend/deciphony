import {AudioWorkletProcessor, registerProcessor} from "../../types/type";

class MyAudioProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
    }

    process(inputList: Float32Array[][],
            outputList: Float32Array[][],
            parameters: Record<string, Float32Array>) {
        // 判断最小通道
        const sourceLimit = Math.min(inputList.length, outputList.length);
        for (let inputNum = 0; inputNum < sourceLimit; inputNum++) {
            let input = inputList[inputNum];
            let output = outputList[0];
            let channelCount = Math.min(input.length, output.length);

            for (let channelNum = 0; channelNum < channelCount; channelNum++) {
                for (let i = 0; i < input[channelNum].length; i++) {
                    let sample = output[channelNum][i] + input[channelNum][i];

                    if (sample > 1.0) {
                        sample = 1.0;
                    } else if (sample < -1.0) {
                        sample = -1.0;
                    }

                    output[channelNum][i] = sample;
                }
            }
        }
        ;
// 出于兼容性原因，您必须始终从 process() 返回 true，至少在 Chrome 上如此
        return true;
    }
}

registerProcessor("my-audio-processor", MyAudioProcessor);