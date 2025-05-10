import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))  # 添加当前目录到 Python 路径

from quart import Quart, request, jsonify
from cleaners import japanese_cleaners

app = Quart(__name__)

@app.route('/japanese_cleaners', methods=['POST'])
async def process_text():
    print("Received request:", request)
    data = await request.get_json()
    print("Received json:", data)
    text = data.get('text', '')
    result = japanese_cleaners(text)
    print("result:", result)
    return jsonify({'result': result})

if __name__ == '__main__':
    app.run()
