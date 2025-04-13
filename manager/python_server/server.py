from quart import Quart, request, jsonify
from cleaners import japanese_cleaners

app = Quart(__name__)

@app.route('/japanese_cleaners', methods=['POST'])
async def process_text():
    data = await request.get_json()
    text = data.get('text', '')
    result = japanese_cleaners(text)
    return jsonify({'result': result})

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=4242)


