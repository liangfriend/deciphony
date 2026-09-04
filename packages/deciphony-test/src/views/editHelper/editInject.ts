import type {InjectionKey} from 'vue'
import {useRenderEdit} from './useRenderEdit'

export type DrEditApi = ReturnType<typeof useRenderEdit>
export const DR_EDIT_INJECTION_KEY: InjectionKey<DrEditApi> = Symbol('drEdit')
