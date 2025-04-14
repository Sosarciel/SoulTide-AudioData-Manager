import { ivk, Stream, UtilFT } from "@zwa73/utils";
import { Command } from "commander";
import path from 'pathe';
import { getTsetCharDir, getTsetInfoPath } from "../Define";
import { fixedCharCfg, getAudioDuratin } from "./Util";
import { TrainingSetInfo } from "../Schema.schema";
import { SFfmpegTool } from "@zwa73/audio-utils";




export const CmdCheckTrainingSet = (program: Command) => program
    .command("Check-TrainingSet")
    .alias("checktrainingset")
    .description("检查训练集")
    .argument('<trainingSetName>', '训练集名称')
    .action(async (trainingSetName:string) => {
        const tsetInfoPath = getTsetInfoPath(trainingSetName);
        if(!await UtilFT.pathExists(tsetInfoPath))
            throw '训练集信息文件不存在';
        const info = await UtilFT.loadJSONFile(tsetInfoPath) as TrainingSetInfo;
        const fixedCfg = fixedCharCfg(info);

        const funcs:(()=>Promise<void>)[]=[];
        const durations: { [key: string]: number } = {};

        const charlist = Object.keys(fixedCfg);
        for(const character of charlist){
            const tsetCharDir = getTsetCharDir(trainingSetName,character);
            const tsetList = await UtilFT.fileSearchGlob(tsetCharDir,'*');
            await Promise.all(tsetList.map(async (tsetPath)=>{
                const ext = path.parse(tsetPath).ext;
                if(ext !== '.wav') throw `音频文件 ${tsetPath} 不是wav格式`;
                funcs.push(async ()=>{
                    //console.log(`正在检查 ${processedPath}`);
                    if(!(await SFfmpegTool.isMono(tsetPath)))
                        throw `音频文件 ${tsetPath} 不是单声道`;
                    const duration = await getAudioDuratin(tsetPath);
                    if (!durations[character]) durations[character] = 0;
                    durations[character] += duration;
                })
            }));
        }
        await Stream.from(funcs,16).map(ivk).append();

        // 打印每个角色的总时长
        Object.keys(durations).forEach(character => {
            console.log(`角色 ${character} 的总时长: ${durations[character].toFixed(2)} 秒`);
        });
        console.log(`总计: ${Object.values(durations).reduce((a, b) => a + b, 0).toFixed(2)}秒`)
    });
