class MyAudioProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.phase = 0;
        this.freq = 440;   // 默认频率
        this.volume = 0.5; // 默认音量
        this.smoothVolume = 0;
        this.port.onmessage = (event) => {
            this.freq = +event.data.freq;
            this.volume = +event.data.volume;

        };
    }


    process(inputs, outputs) {
        const input = inputs[0];
        const output = outputs[0];

        // 计算当前块的瞬时音量
        let micVolume = 0;
        if (input.length > 0) {
            const inputChannel = input[0];
            let sum = 0;
            for (let i = 0; i < inputChannel.length; i++) {
                sum += Math.abs(inputChannel[i]);
            }
            micVolume = sum / inputChannel.length;
        }

        // 指数平滑，alpha 控制平滑速度 (0~1)
        const alpha = 0.1;
        this.smoothVolume = this.smoothVolume * (1 - alpha) + micVolume * alpha;
        const increment = (2 * Math.PI * this.freq) / sampleRate;
        console.log('chicken', micVolume)
        for (let channel = 0; channel < output.length; channel++) {
            const outputChannel = output[channel];
            for (let i = 0; i < outputChannel.length; i++) {
                outputChannel[i] = micVolume
                this.phase += increment;
                if (this.phase > 2 * Math.PI) this.phase -= 2 * Math.PI;
            }
        }

        return true;
    }

    // process(inputs, outputs, parameters) {
    //     const output = outputs[0];
    //     const increment = (2 * Math.PI * this.freq) / sampleRate;
    //
    //     for (let channel = 0; channel < output.length; channel++) {
    //         const outputChannel = output[channel];
    //         for (let i = 0; i < outputChannel.length; i++) {
    //             outputChannel[i] = Math.sin(this.phase) * this.volume;
    //             this.phase += increment;
    //             if (this.phase > 2 * Math.PI) this.phase -= 2 * Math.PI;
    //         }
    //     }
    //     return true;
    // }
}

registerProcessor("my-audio-processor", MyAudioProcessor);
