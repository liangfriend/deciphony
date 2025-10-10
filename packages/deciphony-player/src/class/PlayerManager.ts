import Player from "./Player";
import player from "./Player";
import AudioPlayer from "./AudioPlayer";
import InstrumentPlayer from "./InstrumentPlayer";
import TonePlayer from "./TonePlayer";

class PlayerManager {
    context: AudioContext; // 音频上下文
    players: Record<string, Player> = {};

    constructor() {
        this.context = new AudioContext({
            latencyHint: 'interactive', // 或 'playback', 'balanced'
            sampleRate: 44100           // 也可以指定采样率（默认一般是 44100Hz）
        });
    }

    addPlayer(key: string, type: 'audio' | 'tone' | 'instrument') {
        switch (type) {
            case 'audio': {
                this.players[key] = new AudioPlayer({context: this.context})
                return this.players[key]
            }
            case 'tone': { // 合并ToneSequencePlayer到TonePlayer
                this.players[key] = new TonePlayer({context: this.context})
                return this.players[key]
            }
            case 'instrument': {
                this.players[key] = new InstrumentPlayer({context: this.context})
                return this.players[key]
            }
        }

    }
}

export default PlayerManager;