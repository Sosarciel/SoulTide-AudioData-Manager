import { Stream, UtilFT, UtilFunc } from "@zwa73/utils";
import { Command } from "commander";
import path from 'pathe';
import { getCalibratedDir, getResProcessedDir, getTmpResampledDir, getTmpSplitDir, getTmpTrimSilenceDir, getTsetCharDir, getTsetDataDir, getTsetFilelistPath, getTsetInfoPath } from "../Define";
import { TrainingSetInfo } from "../Schema.schema";
import fs from 'fs';
import { SliceData, parseSrtContent, getSplitWavName, splitWavByData, getAudioDuratin, fixedCharCfg } from "./Util";
import { SFfmpegTool } from "@zwa73/audio-utils";


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

        const fileListCharMap:Record<string,string[]> = {};
        const charlist = Object.keys(fixedCfg);
        for(const char of charlist){
            const splitTmpDit = getTmpSplitDir(char);
            const trimTmpDir = getTmpTrimSilenceDir(char);
            const tsetCharDir = getTsetCharDir(trainingSetName,char);
            const tmpResampledDir = getTmpResampledDir(char,sr);
            await UtilFT.ensurePathExists(tmpResampledDir,{dir:true});
            await UtilFT.ensurePathExists(splitTmpDit,{dir:true});
            await UtilFT.ensurePathExists(trimTmpDir,{dir:true});
            await UtilFT.ensurePathExists(tsetCharDir,{dir:true});
            const processedDir = getResProcessedDir(char);
            const calibratedDir = getCalibratedDir(char);
            const calibratedSrtList = await UtilFT.fileSearchGlob(calibratedDir, '*.srt');
            const charCfg = fixedCfg[char];

            //剪切
            const datas:SliceData[] = [];
            await Promise.all(calibratedSrtList.map(async (srtPath) => {
                const srt = await fs.promises.readFile(srtPath, 'utf-8');
                const segments = UtilFunc.parseSrt(srt);
                const basename = path.parse(srtPath).name;
                const wavName = `${basename}.wav`;
                const inPath = path.join(processedDir, wavName);
                if(!(await UtilFT.pathExists(inPath)))
                    throw `音频文件 ${inPath} 不存在`;

                datas.push(...segments.map((seg,index)=>
                    ({inFilePath:inPath,seg,outDir: splitTmpDit,index})
                ));
            }));

            //删除静音 验证时长 删除不匹配项
            let totalTime = 0;
            fileListCharMap[char] = (await Stream.from(datas,16)
            //创建srt表并裁剪音频
            .map(async (data)=>{
                const langmap = parseSrtContent(data.seg.text);
                if(langmap.tag!=null){
                    if(langmap.tag.includes('invalid'))
                        return undefined;
                }
                const outpath = path.join(data.outDir,getSplitWavName(data,SplitSep));
                const wavName = getSplitWavName(data,SplitSep);
                const filepath = path.join('data',char,wavName)
                const nfmt = format
                    .replace(/{filepath}/g,filepath)
                    .replace(/{char_index}/g,`${charCfg.charIdx}`)
                    .replace(/{raw}/g,checkOrThrow(langmap.raw));
                if(!opt.force && await UtilFT.pathExists(outpath))
                    return { inpath:outpath, nfmt};
                await splitWavByData(data,SplitSep);
                return { inpath:outpath, nfmt};
            })
            //修剪静音
            .map(async (dat)=>{
                if(dat==null) return undefined;
                const {inpath,nfmt} = dat;
                const outpath = path.join(trimTmpDir,path.parse(inpath).base);
                if(!opt.force && await UtilFT.pathExists(outpath))
                    return {outpath,nfmt};
                await SFfmpegTool.trimSilence(inpath,outpath,-50,0.1);
                return {outpath,nfmt};
            })
            //重采样
            .map(async (dat)=>{
                if(dat==null) return undefined;
                const outpath = path.join(tmpResampledDir,path.parse(dat.outpath).base);
                await SFfmpegTool.resample(dat.outpath,outpath,sr);
                return {outpath,nfmt:dat.nfmt};
            })
            //验证时长并移动文件  非全量并发移动可能造成随机输出
            .map(async(dat)=>{
                if(dat==null) return undefined;
                const {outpath,nfmt} = dat;
                if(totalTime > charCfg.trainingset_duration) return undefined;
                const time = await getAudioDuratin(outpath);
                if(totalTime > charCfg.trainingset_duration) return undefined;
                if(time<charCfg.min_duration) return undefined;
                if(time>charCfg.max_duration) return undefined;
                if(totalTime>charCfg.trainingset_duration) return undefined;
                totalTime+=time;
                const cppath = path.join(tsetCharDir,path.parse(outpath).base);
                await fs.promises.cp(outpath,cppath);
                return nfmt;
            })
            .toArray()).filter(s=>s!=undefined);
        };

        let outfilelist = '';
        Object.values(fixedCfg).forEach((d,i)=>{
            const list = fileListCharMap[d.char].join('\n');
            outfilelist += `${list}\n`;
        });
        await fs.promises.writeFile(tsetFilelistPath,outfilelist.trim());
    });
