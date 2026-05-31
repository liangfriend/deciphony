import {MeasureEndRepeatEnum, MeasureStartRepeatEnum} from '@/enums/musicScoreEnum';
import {NumberNotationSkinKeyEnum} from '@/numberNotation/enums/numberNotationSkinKeyEnum';
import {StandardStaffSkinKeyEnum} from '@/standardStaff/enums/standardStaffSkinKeyEnum';

type RepeatSkinKey = StandardStaffSkinKeyEnum | NumberNotationSkinKeyEnum;

const START_REPEAT_SKIN: Record<MeasureStartRepeatEnum, RepeatSkinKey> = {
    [MeasureStartRepeatEnum.Coda]: StandardStaffSkinKeyEnum.Repeat_coda,
    [MeasureStartRepeatEnum.Segno]: StandardStaffSkinKeyEnum.Repeat_segno,
};

const END_REPEAT_SKIN: Record<MeasureEndRepeatEnum, RepeatSkinKey> = {
    [MeasureEndRepeatEnum.To_coda]: StandardStaffSkinKeyEnum.Repeat_to_coda,
    [MeasureEndRepeatEnum.DC]: StandardStaffSkinKeyEnum.Repeat_dc,
    [MeasureEndRepeatEnum.DS]: StandardStaffSkinKeyEnum.Repeat_ds,
    [MeasureEndRepeatEnum.Fine]: StandardStaffSkinKeyEnum.Repeat_fine,
    [MeasureEndRepeatEnum.DC_al_fine]: StandardStaffSkinKeyEnum.Repeat_dc_al_fine,
    [MeasureEndRepeatEnum.DC_al_coda]: StandardStaffSkinKeyEnum.Repeat_dc_al_coda,
    [MeasureEndRepeatEnum.DS_al_fine]: StandardStaffSkinKeyEnum.Repeat_ds_al_fine,
    [MeasureEndRepeatEnum.DS_al_coda]: StandardStaffSkinKeyEnum.Repeat_ds_al_coda,
};

export function getStartRepeatSkinKey(type: MeasureStartRepeatEnum): RepeatSkinKey {
    return START_REPEAT_SKIN[type];
}

export function getEndRepeatSkinKey(type: MeasureEndRepeatEnum): RepeatSkinKey {
    return END_REPEAT_SKIN[type];
}
