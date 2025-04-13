import { UtilFT } from "@zwa73/utils";
import { Command } from 'commander';
import { DATA_PATH } from "../Define";
import fs from 'fs';



export const CmdClearCache = (program: Command) => program
    .command("Clear-Cache")
    .alias("clearcache")
    .description("清理临时文件")
    .option('-p, --processed', '清理processed文件夹',false)
    .action(async (opt:{processed:boolean}) => {
        const tmpList = opt.processed
            ? await UtilFT.fileSearchGlob(DATA_PATH,'*/resource/processed/**')
            : await UtilFT.fileSearchGlob(DATA_PATH,'*/tmp/**');
        await Promise.all(tmpList.map(async (tmpPath)=>{
            await fs.promises.rm(tmpPath,{recursive:true,force:true});
        }));
    })