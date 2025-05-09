from modelscope.hub.snapshot_download import snapshot_download
path = snapshot_download('damo/speech_paraformer-large_asr_nat-zh-cn-16k-common-vocab8404-pytorch')
print(path)