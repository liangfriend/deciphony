import { MeasureEndRepeatEnum, MeasureStartRepeatEnum } from '@/enums/musicScoreEnum';
import { NumberNotationSkinKeyEnum } from '@/numberNotation/enums/numberNotationSkinKeyEnum';
import { StandardStaffSkinKeyEnum } from '@/standardStaff/enums/standardStaffSkinKeyEnum';
type RepeatSkinKey = StandardStaffSkinKeyEnum | NumberNotationSkinKeyEnum;
export declare function getStartRepeatSkinKey(type: MeasureStartRepeatEnum): RepeatSkinKey;
export declare function getEndRepeatSkinKey(type: MeasureEndRepeatEnum): RepeatSkinKey;
export {};
