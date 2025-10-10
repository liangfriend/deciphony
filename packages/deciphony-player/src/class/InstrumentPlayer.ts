import {Envelope} from "../types/types";
import {WindInstrumentEnum} from "../types/enum";

class InstrumentPlayer {
    context: AudioContext = null!
    // 播放参数
    frequency: number = 0; // 频率
    volume: number = 0; // 最终输出音量
    envelope: Envelope = {}; // 包络


    constructor({context}: { context: AudioContext }) {
        this.context = context;
    }

    getInstrumentInfo(instrument: WindInstrumentEnum): {
        path: string,
        registerName: string
    } {
        switch (instrument) {
            case WindInstrumentEnum.SineWind: {
                return {
                    path: "./processors/wind/SineWindProcessor.js",
                    registerName: "sine-wind-processor"
                }
            }
            default: {
                return {
                    path: "./processors/wind/SineWindProcessor.js",
                    registerName: "sine-wind-processor"
                }
            }
        }
    }


}

export default InstrumentPlayer;
