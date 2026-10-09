import type {MidiRecorder} from './types'

type MidiMessageEventLike = {data: Uint8Array | null; timeStamp: number}
type MidiInputLike = {
  id: string
  name?: string | null
  onmidimessage: ((event: MidiMessageEventLike) => void) | null
}
type MidiAccessLike = {
  inputs: Map<string, MidiInputLike> | {forEach(cb: (input: MidiInputLike) => void): void}
  onstatechange: (() => void) | null
}

export type ConnectWebMidiOptions = {
  /** 只接这些输入设备（id）；默认全部 */
  inputIds?: string[]
  /** 只接这些通道（1–16）；默认全部 */
  channels?: number[]
  /** 设备列表变化 */
  onDevicesChange?: (devices: {id: string; name: string}[]) => void
}

export type WebMidiConnection = {
  devices(): {id: string; name: string}[]
  disconnect(): void
}

/**
 * 浏览器 Web MIDI → recorder.noteOn / noteOff（time 用事件 timeStamp，与 performance.now() 同基准）。
 * 需要浏览器支持 navigator.requestMIDIAccess（Chrome / Edge）。
 */
export async function connectWebMidi(recorder: MidiRecorder, options: ConnectWebMidiOptions = {}): Promise<WebMidiConnection> {
  const nav = typeof navigator !== 'undefined' ? (navigator as unknown as {requestMIDIAccess?: () => Promise<MidiAccessLike>}) : null
  if (!nav?.requestMIDIAccess) throw new Error('当前环境不支持 Web MIDI')
  const access = await nav.requestMIDIAccess()
  const bound = new Map<string, MidiInputLike>()

  const handle = (event: MidiMessageEventLike) => {
    const data = event.data
    if (!data || data.length < 2) return
    const status = data[0]! & 0xf0
    const channel = (data[0]! & 0x0f) + 1
    if (options.channels && !options.channels.includes(channel)) return
    const midi = data[1]!
    const velocity = data[2] ?? 0
    const time = event.timeStamp || undefined
    if (status === 0x90 && velocity > 0) recorder.noteOn(midi, velocity, time)
    else if (status === 0x80 || status === 0x90) recorder.noteOff(midi, time)
  }

  const list = () => [...bound.values()].map((i) => ({id: i.id, name: i.name ?? i.id}))

  const bind = () => {
    const seen = new Set<string>()
    access.inputs.forEach((input: MidiInputLike) => {
      if (options.inputIds && !options.inputIds.includes(input.id)) return
      seen.add(input.id)
      if (!bound.has(input.id)) {
        input.onmidimessage = handle
        bound.set(input.id, input)
      }
    })
    for (const [id, input] of bound) {
      if (!seen.has(id)) {
        input.onmidimessage = null
        bound.delete(id)
      }
    }
    options.onDevicesChange?.(list())
  }

  bind()
  access.onstatechange = bind

  return {
    devices: list,
    disconnect() {
      access.onstatechange = null
      for (const input of bound.values()) input.onmidimessage = null
      bound.clear()
    },
  }
}
