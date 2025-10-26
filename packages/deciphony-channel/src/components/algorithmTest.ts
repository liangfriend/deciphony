/*
* 算法测试
* */

const res: { channel: number[], sampleRate: number } = {
    channel: [],
    sampleRate: 44100
}

// 参数控制

// const harmonics = [
//     // {f: 400, amp: 0.5, type: "sine"},      // 基波
//     // {f: 200, amp: 0.15, type: "square"},  // 方波
//     // {f: 200, amp: 0.12, type: "sawtooth"}, // 锯齿波
//     // {f: 400, amp: 0.5, type: "triangle"},  // 三角波
//     // { f: 0, amp: 0.05, type: "noise" },      // 噪声
// ];
const harmonics = [
    {f: 300, amp: 0.5, type: "sine"},      // 基波
    // {f: 300, amp: 0.1, type: "sine2"},      // 基波
    // {
    //     f: 600, amp: 0.4, type: "sine", change: {
    //         '0': 1,
    //         '50': 0.5,
    //         '100': 1
    //     }
    // },

    // 基波
    // {f: 200, amp: 0.1, type: "sine"},      // 基波
    // {f: 20, amp: 0.2, type: "sine"},      // 基波
    // {f: 200, amp: 0.15, type: "square"},  // 方波
    // {f: 200, amp: 0.12, type: "sawtooth"}, // 锯齿波
    // {f: 400, amp: 0.5, type: "triangle"},  // 三角波
    // {f: 0, amp: 0.05, type: "noise"},      // 噪声
];

// 包络参数（单位：秒）
const adsr = {
    attack: 0.5,   // 攻击：音量从0到1
    decay: 0,    // 衰减：从1到持续音量
    sustain: 1,  // 持续阶段的音量比例
    release: 0.5,  // 释放阶段长度
    total: 2.0,    // 音符总时长（含释放）
};

// 通用波形函数
function getWaveValue(type: string, f: number, t: number) {


    switch (type) {
        case "sine": {
            const phase = 2 * Math.PI * f * t;
            return Math.sin(phase);
        }

        case "sine2": {
            const phase = 2 * Math.PI * f * t;
            return Math.cos(phase);
        }
        case "square": {
            const phase = 2 * Math.PI * f * t;
            return Math.sign(Math.sin(phase)); // ±1 方波
        }

        case "sawtooth":
            return 2 * (t * f - Math.floor(0.5 + t * f)); // [-1, 1] 锯齿波
        case "triangle":
            return 2 * Math.abs(2 * (t * f - Math.floor(t * f + 0.5))) - 1; // 三角波
        case "noise":
            return Math.random() * 2 - 1; // 白噪声
        default:
            return 0;
    }
}

// ADSR 包络函数
function getADSRGain(t) {
    const {attack, decay, sustain, release, total} = adsr;

    if (t < attack) {
        return t / attack; // Attack: 0 → 1
    } else if (t < attack + decay) {
        const ratio = (t - attack) / decay;
        return 1 - (1 - sustain) * ratio; // Decay: 1 → sustain
    } else if (t < total - release) {
        return sustain; // Sustain: 固定音量
    } else if (t < total) {
        const ratio = (t - (total - release)) / release;
        return sustain * (1 - ratio); // Release: sustain → 0
    } else {
        return 0; // 结束
    }
}

/** 计算振幅变化（线性插值） */
function getDynamicAmp(change: Record<string, number>, t: number, totalTime: number) {
    const percent = (t / totalTime) * 100; // 当前百分比
    const keys = Object.keys(change).map(Number).sort((a, b) => a - b);

    // 小于最小关键帧
    if (percent <= keys[0]) return change[keys[0].toString()];
    // 大于最大关键帧
    if (percent >= keys[keys.length - 1]) return change[keys[keys.length - 1].toString()];

    // 在中间段 -> 线性插值
    for (let i = 0; i < keys.length - 1; i++) {
        const k1 = keys[i];
        const k2 = keys[i + 1];
        if (percent >= k1 && percent < k2) {
            const v1 = change[k1.toString()];
            const v2 = change[k2.toString()];
            const ratio = (percent - k1) / (k2 - k1);
            return v1 + (v2 - v1) * ratio;
        }
    }

    return 1; // 默认值
}

// -------------------------
// 主计算逻辑
// -------------------------
const totalSamples = Math.floor(adsr.total * res.sampleRate);
// 生成数组
for (let i = 0; i < totalSamples; i++) {
    const t = i / res.sampleRate;
    const env = getADSRGain(t);

    let y = 0;
    for (const {f, amp, type, change} of harmonics) {
        let currentAmp = amp;
        if (change) {
            currentAmp *= getDynamicAmp(change, t, adsr.total);
        }
        y += getWaveValue(type, f, t) * currentAmp;
    }

    // 应用包络
    // y *= env;
    res.channel.push(y);
}


export default res
// 放入完成数组
// const test = []
// const test2 = {
//     channel: test,
//     sampleRate: 44100
// }
// for(let i = 0; i < 20000; i++) {
//     test2.push(i%2)
// }
// export default test2
