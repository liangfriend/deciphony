import type {DrExtension, DrExtensionEvents} from '@/types/extension'

export function fanoutExtensionEvent<K extends keyof DrExtensionEvents>(
  extensions: DrExtension[] | undefined,
  name: K,
  ...args: Parameters<NonNullable<DrExtensionEvents[K]>>
): void {
  if (!extensions?.length) return
  for (const ext of extensions) {
    const handler = ext.on?.[name]
    if (!handler) continue
    try {
      (handler as (...a: typeof args) => void)(...args)
    } catch (err) {
      console.error(`[${ext.name}] ${name}`, err)
    }
  }
}
