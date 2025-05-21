import { ivk, Stream, UtilFT } from "@zwa73/utils";
import { Command } from "commander";
import path from 'pathe';
import { DATA_PATH, getResDir } from "../Define";
import { getAudioDuratin, mapChars, parseStrlist } from "./Util";
import fs from 'fs';
import { FfmpegStream } from "@zwa73/audio-utils";


export const CmdCheckResource = (program: Command) => program
    .command("Check-Resource")
    .alias("checkresource")
    .description("检查处理完成的resource")
    .argument('<characters>', '以 空格 分隔的角色名', parseStrlist)
    .action(async (characters:string[]) => {
        const funcs:(()=>Promise<void>)[]=[];
        const durations: { [key: string]: number } = {};

        if(characters[0]=='*') characters = await fs.promises.readdir(DATA_PATH);

        await mapChars(characters, async (character) => {
            const resourceDir = getResDir(character);
            const processedList = await UtilFT.fileSearchGlob(resourceDir,'processed/*');
            await Promise.all(processedList.map(async (processedPath)=>{
                const ext = path.parse(processedPath).ext;
                if(ext !== '.wav')
                    console.log(`音频文件 ${processedPath} 不是wav格式`);
                funcs.push(async ()=>{
                    //console.log(`正在检查 ${processedPath}`);
                    if(!(await FfmpegStream.isMono(processedPath)))
                        console.log(`音频文件 ${processedPath} 不是单声道`);
                    const duration = await getAudioDuratin(processedPath);
                    if (!durations[character]) durations[character] = 0;
                    durations[character] += duration;
                })
            }));
        });
        await Stream.from(funcs,16).map(ivk).apply();

        // 打印每个角色的总时长
        Object.keys(durations).forEach(character => {
            console.log(`角色 ${character} 的总时长: ${durations[character].toFixed(2)} 秒`);
        });
        console.log(`总计: ${Object.values(durations).reduce((a, b) => a + b, 0).toFixed(2)}秒`)
    })