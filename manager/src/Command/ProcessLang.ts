import { Command } from 'commander';
import { convertLang, LangFlag } from './Util';


export const CmdConvertLang = (program: Command) => program
    .command('Convert-Lang')
    .alias('convertlang')
    .description('转换语言')
    .argument('<text>', '待处理的文本')
    .requiredOption(`-f, --flag <${LangFlag.join('|')}>`, '语言标记, 尝试进行转换, 不填或raw则会进行初始化')
    .action(async (text: string,opt:{flag:LangFlag|'raw'}) => {
        if(!LangFlag.includes(opt.flag as LangFlag))
            throw `语言标记${opt.flag}不存在`;

        console.log(await convertLang(opt.flag as LangFlag, text));
    });
