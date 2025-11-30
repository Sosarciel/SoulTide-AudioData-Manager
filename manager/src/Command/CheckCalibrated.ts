import { UtilFT } from "@zwa73/utils";
import { Command } from "commander";
import path from 'pathe';
import { DATA_PATH, getCalibratedDir, getRecognizedDir, getResDir } from "../Define";
import { mapChars, parseStrlist } from "./Util";
import fs from 'fs';






export const CmdCheckCalibrated = (program: Command) => program
    .command("Check-Calibrated")
    .alias("checkcalibrated")
    .description("检查校对状态")
    .argument('<characters>', '以 空格 分隔的角色名', parseStrlist)
    .action(async (characters:string[]) => {
        if(characters[0]=='*') characters = await fs.promises.readdir(DATA_PATH);
        characters = characters.filter(c=>c!='Kokkoro')
        await mapChars({characters, func:async (character) => {
            const resourceDir = getResDir(character);
            const recognizedDir = getRecognizedDir(character);
            const cailbratedDir = getCalibratedDir(character);

            const processedList = await UtilFT.fileSearchGlob(resourceDir,'processed/*');
            const recognizedList = await UtilFT.fileSearchGlob(recognizedDir,'*.srt');
            const cailbratedList = await UtilFT.fileSearchGlob(cailbratedDir,'*.srt');

            const recognizedNameList = new Set(recognizedList.map(fp=>path.parse(fp).name));
            const cailbratedNameList = new Set(cailbratedList.map(fp=>path.parse(fp).name));
            const checkName = (filepath:string)=>{
                const name = path.parse(filepath).name;
                if(!recognizedNameList.has(name))
                    console.log(`角色 ${character} 的 ${name} 未识别`);
                if(!cailbratedNameList.has(name))
                    console.log(`角色 ${character} 的 ${name} 未校对`);
            }
            processedList.map(checkName)
        }});
    })