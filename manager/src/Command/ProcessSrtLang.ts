import { Command } from 'commander';
import { match, PRecord, SrtSegment, UtilFT, UtilFunc } from '@zwa73/utils';
import { getCalibratedDir } from '../Define';
import { formatSrtContent, LangFlag, LangFlagExt, mapChars, parseSrtContent } from './Util';
import { japanese_cleaners } from '../Bridge';
import fs from 'fs';



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

        await mapChars(characters,async (character) => {
            const calibratedDir = getCalibratedDir(character);
            const srtList = await UtilFT.fileSearchGlob(
                calibratedDir, `*.srt`
            );
            await Promise.all(srtList.map(async (srtPath) => {
                const srtText = await fs.promises.readFile(srtPath, 'utf-8');
                const segs = UtilFunc.parseSrt(srtText);
                const newsegs = await Promise.all(segs.map(async (seg) => {
                    const langmap = parseSrtContent(seg.text);
                    //初始化
                    const basetext = langmap['raw'];
                    const tagtext = langmap['tag'];
                    if(opt.flag=='raw'){
                        if(basetext!=null){
                            let parsed:PRecord<LangFlagExt,string> = {
                                raw:basetext,
                            }
                            if(tagtext!=null) parsed = {
                                tag:tagtext,
                                ...parsed
                            };
                            const nseg:SrtSegment = {
                                ...seg,
                                text: formatSrtContent(parsed)
                            }
                            return nseg;
                        }
                        return seg;
                    }
                    const raw = langmap.raw;
                    if(raw==null) throw `srt文件 ${srtPath} 未初始化`;
                    //添加
                    if(!opt.remove && langmap[opt.flag]==null){
                        return await match(opt.flag as LangFlag,{
                            en             :()=>{ throw `暂时不支持英文`; },
                            ['zh-CN']      :()=>{ throw `暂时不支持中文`; },
                            ja             :()=>{ throw `暂时不支持日语`; },
                            ['ja-phoneme'] :async (flg)=>{
                                //console.log(`正在转换 ${text}`);
                                const res = await japanese_cleaners(raw);
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
                    if(opt.remove){
                        if(opt.flag=='none' as LangFlag || opt.flag=='tag' as LangFlag)
                            throw `无法移除 ${opt.flag}`;
                        delete langmap[opt.flag];
                        return {
                            ...seg,
                            text: formatSrtContent(langmap)
                        }
                    }
                    return seg;
                }));
                const newSrt = UtilFunc.createSrt(newsegs);
                await fs.promises.writeFile(srtPath,newSrt.replace(/\r\n/g,'\n'), 'utf-8');
            }));
        });
    });
