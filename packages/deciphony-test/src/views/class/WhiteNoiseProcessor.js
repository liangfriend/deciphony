class MyAudioProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.phase = 0;
        this.freq = 440;   // 默认频率
        this.volume = 0.5; // 默认音量

        this.port.onmessage = (event) => {
            if (event.data.type === "setFreq") {
                this.freq = event.data.value;
            } else if (event.data.type === "setVolume") {
                this.volume = event.data.value;
            }
        };
    }

    process(inputs, outputs, parameters) {
        const output = outputs[0];
        const increment = (2 * Math.PI * this.freq) / sampleRate;

        for (let channel = 0; channel < output.length; channel++) {
            const outputChannel = output[channel];
            for (let i = 0; i < outputChannel.length; i++) {
                outputChannel[i] = Math.sin(this.phase) * this.volume;
                this.phase += increment;
                if (this.phase > 2 * Math.PI) this.phase -= 2 * Math.PI;
            }
        }
        return true;
    }
}

registerProcessor("my-audio-processor", MyAudioProcessor);
