import path from "pathe";

export const ROOT_PATH = process.cwd();
export const DATA_PATH = path.join(ROOT_PATH, 'data');
export const BUILD_PATH = path.join(ROOT_PATH, 'build');

/**获取角色目录 */
export const getCharDir = (character:string)=>path.join(DATA_PATH,character);

/**获取资源目录 */
export const getResDir = (character:string)=>path.join(getCharDir(character),'resource');
/**获取完成处理的资源的目录 */
export const getResProcessedDir = (character:string)=>path.join(getResDir(character),'processed');
/**获取资源原始音频目录 */
export const getResAudioDir = (character:string)=>path.join(getResDir(character),'audio');
/**获取资源srt文件的目录 */
export const getResSrtDir = (character:string)=>path.join(getResDir(character),'srt');

/**获取校准完成的srt的目录 */
export const getCalibratedDir = (character:string)=>path.join(getCharDir(character),'calibrated');
/**获取完成识别的srt的目录 */
export const getRecognizedDir = (character:string)=>path.join(getCharDir(character),'recognized');

/**获取临时文件目录 */
export const getTmpDir = (character:string)=>path.join(getCharDir(character),'tmp');
/**获取完成类型转换的文件目录 */
export const getTmpConvertedDir = (character:string)=>path.join(getTmpDir(character),'converted');
/**获取完成重采样的文件目录 */
export const getTmpResampledDir = (character:string,sr:number)=>path.join(getTmpDir(character),'resampled',`${sr}`);
/**获取完成剪切的文件目录 */
export const getTmpSplitDir = (character:string)=>path.join(getTmpDir(character),'splited');
/**获取完成剪除静音的文件目录 */
export const getTmpTrimSilenceDir = (character:string)=>path.join(getTmpDir(character),'silence_trimmed');

/**获取训练集目录 */
export const getTsetDir = (tset:string)=>path.join(BUILD_PATH,tset);
/**获取训练集info路径 */
export const getTsetInfoPath = (tset:string)=>path.join(getTsetDir(tset),'info.json');
/**获取训练集filelist路径 */
export const getTsetFilelistPath = (tset:string)=>path.join(getTsetDir(tset),'filelist.txt');
/**获取训练集数据目录 */
export const getTsetDataDir = (tset:string)=>path.join(getTsetDir(tset),'data');
/**获取训练集角色目录 */
export const getTsetCharDir = (tset:string,character:string)=>path.join(getTsetDataDir(tset),character);