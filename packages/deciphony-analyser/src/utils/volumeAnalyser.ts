// volumeAnalyser.ts
function volumeAnalyser(audioContext: AudioContext, analyser: AnalyserNode, dataArray: Float32Array<ArrayBufferLike>) {
    // ========== 音量计算（RMS） ==========
    function computeRMS(buffer: Float32Array): number {
        let sumSquares = 0
        for (let i = 0; i < buffer.length; i++) {
            sumSquares += buffer[i] * buffer[i]
        }
        return Math.sqrt(sumSquares / buffer.length)
    }

    // ========== 音量检测主循环 ==========
    function detectVolume() {
        analyser.getFloatTimeDomainData(dataArray)
        const rms = computeRMS(dataArray)

        // 简单归一化（0 ~ 1）
        // 根据实际情况可以放大，比如 * 100 转换成百分比
        const volume = Math.min(rms * 10, 1)

        const result: DetectRes = {
            volume,
            frequency: 0,  // 这里不用频率，但为了类型统一可以保留
            note: ""
        }

        // TODO: 触发回调，如果和 frequencyAnalyser 一样的话
        // detectCallback?.(result)
    }

    return {detectVolume: detectVolume}
}

export default volumeAnalyser
