# SoulTide-AudioData-Manager
灵魂潮汐语音数据管理器

# 校准流程

## step 1
`ts-node src/Route Process-Resource <characters>`  
依照`dataset/character/[char]/resource/srt/*`对`dataset/character/[char]/resource/audio/*`进行处理  

## step 2
将`dataset/character/[char]/resource/processed/*`的音频  
交予whisper识别 参考 `auto-VITS-DataLabeling`  

## step 3
将whisper识别结果srt放入`dataset/character/[char]/recognized/*`待校对处理  

## step 4
将`dataset/character/[char]/recognized/*`复制至`dataset/character/[char]/calibrated/*`  
`ts-node src/Route Process-SrtLang <characters>`初始化校对srt格式  
运行`manager/start_python_server.ps1`开启音素转换服务  
`ts-node src/Route Process-SrtLang <characters> --flag ja-phoneme`转换raw为音素  

## step 5
启动`audio-dataset-studio.exe`  
依照`dataset/note.txt` 阈值-60 取整0.001 精度1024 缩放1.5 行高140 进行配置  
将`dataset/character/[char]/resource/processed/*`拖入应用窗口  
将`dataset/character/[char]/calibrated/*`拖入应用窗口  
人工校准 并以`c <character>`标题暂存  

## step 6
`ts-node .\src\Route.ts Extract-Srt <character> "他" "../tmp/fxdot"` 提取包含中文`他`的srt与wav进行二次筛查读音  
部分 他 ta↓ 应转为 ほか ho↑ka  
完成筛查后将srt移至`dataset/character/[char]/calibrated/*`  
以`fx他 <character>`标题暂存

## step 7
`ts-node .\src\Route.ts Extract-Srt <character> "\.\.\.$" "../tmp/fxdot"` 提取包含`...`的srt与wav进行二次筛查是否留有余量  
完成筛查后将srt移至`dataset/character/[char]/calibrated/*`  
以`fxdot <character>`标题暂存  

## step 8
`ts-node src/Route Process-SrtLang <characters> --flag ja-phoneme --remove`删除音素  
`ts-node src/Route Process-SrtLang <characters> --flag ja-phoneme`重新转换音素  
检视音素状态, 确保在校准阶段时手动添加的srt分段正确
以`rec <character>`标题暂存  
