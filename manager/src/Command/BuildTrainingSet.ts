import { pipe, Stream, UtilFT, UtilFunc } from "@zwa73/utils";
import { Command } from "commander";
import path from 'pathe';
import { getCalibratedDir, getResProcessedDir, getTmpResampledDir, getTmpSplitDir, getTmpTrimSilenceDir, getTsetCharDir, getTsetDataDir, getTsetFilelistPath, getTsetInfoPath } from "../Define";
import { TrainingSetInfo } from "../Schema.schema";
import fs from 'fs';
import { parseSrtContent, getAudioDuratin, fixedCharCfg, LangFlagExt, getSplitWavName } from "./Util";
import { FfmpegStream } from "@zwa73/audio-utils";


const checkOrThrow = (str?:string)=>{
    if(!str) throw '参数不能为空';
    return str;
}

const SplitSep = '_';

export const CmdBuildTrainingSet = (program: Command) => program
    .command("Build-TrainingSet")
    .alias("buildtrainingset")
    .description("根据配置生成训练集")
    .argument('<trainingSetName>', '训练集名称')
    .option('-f, --force', '强制覆盖缓存',false)
    .action(async (trainingSetName:string,opt:{force:boolean}) => {
        const tsetDataDir = getTsetDataDir(trainingSetName);
        const tsetInfoPath = getTsetInfoPath(trainingSetName);
        const tsetFilelistPath = getTsetFilelistPath(trainingSetName);
        if(!await UtilFT.pathExists(tsetInfoPath))
            throw '训练集信息文件不存在';
        //删除旧数据
        if(await UtilFT.pathExists(tsetDataDir))
            await fs.promises.rm(tsetDataDir,{recursive:true});
        if(await UtilFT.pathExists(tsetFilelistPath))
            await fs.promises.unlink(tsetFilelistPath);
        const info = await UtilFT.loadJSONFile(tsetInfoPath) as TrainingSetInfo;
        const format = info.filelist_format;
        const sr = info.sample_rate;
        const fixedCfg = fixedCharCfg(info);

        await pipe(
            Promise.all(Object.keys(fixedCfg).map(async char => {
                const splitTmpDit     = getTmpSplitDir(char);
                const trimTmpDir      = getTmpTrimSilenceDir(char);
                const tsetCharDir     = getTsetCharDir(trainingSetName,char);
                const tmpResampledDir = getTmpResampledDir(char,sr);
                await UtilFT.ensurePathExists(tmpResampledDir,{dir:true});
                await UtilFT.ensurePathExists(splitTmpDit,{dir:true});
                await UtilFT.ensurePathExists(trimTmpDir,{dir:true});
                await UtilFT.ensurePathExists(tsetCharDir,{dir:true});
                const processedDir = getResProcessedDir(char);
                const calibratedDir = getCalibratedDir(char);
                const calibratedSrtList = await UtilFT.fileSearchGlob(calibratedDir, '*.srt');
                const charCfg = fixedCfg[char];

                const plist:Promise<void>[] = [];
                let totalTime = 0;
                return pipe(
                    //根据srt构造slice数据
                    Promise.all(calibratedSrtList.map(async srtPath => {
                        const srt = await fs.promises.readFile(srtPath, 'utf-8');
                        const segments = UtilFunc.parseSrt(srt);
                        const basename = path.parse(srtPath).name;
                        const wavName = `${basename}.wav`;
                        const inPath = path.join(processedDir, wavName);
                        if(!(await UtilFT.pathExists(inPath)))
                            throw `音频文件 ${inPath} 不存在`;

                        return segments.map((seg,index)=>{
                            const audioName = getSplitWavName(inPath,index,SplitSep);

                            return {
                                inFilePath : inPath,
                                outFilePath: path.join(splitTmpDit,audioName),
                                stream:FfmpegStream.create(),
                                seg, audioName,
                            }
                        });
                    })),
                    //扁平化
                    stacklist => stacklist.flat(),
                    //删除静音 验证时长 删除不匹配项
                    slicedatas => Stream.from(slicedatas,8)
                        //创建srt表并裁剪音频
                        .map(async data=>{
                            const {seg,stream,audioName,outFilePath,inFilePath} = data;
                            const {start,end,text} = seg;

                            //格式化filelist
                            const langmap = parseSrtContent(text);
                            if(langmap.tag!=null){
                                if(langmap.tag.includes('invalid'))
                                    return undefined;
                            }
                            const filepath = path.join('data',char,audioName);
                            let formatLine = format
                                .replace(/{filepath}/g,filepath)
                                .replace(/{char_index}/g,`${charCfg.charIdx}`);

                            LangFlagExt.map(flag => {
                                const reg = new RegExp(`{${flag}}`,'g');
                                if(reg.test(formatLine))
                                    formatLine = formatLine.replace(reg,checkOrThrow(langmap[flag as LangFlagExt]));
                            });

                            //检查缓存
                            if(await UtilFT.pathExists(outFilePath) && !opt.force)
                                return { outFilePath, audioName, formatLine};

                            //剪切
                            stream.trim({start:start/1000,end:end/1000});
                            //修剪静音
                            stream.trimSilence({silence:0.05,threshold:-50});
                            //重采样
                            if(await FfmpegStream.isMono(data.inFilePath))
                                stream.resample({rate:sr});
                            else stream.resample({rate:sr,ac:1});

                            //应用
                            await stream.append(inFilePath,outFilePath);
                            return { outFilePath, audioName, formatLine};
                        })
                        //验证时长并移动文件  非全量并发移动可能造成随机输出
                        .concurrent(1)
                        .map(async data=>{
                            if( data == null ||
                                totalTime > charCfg.trainingset_duration
                            ) return undefined;
                            const {outFilePath,formatLine,audioName} = data;
                            const time = await getAudioDuratin(outFilePath);
                            if( time < charCfg.min_duration ||
                                time > charCfg.max_duration
                            ) return undefined;
                            totalTime+=time;

                            //复制到训练集
                            const cppath = path.join(tsetCharDir,audioName);
                            plist.push(fs.promises.cp(outFilePath,cppath));
                            return formatLine;
                        }).exclude(undefined).toArray(),
                    //转为 entries
                    async value => {
                        await Promise.all(plist);
                        return { key:char, value };
                    },
                )
            })),
            //将 entries 转为 char-filelist 表
            entries => entries.reduce((acc,entry)=>
                    ({...acc, [entry.key]:entry.value}),
                    {} as Record<string,string[]>),
            //依照顺序拼接为filelist
            charFilelistMap => Object.values(fixedCfg)
                .map( data => charFilelistMap[data.char].join('\n'))
                .join('\n'),
            filelist => fs.promises.writeFile(tsetFilelistPath,filelist.trim())
        );
    });
