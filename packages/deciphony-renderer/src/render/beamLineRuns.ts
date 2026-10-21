import type {VDom} from '@/types/common';

type BeamLine = NonNullable<VDom['special']['beam']>['lines'][number];

/** 该线是否画满到本段左 / 右段界（短符杠 scaleX ≠ 1 不算） */
function reachesLeft(line: BeamLine | undefined): boolean {
    return !!line && (line.type === 'both' || line.type === 'left') && (line.scaleX ?? 1) === 1;
}

function reachesRight(line: BeamLine | undefined): boolean {
    return !!line && (line.type === 'both' || line.type === 'right') && (line.scaleX ?? 1) === 1;
}

/**
 * 同一组符杠里跨多段连续的线改由起始段一次画完：起始段写 run（线终点相对本段 startPoint.x 的偏移），
 * 后续段写 covered 跳过。分段各画各的，接缝处无论重叠（抗锯齿边缘合成两次发深）还是对接（拐角覆盖率估高 / 小数 x 处发白）都有瑕疵；
 * 短符杠（一半连接）仍在本段单独画。
 * segments 为同一组按从左到右顺序生成的 noteBeam。
 */
export function markBeamLineRuns(vDoms: VDom[], start: number): void {
    const segments = vDoms.slice(start).filter((v) => v.tag === 'noteBeam' && v.special?.beam);
    const maxLines = Math.max(0, ...segments.map((s) => s.special.beam!.lines.length));
    for (let i = 0; i < maxLines; i++) {
        let j = 0;
        while (j < segments.length) {
            let k = j;
            while (k + 1 < segments.length
                && reachesRight(segments[k]!.special.beam!.lines[i])
                && reachesLeft(segments[k + 1]!.special.beam!.lines[i])) {
                k++;
            }
            if (k > j) {
                const first = segments[j]!;
                const last = segments[k]!;
                const lastLine = last.special.beam!.lines[i]!;
                const endX = lastLine.type === 'left' ? last.special.beam!.centerX : last.endPoint.x;
                first.special.beam!.lines[i] = {...first.special.beam!.lines[i]!, run: endX - first.startPoint.x};
                for (let m = j + 1; m <= k; m++) {
                    const lines = segments[m]!.special.beam!.lines;
                    lines[i] = {...lines[i]!, covered: true};
                }
            }
            j = k + 1;
        }
    }
}
