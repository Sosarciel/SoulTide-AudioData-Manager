import { SFfmpegTool, SrtSegment, Stream, UtilFunc } from "@zwa73/utils";
import path from 'pathe';
import { Command } from 'commander';
import fs from 'fs';
import { getAudioDuratin } from "./Util";


export const CmdFilelistSrt = (program: Command) => program
    .command("Filelist-Srt")
    .alias("filelistsrt")
    .description("根据filelist产生srt")
    .argument('<filelistPath>', '输入的filelist路径')
    .argument('<wavDir>', 'filelist所对应的wav根目录路径')
    .argument('<outDir>', '输出的srt目录路径')
    .action(async (filelistPath:string,wavDir:string,outDir:string) => {
        const filelist = await fs.promises.readFile(filelistPath,'utf-8');
        const segdatalist = await Stream.from(filelist.replace(/\r\n/g,'\n').split('\n'))
            .concurrent(16)
            .map(async line=>{
                if(!line.includes('|')) return null;
                const [filePath,idx,text] = line.split('|');
                const fullpath = path.join(wavDir,filePath);
                const dur = await getAudioDuratin(fullpath);

                const seg:SrtSegment = {
                    start:0,
                    end:dur*1000,
                    text
                };
                return {
                    name: path.parse(filePath).name,
                    segs:[seg]
                };
            }).toArray();

        await Promise.all(segdatalist.map((dat)=>{
            if(dat==null) return;
            const {name,segs} = dat;
            const srt = UtilFunc.createSrt(segs);
            const outPath = path.join(outDir,`${name}.srt`);
            return fs.promises.writeFile(outPath,srt);
        }))
    })