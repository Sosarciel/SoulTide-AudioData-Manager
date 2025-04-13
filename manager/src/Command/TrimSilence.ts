import { Command } from 'commander';
import { SFfmpegTool, UtilFT } from '@zwa73/utils';
import { DATA_PATH } from '../Define';
import path from 'pathe';
import { mapChars } from './Util';

export const CmdTrimSilence = (program: Command) => program
    .command('Trim-Silence')
    .alias('trimsilence')
    .description('删除指定角色名的音频文件中的静音部分')
    .argument('<characters>', '以 空格 分隔的角色名', (str) => str.split(' '))
    .action(async (characters: string[]) => {
        const iomap:Record<string,string> = {};

        await mapChars(characters, async (character) => {
            const fileMap = await UtilFT.fileSearchGlob(
                DATA_PATH, `${character}/sliced_audio/*.wav`
            );

            for (const file in fileMap) {
                const filePath = fileMap[file];
                iomap[filePath] = filePath.replace('sliced_audio', 'remove_silence');
            }
        });

        await SFfmpegTool.trimSilenceMP(iomap);
    });
