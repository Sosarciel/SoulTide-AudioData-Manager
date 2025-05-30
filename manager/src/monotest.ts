import { eachChars } from "./Command/Util";
import fs from 'fs';
import { DATA_PATH, getResProcessedDir } from "./Define";
import { FfmpegTool } from "@zwa73/audio-utils";
import { Stream, UtilFT } from "@zwa73/utils";



(async ()=>{
    const chars = await fs.promises.readdir(DATA_PATH);
    eachChars(chars,async char => {
        const psdDir = getResProcessedDir(char);
        const wavs = await UtilFT.fileSearchGlob(psdDir,"*.wav");
        Stream.from(wavs,16)
            .map(async wavpath=>{
                if(!await FfmpegTool.isMono(wavpath))
                    console.log(`${wavpath} 不是单声道`);
            });
    });
})();
