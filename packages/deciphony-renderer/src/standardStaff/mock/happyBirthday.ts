import {MusicScore} from "@/standardStaff/types";
import {MusicScoreTypeEnum} from "@/enum";

const data: MusicScore = {
    type: MusicScoreTypeEnum.StandardStaff,
    multipleStaves: [{
        singleStaff: [{}]
    }],
    spanSymbol: [],
}
export default data;