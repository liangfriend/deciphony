import {computed, type Ref} from 'vue'
import {MusicScoreTypeEnum} from '@/enums/musicScoreEnum'
import {resolveSkinColor} from '@/render/resolveSkinColor'
import type {Skin, VDom} from '@/types/common'

/** Beam / Slur / Volta：从 skinKey 对应 SkinItem.content 取纯色 */
export function useGeometrySkinColor(
    vDom: Ref<VDom>,
    skin: Ref<Skin | undefined> | undefined,
    notationType: Ref<MusicScoreTypeEnum | undefined> | undefined,
) {
    return computed(() => resolveSkinColor(
        skin?.value,
        vDom.value.skinName,
        notationType?.value ?? MusicScoreTypeEnum.StandardStaff,
        vDom.value.skinKey,
    ))
}
