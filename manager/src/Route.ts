import { program } from "commander";
import { CmdTrimSilence } from "./Command";
import { CmdProcessResource } from "./Command/ProcessResource";
import { CmdCheckResource } from "./Command/CheckResource";
import { CmdCheckTrainingSet } from "./Command/CheckTrainingSet";
import { CmdProcessSrtLang } from "./Command/ProcessSrtLang";
import { CmdSplitAudio } from "./Command/SplitAudio";
import { CmdFilelistSrt } from "./Command/FilelistSrt";
import { CmdBuildTrainingSet } from "./Command/BuildTrainingSet";
import { CmdClearCache } from "./Command/ClearCache";
import { CmdExtractValset } from "./Command/ExtractValset";
import { CmdCalculateVITSLoss } from "./Command/CalculateCompositeLoss";
import { CmdConvertWavToFlac } from "./Command/ConvertWavToFlac";
import { CmdBuildConfig } from "./Command/BuildConfig";
import { CmdBuildMetadata } from "./Command/BuildMetadata";

export async function cliRoute() {
    CmdTrimSilence(program);
    CmdProcessResource(program);
    CmdCheckResource(program);
    CmdCheckTrainingSet(program);
    CmdProcessSrtLang(program);
    CmdSplitAudio(program);
    CmdFilelistSrt(program);
    CmdBuildTrainingSet(program);
    CmdClearCache(program);
    CmdExtractValset(program);
    CmdCalculateVITSLoss(program);
    CmdConvertWavToFlac(program);
    CmdBuildConfig(program);
    CmdBuildMetadata(program);
    program.parse(process.argv);
}
cliRoute();