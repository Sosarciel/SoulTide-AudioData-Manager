import { Command } from 'commander';
import path from 'path';
import { memoize, Stream, UtilFT } from "@zwa73/utils"; // 假设你的工具库中提供 FLAC 转换功能
import { FfmpegStream } from "@zwa73/audio-utils";

export const CmdConvertWavToFlac = (program: Command) => program
    .command("Convert-Wav-To-Flac")
    .alias("convertwavtoflac")
    .description("将输入目录中的 WAV 文件转换为 FLAC 格式，并保存到输出目录")
    .argument('<inputDir>', '输入目录')
    .argument('<outputDir>', '输出目录')
    .action(async (inputDir: string , outputDir: string) => {

        // 检查输入输出目录是否存在
        if (! await UtilFT.pathExists(inputDir))
            throw new Error(`输入目录不存在: ${inputDir}`);

        await UtilFT.ensurePathExists(outputDir,{dir:true});

        // 查找 WAV 文件
        const wavFiles = await UtilFT.fileSearchGlob(inputDir, '**/*.wav');

        if (wavFiles.length === 0) {
            console.log(`输入目录中没有找到 WAV 文件: ${inputDir}`);
            return;
        }

        console.log(`开始处理 ${wavFiles.length} 个文件...`);

        const ensurePathExists = memoize(UtilFT.ensurePathExists)
        // 转换 WAV 文件到 FLAC
        Stream.from(wavFiles, 16)
            .map(async file=>{
                // 将绝对路径转换为相对于输入目录的相对路径
                const relativePath = path.relative(inputDir, file);
                // 构造相对于输出目录的绝对路径
                const outputPath = path.join(outputDir, relativePath.replace('.wav', '.flac'));
                await ensurePathExists(path.dirname(outputPath), { dir: true });
                try {
                    console.log(`正在转换: ${file} -> ${outputPath}`);

                    // 调用 wav2flac 方法进行转换
                    await FfmpegStream.create().flac().apply(file, outputPath);

                    console.log(`完成转换: ${outputPath}`);
                } catch (err) {
                    console.error(`转换失败: ${file}`, err);
                }
            }).apply();

        console.log('所有文件转换完成！');
    });
