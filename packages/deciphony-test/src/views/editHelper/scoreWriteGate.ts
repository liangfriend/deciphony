import type {VDom} from '@deciphony/renderer'

/**
 * 源数据写入防抖门。预览走 updateVDom(targetId, patch) 原地改节点，落盘走 commit。
 * 约定见 `功能.md`「高频几何预览：updateVDom + scoreWriteGate.patch」。
 */
export const SCORE_WRITE_DEBOUNCE_MS = 100

/** musicScore.expose.updateVDom：按 targetId 原地 assign，不换节点引用 */
export type UpdateVDomFn = (targetId: string, patch: Partial<VDom>) => boolean

export type ScorePatch = {
    /** 同一 key 只保留最后一次 commit */
    key: string
    commit: () => void
    /** 立刻 updateVDom(targetId, patch) */
    mirror?: {targetId: string; patch: Partial<VDom>}
    /** 默认 100ms；结构变更用 0，立刻写入 */
    delay?: number
}

export type ScoreWriteGate = {
    patch: (spec: ScorePatch) => void
    flush: () => void
}

export function createScoreWriteGate(
    getUpdateVDom: () => UpdateVDomFn | undefined,
): ScoreWriteGate {
    const pending = new Map<string, () => void>()
    let timer: ReturnType<typeof setTimeout> | null = null

    function flush() {
        if (timer != null) {
            clearTimeout(timer)
            timer = null
        }
        if (!pending.size) return
        const jobs = [...pending.values()]
        pending.clear()
        for (const job of jobs) job()
    }

    function patch(spec: ScorePatch) {
        if (spec.mirror) {
            getUpdateVDom()?.(spec.mirror.targetId, spec.mirror.patch)
        }
        const delay = spec.delay ?? SCORE_WRITE_DEBOUNCE_MS
        if (delay <= 0) {
            pending.delete(spec.key)
            spec.commit()
            return
        }
        pending.set(spec.key, spec.commit)
        if (timer != null) clearTimeout(timer)
        timer = setTimeout(flush, delay)
    }

    return {patch, flush}
}

const gates = new WeakMap<object, ScoreWriteGate>()

/** 每个 musicScore 一份门。getUpdateVDom 只在首次创建时记下，闭包里读 ref 即可。 */
export function scoreWriteGateFor(
    musicScore: object,
    getUpdateVDom: () => UpdateVDomFn | undefined,
): ScoreWriteGate {
    let gate = gates.get(musicScore)
    if (!gate) {
        gate = createScoreWriteGate(getUpdateVDom)
        gates.set(musicScore, gate)
    }
    return gate
}

export function flushScoreWrites(musicScore: object) {
    gates.get(musicScore)?.flush()
}
