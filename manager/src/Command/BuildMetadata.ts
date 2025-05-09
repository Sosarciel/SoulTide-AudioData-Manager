import { Command } from 'commander';
import fs from 'fs';
import { pipe, throwError, UtilFT } from '@zwa73/utils';
import path from 'pathe';
import { DATA_PATH, getResAudioDir, getResDir } from '../Define';

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

            if(! await UtilFT.pathExists(audioDir)) return;

            //categorized
            await pipe(
                UtilFT.fileSearchRegex(audioDir, /.+\.flac$/i),
                async fps => Promise.all(fps.map(async fp =>{
                    if(!/.+\.flac$/.test(fp))
                        console.log(`错误的文件名: ${fp}`);
                    const rfp = path.relative(resDir,fp);
                    return {filepath:rfp, text:path.parse(rfp).name};
                })),
                async datas => datas.sort((a, b) => a.filepath.localeCompare(b.filepath)).reduce((acc,cur)=>
                    `${acc}\n${JSON.stringify(cur.filepath)},${JSON.stringify(cur.text)}`
                ,'file_name,text'),
                async text => fs.promises.writeFile(path.join(resDir,'metadata.csv'),text),
            );
        });
});