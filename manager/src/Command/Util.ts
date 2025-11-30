import { match, PRecord, SrtSegment, UtilFT } from "@zwa73/utils";
import { getCharDir } from "../Define";
import { TrainingSetCharCfg, TrainingSetInfo } from "../Schema.schema";
import { FfmpegTool } from "@zwa73/audio-utils";
import { japanese_cleaners } from "../Bridge";
import path from "pathe";
import csvstringify from 'csv-stringify';

export const CSV = {
    stringify:(json:Record<string,number|string>[])=>new Promise<string>((resolve,reject)=>{
        csvstringify.stringify(json, {
          header: true,              // 输出表头
          columns: Object.keys(json[0]) // 用第一行的 key 作为列名
        },(err, output) => {
            if (err) reject(err);
            resolve(output);
        });
    }),
    //parse:(str:string)=>new Promise<string[][]>((resolve,reject)=>{
    //    csvparse.parse(str, (err, output) => {
    //        if (err) reject(err);
    //        resolve(output);
    //    });
    //}),
}

export type SliceData ={
    inFilePath:string;
    seg:SrtSegment;
    outDir:string;
    index:number;
};

export function getSplitWavName(filePath:string,idx:number,sep = '_Segment_'){
    const audioName = path.parse(filePath).name;
    return `${audioName}${sep}${idx+1}.wav`;
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

/**解析srt标签内容 无标记则会被解析为raw */
export const parseSrtText = (text:string)=>{
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

/**将对象化的srt标签内容转换为文本 */
export const formatSrtContent = (langMap:PRecord<LangFlagExt,string>)=>{
    return Object.entries(langMap)
        .reduce((acc,[flag,content])=>{
            return `${acc}\n#${flag}\n${content}`.trim();
        },'');
}

/**获取音频时长/秒 */
export const getAudioDuratin = async (filePath:string)=>{
    const metadata = await FfmpegTool.getAudioMetaData(filePath);
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
    trainingset_duration: Infinity,
    required_tag: [],
    excluded_tag: [],
    include_file: ['.*'],
    exclude_file: []
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


export const convertLang = async (flag:LangFlag,raw:string)=> await match(flag,{
        ['ja-phoneme'] :()=>japanese_cleaners(raw!)
    },
    flag => {throw `暂时不支持 ${flag}`});

export const parseStrlist = (str:string)=>str
    .split(/( |,)/)
    .map(s=>s.trim())
    .filter(s=>s.length>0)
    .filter(s=>s!=',')