import { FfmpegFlow } from "@zwa73/audio-utils";
import path from "pathe";



(async ()=>{
    const dir = "K:/Model/VITS/Soultide/SoulTide-AudioData-Manager/dataset/character/Dreizehn";
    FfmpegFlow.trimSilence({silence:0.05}).apply(
        path.join(dir,"Dreizehn_Touch_Head_02_Segment_1.wav"),
        path.join(dir,"Dreizehn_Touch_Head_02_Segment_1_trim.wav"));
})();