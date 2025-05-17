import { Command } from "commander";
import fs from 'fs';
import { mapChars, parseStrlist } from "./Util";
import { getCalibratedDir } from "../Define";
import path from "pathe";




export const CmdExtractSrt = (program: Command) => program
    .command("Extract-Srt")
    .alias("extractsrt")
    .description("提取srt文件")
    .argument('<characters>', '以 空格 分隔的角色名', parseStrlist)
    .argument('<key>', 'regex匹配符')
    .argument('<outPath>', '输出路径')
    .action(async (characters:string[],key:string,outPath:string) => {
        const regex = new RegExp(key,'m');
        mapChars(characters,async char =>{
            const caliDir = getCalibratedDir(char);
            const clist = await fs.promises.readdir(caliDir);
            await Promise.all(clist.map( async cfile =>{
                const cpath = path.join(caliDir,cfile);
                const text = await fs.promises.readFile(cpath,'utf-8');
                if(regex.test(text))
                    await fs.promises.cp(cpath, path.join(outPath,cfile));
            }));
        });
    });
