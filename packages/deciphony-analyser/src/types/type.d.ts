interface DetectRes {
    note: string,
    frequency: number
}

type DetectCallback = (res: DetectRes) => void