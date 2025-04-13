import { ivk, matchProc, SFfmpegTool, SrtSegment, Stream, UtilFT, UtilFunc } from "@zwa73/utils";
import path from 'pathe';
import { Command } from 'commander';
import { mapChars, SliceData, splitWavByDataMP } from "./Util";
import { DATA_PATH, getResAudioDir, getResDir, getResProcessedDir, getTmpConvertedDir, getTmpDir } from "../Define";
import fs from 'fs';




const VaildExt = ['.wav','.flac'] as const;
type VaildExt = typeof VaildExt[number];

export const CmdSplitAudio = (program: Command) => program
    .command("Split-Audio")
    .alias("splitaudio")
    .description("根据srt对wav进行切分")
    .argument('<wavPath>', '输入的wav路径')
    .argument('<srtPath>', '输入的srt路径')
    .action(async (wavPath:string,srtPath:string) => {

        const sliceDatas:SliceData[]= [];

        const text = await fs.promises.readFile(srtPath,'utf-8');
        const srtseg = UtilFunc.parseSrt(text);
        const baseAudioPath = wavPath;

        const outDir = path.parse(wavPath).dir;
        sliceDatas.push(...srtseg.map((seg,index)=>({
            seg,index,inFilePath:baseAudioPath,outDir
        })));

        //执行音频切分
        await splitWavByDataMP(sliceDatas);
    })