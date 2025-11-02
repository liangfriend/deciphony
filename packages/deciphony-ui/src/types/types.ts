export interface ElementSerializedData {
    id: string;
    type: string;
    transform: {
        x: number;
        y: number;
        width: number;
        height: number;
        angle: number;
    };
    data: any;
    version?: string;
}

export interface WhiteboardSerializedData {
    version: string;
    elements: ElementSerializedData[];
    floatBoard: {
        width: number;
        height: number;
        position: string;
    };
    metadata: {
        createdAt: number;
        updatedAt: number;
    };
}

// 高亮策略
export interface HighlightPolicy {
    /** 是否允许重复触发同一音符高亮 */
    allowRepeat: boolean

    /** 若提前多少毫秒按下，不触发高亮（例如为了防止提前触键） */
    startTriggerThreshold: number

    /** 若超过音符区间多少毫秒秒还没按下，是否仍允许触发 */
    postTriggerThreshold: number

}

