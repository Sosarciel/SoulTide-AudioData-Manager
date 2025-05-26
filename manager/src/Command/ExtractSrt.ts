import { Command } from "commander";
import fs from 'fs';
import { mapChars, parseSrtContent, parseStrlist } from "./Util";
import { getCalibratedDir, getResProcessedDir } from "../Define";
import path from "pathe";
import { Stream, UtilFunc } from "@zwa73/utils";




export const CmdExtractSrt = (program: Command) => program
    .command("Extract-Srt")
    .alias("extractsrt")
    .description("提取srt文件")
    .argument('<characters>', '以 空格 分隔的角色名', parseStrlist)
    .argument('<key>', 'regex匹配符')
    .argument('<outPath>', '输出路径')
    .option(`-d, --duration <duration>`, '最小时长(秒), 大于此设置的srt才会被匹配',parseFloat)
    .action(async (characters:string[],key:string,outPath:string,opt?:{duration?:number}) => {
        const {duration} = Object.assign({duration:0},opt??{});
        const regex = new RegExp(key,'m');
        mapChars(characters,async char =>{
            const caliDir = getCalibratedDir(char);
            const wavDir = getResProcessedDir(char);
            const clist = await fs.promises.readdir(caliDir);
            Stream.from(clist,16).map( async cfile =>{
                const cpath = path.join(caliDir,cfile);
                const text = await fs.promises.readFile(cpath,'utf-8');
                const srtseg = UtilFunc.parseSrt(text);
                if( ! srtseg.some( seg =>
                    regex.test(seg.text) && (((seg.end-seg.start)/1000)>=duration)
                )) return;
                const wavFile = cfile.replace('.srt','.wav');
                await fs.promises.cp(path.join(wavDir,wavFile), path.join(outPath,wavFile));
                await fs.promises.cp(cpath, path.join(outPath,cfile));
            }).apply();
        });
    });
