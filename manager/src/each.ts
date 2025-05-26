import fs from 'fs';
import { DATA_PATH, getCalibratedDir, getResProcessedDir, ROOT_PATH } from './Define';
import { mapChars } from './Command/Util';
import { Stream } from '@zwa73/js-utils';
import { UtilFT, UtilFunc } from '@zwa73/utils';
import path from 'pathe';


const outPath = path.join(ROOT_PATH,"tmp","fxdot");

(async()=>{
    const characters = await fs.promises.readdir(DATA_PATH);
    mapChars(characters, async char => {
        const caliDir = getCalibratedDir(char);
        const wavDir = getResProcessedDir(char);
        const srtlist = await UtilFT.fileSearchGlob(caliDir, '**/*.srt');
        Stream.from(srtlist, 16)
            .map(async srtPath => {
                const text = await fs.promises.readFile(srtPath,'utf-8');
                const seg = UtilFunc.parseSrt(text);
                if(seg.some((cur,idx)=>{
                    if(idx==0) return false;
                    if(seg[idx-1].text.trim().endsWith(cur.text.trim())) return true;
                })){
                    const srtFile = path.parse(srtPath).base;
                    const wavFile = srtFile.replace('.srt','.wav');
                    await fs.promises.cp(path.join(wavDir,wavFile), path.join(outPath,wavFile));
                    await fs.promises.cp(srtPath, path.join(outPath,srtFile));
                }
            })
            .apply();
    });
})()