import whisper
import os
import argparse
import torch
from pathlib import Path
import json

def transcribe_one(file_name, model, upload_path, language, compression_ratio_threshold, logprob_threshold, no_speech_threshold, condition_on_previous_text):
    result = model.transcribe(
        audio = f'{upload_path+file_name}',
        language = language,
        compression_ratio_threshold = compression_ratio_threshold,
        logprob_threshold = logprob_threshold,
        no_speech_threshold = no_speech_threshold,
        condition_on_previous_text = condition_on_previous_text
    )
    return result

def save_srt(result, output_path):
    with open(output_path, 'w', encoding='utf-8') as f:
        for segment in result['segments']:
            start = segment['start']
            end = segment['end']
            text = segment['text']
            f.write(f"{start:.3f} --> {end:.3f}\n{text}\n\n")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--whisper_size", default="large-v2")
    parser.add_argument("--input_dir", default="./raw_audio")
    parser.add_argument("--output_dir", default="./srt")
    parser.add_argument("--language", default="ja")
    parser.add_argument("--compression_ratio_threshold", type=float, default=2.4)
    parser.add_argument("--logprob_threshold", type=float, default=0.6)
    parser.add_argument("--no_speech_threshold", type=float, default=-1.0)
    parser.add_argument("--condition_on_previous_text", type=bool, default=True)
    args = parser.parse_args()

    assert (torch.cuda.is_available()), "Please enable GPU in order to run Whisper!"
    model = whisper.load_model(args.whisper_size)
    parent_dir = args.input_dir
    output_dir = args.output_dir
    os.makedirs(output_dir, exist_ok=True)

    processed_files = 0

    filelist = list(os.walk(parent_dir))[0][2]

    speaker_annos = []
    for file in filelist:
        character_name = file.rstrip(".wav").split("_")[0]
        srt_path = os.path.join(output_dir, f"{character_name}.srt")
        total_files = sum([len(files) for r, d, files in os.walk(parent_dir)])
        
        if file[-3:] != 'wav':
            print(f"{file} not supported, ignoring...\n")
            continue
        
        result = transcribe_one(
            file_name = file,
            model = model,
            upload_path = parent_dir,
            language = args.language,
            compression_ratio_threshold = args.compression_ratio_threshold,
            logprob_threshold = args.logprob_threshold,
            no_speech_threshold = args.no_speech_threshold,
            condition_on_previous_text = args.condition_on_previous_text
        )
        
        lang = max(result["language"], key=result["language"].get)
        
        if lang not in lang2token:
            print(f"{lang} not supported, ignoring...\n")
            continue

        save_srt(result, srt_path)

        processed_files += 1
        print(f"Processed: {processed_files}/{total_files}")

    print('All tasks completed')
