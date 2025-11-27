搭配此训练集获取具体数据:  
https://huggingface.co/datasets/zwa73/SoulTide-AudioData-Dataset


## step 1 拉取项目并置入训练集
`git clone https://github.com/Sosarciel/SoulTide-AudioData-Manager.git --depth=1`  

`cd SoulTide-AudioData-Manager` 进入项目目录  

确保将dataset(huggingface训练集仓库)置于`SoulTide-AudioData-Manager/dataset`位置 或是拉取数据集 `git clone https://huggingface.co/datasets/zwa73/SoulTide-AudioData-Dataset dataset --depth=1`  

`cd manager` 进入管理器目录  

结果目录结构 例 `SoulTide-AudioData-Manager/dataset/character/[char]/resource/`  



## step 2 预处理数据
`ts-node src/Route Process-Resource <characters>`  

`<characters>` 为逗号分割的数组 例 `ts-node src/Route Process-Resource Akaset,Aurora`  

指令效果: 根据输入的 `<characters>` 参数所对应的一或多个[char] 依照 `character/[char]/resource/srt/*.srt` 对 `character/[char]/resource/audio/*.flac` 切分并转为wav 输出至 `character/[char]/resource/processed/*.wav`  



## step 3 构建所需训练集
`ts-node src/Route Build-TrainingSet <trainingSetName>`  

指令效果: 根据输入的 `<trainingSetName>` 使用 `SoulTide-AudioData-Manager/build/<trainingSetName>/info.json` 构建训练集, 输出至 `SoulTide-AudioData-Manager/build/<trainingSetName>/`  

info文件格式参考 `SoulTide-AudioData-Manager/build/template/info.json` 与 `SoulTide-AudioData-Manager/manager/src/Schema.schema.ts` 或 `SoulTide-AudioData-Manager/manager/schema/TrainingSetInfo.schema.json` 例
```json
{
    "sample_rate": 22050,
    "characters": [
        "Dora",
        {"char": "Haliva","trainingset_duration": 100},
        {"char": "Kokkoro","trainingset_duration": 300}
    ],
    "filelist_format": "{filepath}|{char_index}|{raw}"
}
 ```
