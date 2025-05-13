import { Command } from 'commander';
import { match, SrtSegment, UtilFT, UtilFunc } from '@zwa73/utils';
import { getCalibratedDir } from '../Define';
import { convertLang, formatSrtContent, LangFlag, LangFlagExt, mapChars, parseSrtContent } from './Util';
import fs from 'fs';


const checkAndParse = (seg:SrtSegment)=>{
    const langmap = parseSrtContent(seg.text);
    if(langmap.raw==null)
        throw `srtseg ${seg} 缺失基础文本`;
    return langmap;
}

/**初始化seg */
const initSeg = (seg:SrtSegment)=>{
    const langmap = checkAndParse(seg);

    const nseg:SrtSegment = {
        ...seg,
        text: formatSrtContent(langmap)
    }
    return nseg;
}

/**为seg添加语言 */
const addLang = async (seg:SrtSegment,flag:LangFlagExt)=>{
    if(flag=='tag' || flag=='raw')
        throw `无法添加 ${flag}`;

    const langmap = checkAndParse(seg);
    if(langmap[flag]!=null){
        console.log(`srtseg 已经存在 ${flag} 已跳过`);
        return seg;
    }

    return {
        ...seg,
        text: formatSrtContent({
            ...langmap,
            [flag]:await convertLang(flag,langmap.raw!)
        })
    };
}

/**为seg删除语言 */
const removeLang = async (seg:SrtSegment,flag:LangFlagExt)=>{
    const langmap = checkAndParse(seg);
    if(flag=='none' as LangFlag || flag=='tag' || flag=='raw')
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
