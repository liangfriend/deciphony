// white-noise-processor.js
import {AudioWorkletProcessor, registerProcessor} from "../../types/type";

class WhiteNoiseProcessor extends AudioWorkletProcessor {
    isPlaying: boolean;
    frequency: number;
    volume: number;
    stopTime: number;

    constructor() {
        super();
        this.isPlaying = false;
        this.frequency = 440;
        this.volume = 0.5;
        this.stopTime = 0;

        this.port.onmessage = (event) => {
            const data = event.data;
            if (data.type === "noteOn") {
                this.isPlaying = true;
                this.frequency = data.frequency;
                this.volume = data.volume;
                this.stopTime = 0;
            }
            if (data.type === "noteOff") {
                this.isPlaying = false;
            }
            if (data.type === "playNote") {
                this.isPlaying = true;
                this.frequency = data.frequency;
                this.volume = data.volume;
                this.stopTime = currentTime + data.duration;
            }
        };
    }

    process(inputs, outputs) {
        const output = outputs[0];
        const channel = output[0];

        if (this.isPlaying) {
            for (let i = 0; i < channel.length; i++) {
                // 白噪声
                channel[i] = (Math.random() * 2 - 1) * this.volume;
            }

            // 如果是触发乐器，到点就停止
            if (this.stopTime && currentTime >= this.stopTime) {
                this.isPlaying = false;
            }
        } else {
            channel.fill(0);
        }

        return true;
    }
}

registerProcessor("white-noise-processor", WhiteNoiseProcessor);
