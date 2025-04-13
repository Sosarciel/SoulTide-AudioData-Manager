import { Command } from "commander";
import fs from 'fs';




export const CmdExtractValset = (program: Command) => program
    .command("Extract-Valset")
    .alias("extractvalset")
    .description("提取验证集")
    .argument('<filelistPath>', '训练集路径')
    .argument('<valOutPath>', '验证集输出路径')
    .option('-w, --weight <1-100>', '验证集比重/百分比',parseInt)
    .action(async (filelistPath:string,valOutPath:string,opt:{weight?:number}) => {
        const weight = opt.weight ?? 10;
        const text = await fs.promises.readFile(filelistPath,'utf-8');
        const lines = text.replace(/\r\n/g,'\n').split('\n');

        const valCount = Math.ceil(lines.length * (weight / 100));
        const step = lines.length / valCount;

        let valset = '';
            for (let i = 0; i < valCount; i++) {
                valset += `${lines[Math.floor(i * step)]}\n`;
        }
        await fs.promises.writeFile(valOutPath,valset.trim());
    });
