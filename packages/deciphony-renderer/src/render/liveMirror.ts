import type {ArpeggioTypeEnum, PedalTypeEnum, PitchTypeEnum, SlurTypeEnum} from '@/enums/musicScoreEnum'
import type {Frame, VDom} from '@/types/common'

type Point = { x: number, y: number }

/** 与 VDom.special.slur 同结构，供拖拽预览直接替换 */
export type SlurMirror = {
    relativeStartPoint: Point
    relativeEndPoint: Point
    relativeControlPoint: Point
    thickness: number
    type?: SlurTypeEnum
    relativeTextPoint?: Point
}

export type FrameMirror = Pick<Frame, 'relativeX' | 'relativeY' | 'relativeW' | 'relativeH'>

export type VoltaMirror = {
    text?: string
    openLeft?: boolean
    openRight?: boolean
    relativeX?: number
    relativeY?: number
    relativeW?: number
    relativeH?: number
}

function pt(p?: Point): Point {
    return {x: p?.x ?? 0, y: p?.y ?? 0}
}

/** 与 VDom.special.arpeggio 同结构，供垂直符号拖拽预览 */
export type ArpeggioMirror = {
    relativeStartPoint: Point
    relativeEndPoint: Point
    arrow?: boolean
    type?: ArpeggioTypeEnum
    thickness?: number
    arrowWidth?: number
}

/** 与 VDom.special.strumming 同结构，供垂直符号拖拽预览 */
export type StrummingMirror = {
    relativeStartPoint: Point
    relativeEndPoint: Point
    arrow?: boolean
    thickness?: number
    arrowWidth?: number
}

/** 与 VDom.special.pedal 同结构，供横向符号拖拽预览 */
export type PedalMirror = {
    relativeStartPoint: Point
    relativeEndPoint: Point
    type?: PedalTypeEnum
    thickness?: number
}

/** 与 VDom.special.pitch 同结构，供横向八度记号拖拽预览 */
export type PitchMirror = {
    relativeStartPoint: Point
    relativeEndPoint: Point
    type?: PitchTypeEnum
    direction?: 'up' | 'down'
    thickness?: number
}

/** Frame 的 relativeX/Y 会同时推动连音线、符杠、推弦、琶音/扫弦/踏板/八度记号的端点（与 applyRelativeFrameToVDom 一致） */
function shiftsEndpoints(node: VDom): boolean {
    return node.tag === 'noteBeam'
        || node.special?.slur != null
        || node.special?.arpeggio != null
        || node.special?.strumming != null
        || node.special?.pedal != null
        || node.special?.pitch != null
        || node.tag === 'bend'
        || node.tag === 'arpeggio'
        || node.tag === 'strumming'
}

/**
 * Frame.relativeX/Y/W/H → vDom.x/y/w/h。
 * 调用方传入改前/改后的相对值，这里只加 delta，不把相对值当成绝对坐标。
 */
export function mirrorFrame(list: VDom[], targetId: string, prev: FrameMirror, next: FrameMirror): VDom[] {
    const dx = next.relativeX - prev.relativeX
    const dy = next.relativeY - prev.relativeY
    const dw = next.relativeW - prev.relativeW
    const dh = next.relativeH - prev.relativeH
    if (dx === 0 && dy === 0 && dw === 0 && dh === 0) return list
    return list.map((node) => {
        if (node.targetId !== targetId) return node
        const shift = shiftsEndpoints(node)
        return {
            ...node,
            x: node.x + dx,
            y: node.y + dy,
            w: node.w + dw,
            h: node.h + dh,
            startPoint: shift
                ? {x: node.startPoint.x + dx, y: node.startPoint.y + dy}
                : node.startPoint,
            endPoint: shift
                ? {x: node.endPoint.x + dx, y: node.endPoint.y + dy}
                : node.endPoint,
        }
    })
}

/**
 * data.slur → 可原地 assign 到现有 affiliation 节点的 patch（startPoint/endPoint + special.slur）。
 * slur.vue 的弧端读的是 startPoint/endPoint，只改 special 里的相对起点不会移动弧线。
 */
export function slurVDomPatch(node: VDom, slur: SlurMirror): Partial<VDom> | null {
    const prev = node.special?.slur
    if (!prev) return null
    const oldStart = pt(prev.relativeStartPoint)
    const oldEnd = pt(prev.relativeEndPoint)
    const newStart = pt(slur.relativeStartPoint)
    const newEnd = pt(slur.relativeEndPoint)
    return {
        startPoint: {
            x: node.startPoint.x - oldStart.x + newStart.x,
            y: node.startPoint.y - oldStart.y + newStart.y,
        },
        endPoint: {
            x: node.endPoint.x - oldEnd.x + newEnd.x,
            y: node.endPoint.y - oldEnd.y + newEnd.y,
        },
        special: {
            slur: {
                ...prev,
                ...slur,
                relativeStartPoint: newStart,
                relativeEndPoint: newEnd,
                relativeControlPoint: pt(slur.relativeControlPoint),
                relativeTextPoint: slur.relativeTextPoint ? pt(slur.relativeTextPoint) : prev.relativeTextPoint,
            },
        },
    }
}

/**
 * @deprecated 会换节点引用；高频跟手请用 slurVDomPatch + updateVDom(targetId, patch)
 */
export function mirrorSlurData(list: VDom[], slurId: string, slur: SlurMirror): VDom[] {
    return list.map((node) => {
        if (node.targetId !== slurId || !node.special?.slur) return node
        const patch = slurVDomPatch(node, slur)
        return patch ? {...node, ...patch, special: {...node.special, ...patch.special}} : node
    })
}

/**
 * data.arpeggio → 可原地 assign 到 affiliation / arpeggio 节点的 patch。
 * 组件读 startPoint/endPoint，只改 special 里的相对点不会移动几何。
 */
export function arpeggioVDomPatch(node: VDom, arp: ArpeggioMirror): Partial<VDom> | null {
    const prev = node.special?.arpeggio
    if (!prev) return null
    const oldStart = pt(prev.relativeStartPoint)
    const oldEnd = pt(prev.relativeEndPoint)
    const newStart = pt(arp.relativeStartPoint)
    const newEnd = pt(arp.relativeEndPoint)
    return {
        startPoint: {
            x: node.startPoint.x - oldStart.x + newStart.x,
            y: node.startPoint.y - oldStart.y + newStart.y,
        },
        endPoint: {
            x: node.endPoint.x - oldEnd.x + newEnd.x,
            y: node.endPoint.y - oldEnd.y + newEnd.y,
        },
        special: {
            arpeggio: {
                ...prev,
                ...arp,
                relativeStartPoint: newStart,
                relativeEndPoint: newEnd,
            },
        },
    }
}

/**
 * @deprecated 会换节点引用；高频跟手请用 arpeggioVDomPatch + updateVDom(targetId, patch)
 */
export function mirrorArpeggioData(list: VDom[], targetId: string, arp: ArpeggioMirror): VDom[] {
    return list.map((node) => {
        if (node.targetId !== targetId || !node.special?.arpeggio) return node
        const patch = arpeggioVDomPatch(node, arp)
        return patch ? {...node, ...patch, special: {...node.special, ...patch.special}} : node
    })
}

/**
 * data.strumming → 可原地 assign 到 affiliation / strumming 节点的 patch。
 */
export function strummingVDomPatch(node: VDom, strum: StrummingMirror): Partial<VDom> | null {
    const prev = node.special?.strumming
    if (!prev) return null
    const oldStart = pt(prev.relativeStartPoint)
    const oldEnd = pt(prev.relativeEndPoint)
    const newStart = pt(strum.relativeStartPoint)
    const newEnd = pt(strum.relativeEndPoint)
    return {
        startPoint: {
            x: node.startPoint.x - oldStart.x + newStart.x,
            y: node.startPoint.y - oldStart.y + newStart.y,
        },
        endPoint: {
            x: node.endPoint.x - oldEnd.x + newEnd.x,
            y: node.endPoint.y - oldEnd.y + newEnd.y,
        },
        special: {
            strumming: {
                ...prev,
                ...strum,
                relativeStartPoint: newStart,
                relativeEndPoint: newEnd,
            },
        },
    }
}

/**
 * @deprecated 会换节点引用；高频跟手请用 strummingVDomPatch + updateVDom(targetId, patch)
 */
export function mirrorStrummingData(list: VDom[], targetId: string, strum: StrummingMirror): VDom[] {
    return list.map((node) => {
        if (node.targetId !== targetId || !node.special?.strumming) return node
        const patch = strummingVDomPatch(node, strum)
        return patch ? {...node, ...patch, special: {...node.special, ...patch.special}} : node
    })
}

/**
 * data.pedal → 可原地 assign 到 affiliation 节点的 patch。
 */
export function pedalVDomPatch(node: VDom, pedal: PedalMirror): Partial<VDom> | null {
    const prev = node.special?.pedal
    if (!prev) return null
    const oldStart = pt(prev.relativeStartPoint)
    const oldEnd = pt(prev.relativeEndPoint)
    const newStart = pt(pedal.relativeStartPoint)
    const newEnd = pt(pedal.relativeEndPoint)
    return {
        startPoint: {
            x: node.startPoint.x - oldStart.x + newStart.x,
            y: node.startPoint.y - oldStart.y + newStart.y,
        },
        endPoint: {
            x: node.endPoint.x - oldEnd.x + newEnd.x,
            y: node.endPoint.y - oldEnd.y + newEnd.y,
        },
        special: {
            pedal: {
                ...prev,
                ...pedal,
                relativeStartPoint: newStart,
                relativeEndPoint: newEnd,
            },
        },
    }
}

/**
 * @deprecated 会换节点引用；高频跟手请用 pedalVDomPatch + updateVDom(targetId, patch)
 */
export function mirrorPedalData(list: VDom[], targetId: string, pedal: PedalMirror): VDom[] {
    return list.map((node) => {
        if (node.targetId !== targetId || !node.special?.pedal) return node
        const patch = pedalVDomPatch(node, pedal)
        return patch ? {...node, ...patch, special: {...node.special, ...patch.special}} : node
    })
}

/**
 * data.pitch → 可原地 assign 到 affiliation 节点的 patch。
 */
export function pitchVDomPatch(node: VDom, pitch: PitchMirror): Partial<VDom> | null {
    const prev = node.special?.pitch
    if (!prev) return null
    const oldStart = pt(prev.relativeStartPoint)
    const oldEnd = pt(prev.relativeEndPoint)
    const newStart = pt(pitch.relativeStartPoint)
    const newEnd = pt(pitch.relativeEndPoint)
    return {
        startPoint: {
            x: node.startPoint.x - oldStart.x + newStart.x,
            y: node.startPoint.y - oldStart.y + newStart.y,
        },
        endPoint: {
            x: node.endPoint.x - oldEnd.x + newEnd.x,
            y: node.endPoint.y - oldEnd.y + newEnd.y,
        },
        special: {
            pitch: {
                ...prev,
                ...pitch,
                relativeStartPoint: newStart,
                relativeEndPoint: newEnd,
            },
        },
    }
}

/**
 * @deprecated 会换节点引用；高频跟手请用 pitchVDomPatch + updateVDom(targetId, patch)
 */
export function mirrorPitchData(list: VDom[], targetId: string, pitch: PitchMirror): VDom[] {
    return list.map((node) => {
        if (node.targetId !== targetId || !node.special?.pitch) return node
        const patch = pitchVDomPatch(node, pitch)
        return patch ? {...node, ...patch, special: {...node.special, ...patch.special}} : node
    })
}

/**
 * data.volta 里能对上视图的部分：
 * text / openLeft / openRight → special.volta；
 * relativeX/Y/W/H 已烘焙进 vDom 的 x/y/w/h，按 delta 平移。
 * heightRatio、value 会改高度基准或播放遍次，不在这里预览。
 */
export function mirrorVoltaData(list: VDom[], voltaId: string, prev: VoltaMirror, next: VoltaMirror): VDom[] {
    const dx = (next.relativeX ?? 0) - (prev.relativeX ?? 0)
    const dy = (next.relativeY ?? 0) - (prev.relativeY ?? 0)
    const dw = (next.relativeW ?? 0) - (prev.relativeW ?? 0)
    const dh = (next.relativeH ?? 0) - (prev.relativeH ?? 0)
    return list.map((node) => {
        const volta = node.special?.volta
        if (node.targetId !== voltaId || !volta) return node
        return {
            ...node,
            x: node.x + dx,
            y: node.y + dy,
            w: node.w + dw,
            h: node.h + dh,
            special: {
                ...node.special,
                volta: {
                    ...volta,
                    ...(next.text != null ? {text: next.text} : {}),
                    ...(next.openLeft != null ? {openLeft: next.openLeft} : {}),
                    ...(next.openRight != null ? {openRight: next.openRight} : {}),
                },
            },
        }
    })
}

/** 推弦 data 与 special.bend 同结构，bend.vue 直接读 special 里的相对点 */
export function mirrorBendData(
    list: VDom[],
    targetId: string,
    bend: NonNullable<VDom['special']['bend']>,
): VDom[] {
    const next = JSON.parse(JSON.stringify(bend)) as NonNullable<VDom['special']['bend']>
    return list.map((node) => {
        if (node.targetId !== targetId || node.tag !== 'bend') return node
        return {
            ...node,
            special: {...node.special, bend: next},
        }
    })
}
