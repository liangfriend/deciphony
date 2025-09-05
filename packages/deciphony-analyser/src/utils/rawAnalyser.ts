function rawAnalyser(audioContext: AudioContext, analyser: AnalyserNode, dataArray: Float32Array<ArrayBufferLike>) {


// ========== 音高检测主循环 ==========
    function detectRaw() {
        analyser.getFloatTimeDomainData(dataArray)
 

        const result = {}
    }

    return {detectRaw: detectRaw}
}


export default rawAnalyser