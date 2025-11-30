import { Command } from 'commander';
import { UtilFT } from '@zwa73/utils';
import { DATA_PATH } from '../Define';
import { mapChars, parseStrlist } from './Util';
import { FfmpegFlow } from '@zwa73/audio-utils';

export const CmdTrimSilence = (program: Command) => program
    .command('Trim-Silence')
    .alias('trimsilence')
    .description('删除指定角色名的音频文件中的静音部分')
    .argument('<characters>', '以 空格 分隔的角色名', parseStrlist)
    .action(async (characters: string[]) => {
        const iomap:Record<string,string> = {};

        await mapChars({characters,func:async (character) => {
            const fileMap = await UtilFT.fileSearchGlob(
                DATA_PATH, `${character}/sliced_audio/*.wav`
            );

            for (const file in fileMap) {
                const filePath = fileMap[file];
                iomap[filePath] = filePath.replace('sliced_audio', 'remove_silence');
            }
        }});

        await FfmpegFlow
            .trimSilence()
            .parallel(iomap);
    });
