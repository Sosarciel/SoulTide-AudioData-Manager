import { Stream, UtilFunc } from "@zwa73/utils";
import path from 'pathe';
import { Command } from 'commander';
import { getSplitWavName, SliceData } from "./Util";
import fs from 'fs';
import { FfmpegStream } from "@zwa73/audio-utils";





const VaildExt = ['.wav','.flac'] as const;
type VaildExt = typeof VaildExt[number];

export const CmdSplitAudio = (program: Command) => program
    .command("Split-Audio")
    .alias("splitaudio")
    .description("根据srt对wav进行切分")
    .argument('<wavPath>', '输入的wav路径')
    .argument('<srtPath>', '输入的srt路径')
    .action(async (wavPath:string,srtPath:string) => {

        const text = await fs.promises.readFile(srtPath,'utf-8');
        const srtseg = UtilFunc.parseSrt(text);


        const outDir = path.parse(wavPath).dir;
        await Stream.from(srtseg.map((seg,index)=>{
            const {start,end} = seg;
            const outPath = path.join(outDir,getSplitWavName(srtPath,index))
            return ()=>FfmpegStream.create().trim({start:start/1000,end:end/1000}).append(wavPath,outPath);
        }))
        .map(async fn=>fn())
        .append();
    })