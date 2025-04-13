#@title 精简模型
import torch
import re
import os

#@markdown 模型名，数字是最新的模型steps
#new_model_name = "G_132800.pth"  # @param {type:"string"}

in_folder = "./in"
out_folder = "./out"

match_files = []
filenames = os.listdir(in_folder)
regex = "\.pth"
for filename in filenames:
  if re.search(regex, filename):
    match_files.append(filename)

for filename in match_files:
  new_model_name = os.path.join(in_folder, filename)
  out_model_name = os.path.join(out_folder, "P_"+filename)
  checkpoint_dict = torch.load(new_model_name,map_location=torch.device('cpu'))
  iteration = checkpoint_dict['iteration']
  learning_rate = checkpoint_dict['learning_rate']
  optimizer = checkpoint_dict['optimizer']
  saved_state_dict = checkpoint_dict['model']
  print(iteration)
  #@markdown 输出xxx_epoch.pth；此模型**仅供合成使用**，去除训练信息、体积约为1/3，**无法训练使用**
  torch.save({'model': saved_state_dict,
    'iteration': None,
    'optimizer': None,
    'learning_rate': None}, out_model_name)