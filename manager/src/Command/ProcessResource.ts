import { matchProc, SFfmpegTool, Stream, UtilFT, UtilFunc } from "@zwa73/utils";
import path from 'pathe';
import { Command } from 'commander';
import { eachChars, SliceData, splitWavByDataMP } from "./Util";
import { DATA_PATH, getResAudioDir, getResProcessedDir, getResSrtDir, getTmpConvertedDir, getTmpResampledDir } from "../Define";
import fs from 'fs';



const VaildExt = ['.wav','.flac'] as const;
type VaildExt = typeof VaildExt[number];

export const CmdProcessResource = (program: Command) => program
    .command("Process-Resource")
    .alias("processresource")
    .description("根据srt对raw进行切分")
    .argument('<characters>', '以 空格 分隔的角色名', (str) => str.split(' '))
    .requiredOption('-s, --sample_rate <sampleRate>', '采样率', (str) => parseInt(str), 22050)
    .action(async (characters:string[],opt:{sampleRate:number}) => {
        if(characters[0]=='*') characters = await fs.promises.readdir(DATA_PATH);
        const sliceDatas: SliceData[] = [];
        //产生处理数据
        await eachChars(characters, async (character) => {
            console.log(`正在处理 ${character}`);
            const processedDir = getResProcessedDir(character);
            const audioDir = getResAudioDir(character);
            const srtDir = getResSrtDir(character);
            const tmpConvertedDir = getTmpConvertedDir(character);
            await UtilFT.ensurePathExists(tmpConvertedDir,{dir:true});
            await UtilFT.ensurePathExists(processedDir,{dir:true});

            //复制数据
            const audioList = await UtilFT.fileSearchGlob(audioDir, `*`);
            await Stream.from(audioList,16)
                //转换数据
                .map(async (audioPath)=>{
                    const ext = path.parse(audioPath).ext as VaildExt;
                    if(!VaildExt.includes(ext))
                        throw `音频文件 ${audioPath} 不是有效格式`;
                    return await matchProc(ext,{
                        '.wav' :async ()=> audioPath,
                        '.flac':async ()=> {
                            //console.log(`正在转换 ${audioPath}`);
                            const wavPath = path.join(tmpConvertedDir,`${path.parse(audioPath).name}.wav`);
                            await SFfmpegTool.flac2wav(audioPath,wavPath);
                            return wavPath;
                        },
                    });
                })
                //切分或复制
                .map(async (audioPath)=>{
                    //尝试寻找srt
                    const srtPath = path.join(srtDir,`${path.parse(audioPath).name}.srt`);
                    if(await UtilFT.pathExists(srtPath)){
                        const text = await fs.promises.readFile(srtPath,'utf-8');
                        const srtseg = UtilFunc.parseSrt(text);
                        sliceDatas.push(...srtseg.map((seg,index)=>({
                            seg,index,inFilePath:audioPath,outDir:processedDir
                        })));
                        return;
                    }
                    //未找到则复制
                    await fs.promises.cp(audioPath,path.join(processedDir,path.parse(audioPath).base));
                }).append();
        });
        await splitWavByDataMP(sliceDatas);
    })