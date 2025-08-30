import { Command } from "commander";
import { CmdProcessResource } from "./ProcessResource";
import { CmdCheckResource } from "./CheckResource";
import { CmdCheckTrainingSet } from "./CheckTrainingSet";
import { CmdProcessSrtLang } from "./ProcessSrtLang";
import { CmdSplitAudio } from "./SplitAudio";
import { CmdFilelistSrt } from "./FilelistSrt";
import { CmdBuildTrainingSet } from "./BuildTrainingSet";
import { CmdClearCache } from "./ClearCache";
import { CmdExtractValset } from "./ExtractValset";
import { CmdCalculateVITSLoss } from "./CalculateCompositeLoss";
import { CmdConvertWavToFlac } from "./ConvertWavToFlac";
import { CmdBuildConfig } from "./BuildConfig";
import { CmdBuildMetadata } from "./BuildMetadata";
import { CmdConvertLang } from "./ConvertLang";
import { CmdTrimSilence } from "./TrimSilence";
import { CmdExtractSrt } from "./ExtractSrt";
import { CmdCheckCalibrated } from "./CheckCalibrated";

export async function cmdRoute(program:Command) {
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
    CmdConvertLang(program);
    CmdExtractSrt(program);
    CmdCheckCalibrated(program);
}