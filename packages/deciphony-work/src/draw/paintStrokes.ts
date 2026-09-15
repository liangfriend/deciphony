import {DrawToolEnum} from '../enums/drawToolEnum'
import type {DrawStroke} from '../types/types'

/** 将笔迹列表绘制到透明 canvas（橡皮用 destination-out） */
export function paintStrokes(
  ctx: CanvasRenderingContext2D,
  strokes: readonly DrawStroke[],
): void {
  for (const stroke of strokes) {
    paintStroke(ctx, stroke)
  }
}

export function paintStroke(ctx: CanvasRenderingContext2D, stroke: DrawStroke): void {
  const pts = stroke.points
  if (!pts.length) return

  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.lineWidth = Math.max(0.5, stroke.lineWidth)

  if (stroke.tool === DrawToolEnum.Eraser) {
    ctx.globalCompositeOperation = 'destination-out'
    ctx.strokeStyle = '#000'
    ctx.fillStyle = '#000'
  } else {
    ctx.globalCompositeOperation = 'source-over'
    const color = stroke.color ?? '#000000'
    ctx.strokeStyle = color
    ctx.fillStyle = color
  }

  if (pts.length === 1) {
    const [x, y] = pts[0]
    const r = ctx.lineWidth / 2
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  } else {
    ctx.beginPath()
    ctx.moveTo(pts[0][0], pts[0][1])
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i][0], pts[i][1])
    }
    ctx.stroke()
  }

  ctx.restore()
}

/** 增量画相邻两点（拖动过程中） */
export function paintStrokeSegment(
  ctx: CanvasRenderingContext2D,
  stroke: Pick<DrawStroke, 'tool' | 'color' | 'lineWidth'>,
  from: [number, number],
  to: [number, number],
): void {
  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.lineWidth = Math.max(0.5, stroke.lineWidth)

  if (stroke.tool === DrawToolEnum.Eraser) {
    ctx.globalCompositeOperation = 'destination-out'
    ctx.strokeStyle = '#000'
  } else {
    ctx.globalCompositeOperation = 'source-over'
    ctx.strokeStyle = stroke.color ?? '#000000'
  }

  ctx.beginPath()
  ctx.moveTo(from[0], from[1])
  ctx.lineTo(to[0], to[1])
  ctx.stroke()
  ctx.restore()
}
