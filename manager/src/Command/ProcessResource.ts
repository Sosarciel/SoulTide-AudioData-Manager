import { match, Stream, UtilFT, UtilFunc } from "@zwa73/utils";
import path from 'pathe';
import { Command } from 'commander';
import { getSplitWavName, mapChars, parseStrlist } from "./Util";
import { DATA_PATH, getResAudioDir, getResProcessedDir, getResSrtDir } from "../Define";
import fs from 'fs';
import { FfmpegFlow } from "@zwa73/audio-utils";



const VaildExt = ['.wav','.flac'] as const;
type VaildExt = typeof VaildExt[number];

export const CmdProcessResource = (program: Command) => program
    .command("Process-Resource")
    .alias("processresource")
    .description("根据srt对raw进行切分")
    .argument('<characters>', '以 空格 分隔的角色名', parseStrlist)
    //.requiredOption('-s, --sample_rate <sampleRate>', '采样率', (str) => parseInt(str), 22050)
    .action(async (characters:string[],opt:{sampleRate:number}) => {
        if(characters[0]=='*') characters = await fs.promises.readdir(DATA_PATH);

        //产生处理数据
        await mapChars({characters,func:async (character) => {
            console.log(`正在处理 ${character}`);
            const processedDir = getResProcessedDir(character);
            const audioDir = getResAudioDir(character);
            const srtDir = getResSrtDir(character);
            await UtilFT.ensurePathExists(processedDir,{dir:true});

            //复制数据
            const audioList = await UtilFT.fileSearchGlob(audioDir, `*`);

            const fnlist = (await Promise.all(audioList
                //转换数据
                .map((audioPath)=>{
                    const ext = path.parse(audioPath).ext as VaildExt;
                    if(!VaildExt.includes(ext))
                        throw `音频文件 ${audioPath} 不是有效格式`;

                    return match(ext,{
                        '.wav' :async ()=> ({
                            audioPath,
                            stream:undefined,
                        }),
                        '.flac':async ()=> ({
                            audioPath,
                            stream:FfmpegFlow.wav().clearMetadata(),
                        }),
                    });
                })
                //切分或复制
                .map(async (data)=>{
                    const {audioPath,stream} = await data;

                    //尝试寻找srt
                    const srtPath = path.join(srtDir,`${path.parse(audioPath).name}.srt`);
                    if(await UtilFT.pathExists(srtPath)){
                        const text = await fs.promises.readFile(srtPath,'utf-8');
                        const srtseg = UtilFunc.parseSrt(text);

                        return srtseg.map((seg,index)=>{
                            const nstream = stream==undefined ? FfmpegFlow.create() : stream.clone();

                            const outName = getSplitWavName(audioPath,index);
                            //console.log(audioPath,path.join(processedDir,outName))
                            const {start,end} = seg;
                            nstream.trim({start:start/1000,end:end/1000});
                            //console.log(2);
                            return ()=>nstream.apply(audioPath,path.join(processedDir,outName));
                        });
                    }

                    //未找到则复制
                    return [async ()=>{
                        const outpath = path.join(processedDir,`${path.parse(audioPath).name}.wav`);
                        stream!=undefined
                            ? await stream.apply(audioPath,outpath)
                            : await fs.promises.cp(audioPath,outpath)
                    }];
                }))).flat();

            await Stream.from(fnlist,8).map(fn=>fn()).apply();
        }});
    })