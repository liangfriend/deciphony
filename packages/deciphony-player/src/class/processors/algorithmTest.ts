/*
* 算法测试
* */

const res:{channel:number[],sampleRate:number} ={
    channel:[],
    sampleRate:44100
}

// 参数控制

const harmonics = [
    { f: 400, amp: 0.5, type: "sine" },      // 基波
    // { f: 200, amp: 0.15, type: "square" },  // 方波
    // { f: 200, amp: 0.12, type: "sawtooth" }, // 锯齿波
    // { f: 400, amp: 0.5, type: "triangle" },  // 三角波
    // { f: 0, amp: 0.05, type: "noise" },      // 噪声
];

// 包络参数（单位：秒）
const adsr = {
    attack: 0.2,   // 攻击：音量从0到1
    decay: 0.3,    // 衰减：从1到持续音量
    sustain: 0.7,  // 持续阶段的音量比例
    release: 0.5,  // 释放阶段长度
    total: 2.0,    // 音符总时长（含释放）
};

// 通用波形函数
function getWaveValue(type:string, f:number, t:number) {
    const phase = 2 * Math.PI * f * t;

    switch (type) {
        case "sine":
            return Math.sin(phase);
        case "square":
            return Math.sign(Math.sin(phase)); // ±1 方波
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
    const { attack, decay, sustain, release, total } = adsr;

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

// 采样长度
const totalSamples = Math.floor(adsr.total * res.sampleRate);

for (let i = 0; i < totalSamples; i++) {
    const t = i / res.sampleRate;
    const env = getADSRGain(t);

    let y = 0;
    for (const { f, amp, type } of harmonics) {
        y += getWaveValue(type, f, t) * amp;
    }

    // 应用包络
    y *= env;
    res.channel.push(y);
}


export default res


// const baseFreq = 440; // A4 音高
// const harmonics = [
//     { n: 1, amp: 0.6 },
//     { n: 2, amp: 0.2 },
//     { n: 3, amp: 0.05 },
// ];
// const duration = 2;
// const total = duration * res.sampleRate;
//
// let lastNoise = 0;
// for (let i = 0; i < total; i++) {
//     const t = i / res.sampleRate;
//
//     // 包络
//     let env = 1;
//     const attack = 0.2, release = 0.4;
//     if (t < attack) env = t / attack;
//     else if (t > duration - release) env = 1 - (t - (duration - release)) / release;
//
//     // 频率微动
//     const freqMod = baseFreq * (1 + 0.01 * Math.sin(2 * Math.PI * 2 * t));
//
//     // 谐波部分
//     let tone = 0;
//     for (const { n, amp } of harmonics) {
//         tone += amp * Math.sin(2 * Math.PI * freqMod * n * t);
//     }
//
//     // 气息噪声部分（高通）
//     const breathNoise = (Math.random() - 0.5) * 0.3;
//     const filteredNoise = breathNoise - 0.95 * lastNoise;
//     lastNoise = breathNoise;
//
//     // 合成
//     const sample = (tone + filteredNoise * 0.6) * env;
//     res.channel.push(sample);
// }