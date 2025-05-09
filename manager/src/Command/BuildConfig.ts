import { Command } from 'commander';
import fs from 'fs';
import { UtilFT } from '@zwa73/utils';
import { DATA_PATH } from '../Define';

export const CmdBuildConfig = (program: Command) => program
    .command("Build-Config")
    .alias("buildconfig")
    .description("构造hugface的cofig")
    .action(async()=>{
        const chars = await fs.promises.readdir(DATA_PATH);
        const result = (await Promise.all(chars.map(async char => {
            if(char[0]==='@') return;
            if(['template','tmp'].includes(char)) return;
            return`
- config_name: ${char}
  data_files:
  - split: audio
    path:
    - "character/${char}/resource/audio/*.flac"
    - "character/${char}/resource/metadata.csv"`;
        }))).join('');
        console.info(`configs:${result}`);
});