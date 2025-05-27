


export type TrainingSetCharCfg = {
    /**角色名 */
    char:string;
    /**训练集时长/秒 默认无限 */
    trainingset_duration?:number;
    /**单条语音的最小持续时间/秒 默认 1 秒 */
    min_duration?:number;
    /**单条语音的最大持续时间/秒 默认无限 */
    max_duration?:number;
    /**要求的tag 与关系 默认无 */
    required_tag?:string[];
    /**排除的tag 或关系 默认无 */
    excluded_tag?:string[];
    /**包含的文件名regex匹配 或关系 不含扩展名 默认 .* */
    include_file?:string[];
    /**排除的文件名regex匹配 或关系 不含扩展名 默认无 */
    exclude_file?:string[];
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