


export type TrainingSetCharCfg = {
    /**角色名 */
    char:string;
    /**训练集时长/秒 默认无限 */
    trainingset_duration?:number;
    /**单条语音的最小持续时间/秒 默认 1 秒 */
    min_duration?:number;
    /**单条语音的最大持续时间/秒 默认无限 */
    max_duration?:number;
}
export type TrainingSetInfo = {
    /**角色配置 */
    characters: (string|TrainingSetCharCfg)[];
    /**filelist格式  
     * {filepath}   : 音频路径
     * {char_index} : 角色编号
     * {langflag}   : srt对应内容
     */
    filelist_format:string
    /**采样率 */
    sample_rate:number;
}