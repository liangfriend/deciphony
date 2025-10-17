import {whiteBoardState} from "./enum";

export type AddElementOptions = {
    left: number,
    top: number,
    width?: number,
    height?: number,
    angle?: number,
    center?: 'vertical' | 'horizontal' | 'center'
    cloneNode?: true | false,
    serializableData: {
        type: string,
        id: string,
        data: any,
        version: string
    }

}

export interface WBElement extends HTMLElement {
    play: () => void
    pause: () => void
    stop: () => void
    addElement: (options: AddElementOptions, key: string) => void
    cacheElement: (element: Element, key: string) => void
    delCacheElement: (key: string) => void
    switchState: (param: whiteBoardState) => void
}

declare global {
    interface HTMLElement {
        _dragData?: {
            onMouseDown: (e: MouseEvent) => void
        }
    }
}
