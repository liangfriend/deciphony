import {onBeforeUnmount, onMounted, ref} from 'vue'

export type MidiPianoStatus = 'unsupported' | 'denied' | 'ready' | 'empty'

type MidiInputLike = {
  id: string
  name: string | null
  addEventListener: (type: 'midimessage', listener: (ev: {data: Uint8Array | null}) => void) => void
  removeEventListener: (type: 'midimessage', listener: (ev: {data: Uint8Array | null}) => void) => void
}

type MidiAccessLike = {
  inputs: {values: () => IterableIterator<MidiInputLike>}
  addEventListener: (type: 'statechange', listener: () => void) => void
  removeEventListener: (type: 'statechange', listener: () => void) => void
}

/**
 * Web MIDI：监听所有输入设备的 note-on（velocity>0），回调 midi 音高 0–127。
 * 小节选中判断由回调方处理。
 */
export function useMidiPianoInput(onNoteOn: (midi: number) => void) {
  const status = ref<MidiPianoStatus>('unsupported')
  const deviceNames = ref<string[]>([])

  let access: MidiAccessLike | null = null
  const inputCleanups: Array<() => void> = []

  function clearInputs() {
    for (const dispose of inputCleanups.splice(0)) dispose()
  }

  function bindAllInputs() {
    if (!access) return
    clearInputs()
    const names: string[] = []
    for (const input of access.inputs.values()) {
      names.push(input.name || input.id)
      const handler = (ev: {data: Uint8Array | null}) => {
        const data = ev.data
        if (!data || data.length < 3) return
        const statusByte = data[0]! & 0xf0
        const note = data[1]!
        const velocity = data[2]!
        if (statusByte === 0x90 && velocity > 0) onNoteOn(note)
      }
      input.addEventListener('midimessage', handler)
      inputCleanups.push(() => input.removeEventListener('midimessage', handler))
    }
    deviceNames.value = names
    status.value = names.length ? 'ready' : 'empty'
  }

  function onStateChange() {
    bindAllInputs()
  }

  onMounted(async () => {
    const request = (
      navigator as Navigator & {
        requestMIDIAccess?: (options?: {sysex?: boolean}) => Promise<MidiAccessLike>
      }
    ).requestMIDIAccess
    if (typeof request !== 'function') {
      status.value = 'unsupported'
      return
    }
    try {
      access = await request.call(navigator, {sysex: false})
      bindAllInputs()
      access.addEventListener('statechange', onStateChange)
    } catch {
      status.value = 'denied'
    }
  })

  onBeforeUnmount(() => {
    access?.removeEventListener('statechange', onStateChange)
    clearInputs()
    access = null
  })

  return {status, deviceNames}
}
