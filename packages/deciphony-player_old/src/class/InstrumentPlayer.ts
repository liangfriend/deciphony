import {Envelope} from "../types/types";
import {WindInstrumentEnum} from "../types/enum";
import DesolateWindProcessor from '../processors/wind/DesolateWindProcessor?url'
import SineWindProcessor from '../processors/wind/SineWindProcessor?url'

class InstrumentPlayer {
    context: AudioContext = null!
    // 播放参数
    frequency: number = 0; // 频率
    volume: number = 0; // 最终输出音量
    envelope: Envelope = {}; // 包络


    constructor() {
        this.context = this.context = new AudioContext();
    }

    getInstrumentInfo(instrument: WindInstrumentEnum): {
        path: string,
        registerName: string
    } {
        switch (instrument) {
            case WindInstrumentEnum.SineWind: {
                return {
                    path: SineWindProcessor,
                    registerName: "sine-wind-processor"
                }
            }
            case WindInstrumentEnum.Desolate: {
                return {
                    path: DesolateWindProcessor,
                    registerName: "desolate-wind-processor"
                }
            }
            default: {
                return {
                    path: SineWindProcessor,
                    registerName: "sine-wind-processor"
                }
            }
        }
    }


}

export default InstrumentPlayer;
