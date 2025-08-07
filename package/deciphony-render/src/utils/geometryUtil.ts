// 复合性aspectRatiao获取


export function getMultipleAspectRatio(msSymbol: MsSymbol): number {
    const information = MsSymbolInformationMap[msSymbol.type]
    if ('aspectRatio' in information && typeof information.aspectRatio === 'object') {
        if (msSymbol.type === MsSymbolTypeEnum.keySignature) {
            return information.aspectRatio[msSymbol.keySignature]
        } else if (msSymbol.type === MsSymbolTypeEnum.barLine || msSymbol.type === MsSymbolTypeEnum.barLine_f) {
            return information.aspectRatio[msSymbol.barLineType]
        } else if (msSymbol.type === MsSymbolTypeEnum.noteTail) {
            return information.aspectRatio[msSymbol.chronaxie]
        }
    }
    console.error('符号有误或符号不是复合aspectRatio类型')
    return 0

}
// 获取音符aspectRatio
export function getMsSymbolAspectRatio(msSymbol: MsSymbol) {
    if (!msSymbol?.type) {
        console.error("缺少符号传参，宽高比获取失败")
        return 1
    }
    // 单小节符号，赋值
    const information = MsSymbolInformationMap[msSymbol.type]
    if ('aspectRatio' in information && (typeof information.aspectRatio === 'number')) {
        return information.aspectRatio
    } else if ('aspectRatio' in information && (typeof information.aspectRatio === 'object')) {
        return getMultipleAspectRatio(msSymbol)
    }
    console.error("未找到符号对应宽高比")
    return 1
}
// 获取高度乘数
export function getHeightMultiplier(msSymbol: MsSymbol) {
    if (!msSymbol?.type) {
        console.error("缺少符号传参，高度乘数获取失败")
        return 1
    }
    // 单小节符号，赋值
    const information = MsSymbolInformationMap[msSymbol.type]
    if ('heightMultiplier' in information && (typeof information.aspectRatio === 'number')) {
        return information.heightMultiplier
    }

    return 1
}