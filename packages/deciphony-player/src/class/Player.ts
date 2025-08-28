class Player {
    context:AudioContext; // 音频上下文
    gainNode: GainNode; // 增益节点
    source: AudioBufferSourceNode; // 音频源
    panner: StereoPannerNode;
    audios: any;
    constructor() {
        this.context = new AudioContext({
            latencyHint: 'interactive', // 或 'playback', 'balanced'
            sampleRate: 44100           // 也可以指定采样率（默认一般是 44100Hz）
        });
        this.gainNode = this.context.createGain();
        this.source = this.context.createBufferSource();
        const pannerOptions = { pan: 0 };
        this.panner = new StereoPannerNode(this.context, pannerOptions);
        // 节点连接
        this.source.connect(this.gainNode).connect(this.panner).connect(this.context.destination);
    }
    // 音量调节
    setVolume(volume: number = 1) {
        this.gainNode.value =volume
    }
    async add(key: string, url:string) {
        if (this.audios[key]) return;

        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.context.decodeAudioData(arrayBuffer);

        this.audios[key] = {
            buffer: audioBuffer,
            source: null,
            gainNode: this.context.createGain(),
            startTime: 0,
            pauseTime: 0,
            isPlaying: false,
        };
    },
    async play(key) {
        if (!audio) return;

        if (this.context.state === 'suspended') {
            await this.context.resume(); // 有些浏览器首次需手动激活音频上下文
        }

        if (audio.isPlaying) return;


        // 创建播放源
        const source = this.context.createBufferSource();
        // 传入音频数据
        source.buffer = audio.buffer;
        // 连接音频控制节点，连接扬声器
        source.connect(audio.gainNode)
        source.onended = () => {

        };
        // 存储源
        audio.source = source;




        const offset = audio.pauseTime || 0;
        // 播放
        audio.source.start(0, offset); // 从 pauseTime 的位置继续播放
        audio.startTime = this.context.currentTime - offset;
        audio.isPlaying = true;
    }
}