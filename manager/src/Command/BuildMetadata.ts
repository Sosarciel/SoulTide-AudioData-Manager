import { Command } from 'commander';
import fs from 'fs';
import { pipe, PromiseQueue, SrtSegment, UtilFT, UtilFunc } from '@zwa73/utils';
import path from 'pathe';
import { DATA_PATH, getCalibratedDir, getResAudioDir, getResDir } from '../Define';
import { CSV, parseSrtText } from './Util';


const queue = new PromiseQueue({concurrent:64});
export const CmdBuildMetadata = (program: Command) => program
    .command("Build-Metadata")
    .alias("buildmetadata")
    .description("构造trainingset的metadata.csv")
    .action(async()=>{
        const chars = await fs.promises.readdir(DATA_PATH);
        chars.map(async char => {
            if(char[0]==='@') return;
            if(['template','tmp'].includes(char)) return;
            const audioDir = getResAudioDir(char);
            const resDir = getResDir(char);
            const cailDir = getCalibratedDir(char);

            if(! await UtilFT.pathExists(audioDir)) return;

            //categorized
            await pipe(
                UtilFT.fileSearchRegex(audioDir, /.+\.flac$/i),
                async fps => Promise.all(fps.map(async fp =>{
                    if(!/.+\.flac$/.test(fp))
                        console.log(`错误的文件名: ${fp}`);
                    const rfp = path.relative(resDir,fp);
                    const fname = path.parse(fp).name;
                    const srtPath = path.join(cailDir,`${fname}.srt`);

                    let srtSegs:SrtSegment[]|undefined = undefined;
                    if(await UtilFT.pathExists(srtPath)){
                        const srtText = await queue.enqueue(()=>fs.promises.readFile(srtPath, 'utf8'));
                        srtSegs = UtilFunc.parseSrt(srtText);
                    }
                    const jatext = srtSegs?.map(v=>parseSrtText(v.text).raw).join('\n');
                    return {
                        file_name:rfp,
                        id:path.parse(rfp).name,
                        text:jatext??'None',
                    };
                })),
                async datas => datas.sort((a, b) => a.file_name.localeCompare(b.file_name)),
                    //.reduce((acc,cur)=>`${acc}\n${JSON.stringify(cur.filepath)},${JSON.stringify(cur.id)}`,'file_name,text'),
                async datas=> CSV.stringify(datas),
                async text => fs.promises.writeFile(path.join(resDir,'metadata.csv'),text),
            );
        });
});