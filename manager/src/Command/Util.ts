import { PRecord, SrtSegment, Stream, UtilFT } from "@zwa73/utils";
import path from 'pathe';
import { getCharDir } from "../Define";
import { TrainingSetCharCfg, TrainingSetInfo } from "../Schema.schema";
import { SFfmpegTool } from "@zwa73/audio-utils";


export type SliceData ={
    inFilePath:string;
    seg:SrtSegment;
    outDir:string;
    index:number;
};
/**根据数据切分音频 多线程 */
export async function splitWavByDataMP (sliceDatas:SliceData[],sep = '_Segment_'){
    //执行音频切分
    return await Stream.from(sliceDatas,16)
        .map(async (dat)=>{
            return await splitWavByData(dat,sep);
        }).toArray();
}
/**根据数据切分音频 */
export async function splitWavByData(sliceData:SliceData,sep = '_Segment_'){
    const {index,outDir,seg} = sliceData;
    const inFilePath = sliceData.inFilePath;
    const {start,end} = seg;
    const wavname = getSplitWavName(sliceData,sep);
    const outPath = path.join(outDir,wavname);
    await SFfmpegTool.cutAudio(inFilePath,outPath, start/1000, (end-start)/1000);
    return outPath;
}
export function getSplitWavName(sliceData:SliceData,sep = '_Segment_'){
    const {index,seg} = sliceData;
    const audioIndex = index+1;
    const audioName = path.parse(sliceData.inFilePath).name;
    return `${audioName}${sep}${audioIndex}.wav`;
}

export type MapCharCB<T> = (
    /**角色名*/
    character:string
)=>T;

/**并发的map角色
 * @param characters 角色列表
 * @param cb 处理函数
 */
export async function mapChars<T>(characters:string[],cb:MapCharCB<T>){
    return await Promise.all(characters.map(async (character) => {
        const charPath = getCharDir(character);
        if(!(await UtilFT.pathExists(charPath)))
            throw `角色 ${character} 不存在`;
        return await cb(character);
    }));
}
/**同步each角色 */
export async function eachChars<T>(characters:string[],cb:MapCharCB<T>){
    for(const character of characters){
        const charPath = getCharDir(character);
        if(!(await UtilFT.pathExists(charPath)))
            throw `角色 ${character} 不存在`;
        await cb(character);
    }
}

export const LangFlag = ["ja","en","zh-CN","ja-phoneme"] as const;
export type LangFlag = typeof LangFlag[number];

export const LangFlagExt = [...LangFlag,'raw','tag'] as const;
export type LangFlagExt = typeof LangFlagExt[number];

export const parseSrtContent = (text:string)=>{
    const langMap:Record<string,string> = {};

    let flag = 'raw';
    text.split('\n')
        .forEach((line)=>{
            if(line.startsWith('#')){
                flag = line.match(/#(.+)/)![1]
                return;
            }
            langMap[flag]??='';
            langMap[flag] += `\n${line}`.trim();
        });
    return langMap as PRecord<LangFlagExt,string>;
}

export const formatSrtContent = (langMap:PRecord<LangFlagExt,string>)=>{
    return Object.entries(langMap)
        .reduce((acc,[flag,content])=>{
            return `${acc}\n#${flag}\n${content}`.trim();
        },'');
}

/**获取音频时长/秒 */
export const getAudioDuratin = async (filePath:string)=>{
    const metadata = await SFfmpegTool.getAudioMetaData(filePath);
    const stream = metadata?.streams[0];
    if(stream==null) throw `音频文件 ${filePath} 无法获取流`;
    const dur = stream.duration;
    if(dur==null) throw `音频文件 ${filePath} 无法获取时长`;
    return parseFloat(dur);
}


type FixedCfg = Required<TrainingSetCharCfg>&{
    charIdx:number;
}
const defCfg:Required<TrainingSetCharCfg> = {
    char: '',
    max_duration: Infinity,
    min_duration: 1,
    trainingset_duration: Infinity
}
export const fixedCharCfg = (info:TrainingSetInfo)=>{
    return info.characters
        .map((cfg,i)=>{
            if(typeof cfg === 'string')
                return Object.assign({},defCfg,{char:cfg,charIdx:i});
            return Object.assign({},defCfg,cfg,{charIdx:i});
        }).reduce((acc,cfg)=>({
            ...acc,
            [cfg.char]:cfg
        }),{} as Record<string,FixedCfg>);
}