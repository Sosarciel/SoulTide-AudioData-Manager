import { Command } from 'commander';
import { match, SrtSegment, UtilFT, UtilFunc } from '@zwa73/utils';
import { getCalibratedDir } from '../Define';
import { formatSrtContent, LangFlag, LangFlagExt, mapChars, parseSrtContent } from './Util';
import { japanese_cleaners } from '../Bridge';
import fs from 'fs';


const checkAndParse = (seg:SrtSegment)=>{
    const langmap = parseSrtContent(seg.text);
    if(langmap.raw==null)
        throw `srtseg ${seg} 缺失基础文本`;
    return langmap;
}

const initSeg = (seg:SrtSegment)=>{
    const langmap = checkAndParse(seg);

    const parsed = {
        raw:langmap.raw,
        tag:langmap.tag
    }

    const nseg:SrtSegment = {
        ...seg,
        text: formatSrtContent(parsed)
    }
    return nseg;
}

const addLang = async (seg:SrtSegment,flag:LangFlagExt)=>{
    const langmap = checkAndParse(seg);
    if(langmap[flag]!=null)
        throw `srtseg ${seg} 已经存在 ${flag}`;

    return await match(flag as LangFlag,{
        en             :()=>{ throw `暂时不支持英文`; },
        ['zh-CN']      :()=>{ throw `暂时不支持中文`; },
        ja             :()=>{ throw `暂时不支持日语`; },
        ['ja-phoneme'] :async flg =>{
            //console.log(`正在转换 ${text}`);
            const res = await japanese_cleaners(langmap.raw!);
            //console.log(`转换结果 ${res}`);
            const nseg:SrtSegment = {
                ...seg,
                text: formatSrtContent({
                    ...langmap,
                    [flg]:res
                })
            }
            return nseg;
        }
    });
}

const removeLang = async (seg:SrtSegment,flag:LangFlagExt)=>{
    const langmap = checkAndParse(seg);
    if(flag=='none' as LangFlag || flag=='tag' as LangFlag || flag=='raw' as LangFlag)
        throw `无法移除 ${flag}`;
    delete langmap[flag];
    return {
        ...seg,
        text: formatSrtContent(langmap)
    }
}

export const CmdProcessSrtLang = (program: Command) => program
    .command('Process-SrtLang')
    .alias('processsrtlang')
    .description('给srt文件添加语言')
    .argument('<characters>', '以 空格 分隔的角色名', (str) => str.split(' '))
    .option(`-f, --flag <${LangFlag.join('|')}>`, '语言标记, 尝试进行转换, 不填或raw则会进行初始化','raw')
    .option(`-r, --remove`, '移除语言标记, 会保留raw和tag',false)
    .action(async (characters: string[],opt:{flag:LangFlag|'raw', remove:boolean}) => {

        if(opt.flag!='raw' && !LangFlag.includes(opt.flag as LangFlag))
            throw `语言标记${opt.flag}不存在`;

        const opera = opt.flag=='raw' ? '初始化'
            : opt.remove ? '移除' : '添加';

        console.log(`正在 ${opera} 语言标记 ${opt.flag}`);

        await mapChars(characters,async character => {
            const calibratedDir = getCalibratedDir(character);
            const srtList = await UtilFT.fileSearchGlob(
                calibratedDir, `*.srt`
            );
            await Promise.all(srtList.map(async srtPath => {
                const srtText = await fs.promises.readFile(srtPath, 'utf-8');
                const segs = UtilFunc.parseSrt(srtText);
                const newsegs = await Promise.all(segs.map(async seg =>
                    await match(opera,{
                        初始化 : () => initSeg(seg),
                        添加   : () => addLang(seg,opt.flag),
                        移除   : () => removeLang(seg,opt.flag),
                    })
                ));
                const newSrt = UtilFunc.createSrt(newsegs);
                await fs.promises.writeFile(srtPath,newSrt.replace(/\r\n/g,'\n'), 'utf-8');
            }));
        });
    });
