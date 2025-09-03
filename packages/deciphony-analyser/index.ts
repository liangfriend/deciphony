import frequencyAnalyser from "./src/utils/frequencyAnalyser"
import volumeAnalyser from "./src/utils/volumeAnalyser"

let audioContext: AudioContext  // 音频上下文
let analyser: AnalyserNode  // 音频分析器
let dataArray: Float32Array  // 音频数据
let source: MediaStreamAudioSourceNode  // 音频源
let animationFrameId: number
let detectCallback: DetectCallback

const detectFuncList: Record<string, () => Partial<DetectRes>> = {}

function detect() {
    const result: DetectRes = {
        note: "",
        frequency: 0,
        volume: 0
    }

    for (let key of Object.keys(detectFuncList)) {
        const partialRes = detectFuncList[key]()
        Object.assign(result, partialRes)
    }

    detectCallback?.(result)
    animationFrameId = requestAnimationFrame(detect)
}

// ========== 开始检测 ==========
async function startDetect(cb: DetectCallback) {
    detectCallback = cb
    try {
        const stream = await navigator.mediaDevices.getUserMedia({audio: true})
        audioContext = new AudioContext()
        analyser = audioContext.createAnalyser()
        analyser.fftSize = 2048

        const bufferLength = analyser.fftSize
        dataArray = new Float32Array(bufferLength)

        source = audioContext.createMediaStreamSource(stream)
        source.connect(analyser)

        // 注册频率分析
        const freqRes = frequencyAnalyser(audioContext, analyser, dataArray)
        detectFuncList["frequency"] = freqRes.detectPitch

        // 注册音量分析
        const volRes = volumeAnalyser(audioContext, analyser, dataArray)
        detectFuncList["volume"] = volRes.detectVolume

        detect()
    } catch (e) {
        console.error("获取麦克风失败:", e)
    }
}

// ========== 停止检测 ==========
function dispose() {
    cancelAnimationFrame(animationFrameId)
    audioContext?.close()
}

export {startDetect, dispose}
