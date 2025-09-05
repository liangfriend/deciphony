interface DetectRes {
    note?: string,
    frequency?: number,
    volume?: number
}

type DetectCallback = (res: DetectRes) => void