from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from datetime import datetime
import uuid
import json
import os
from get_py_debug_log import get_debug_log
import shutil


app = Flask(__name__)
CORS(app)


def generate_uuid():
    return str(uuid.uuid4())


def get_current_datetime():
    return str(datetime.now().strftime("%Y-%m-%d %H:%M:%S"))


def create_new_debugging_session(debug_id, debug_log, code, input_data):
    base_path = "C:/Users/iskoc/YandexDisk/Data/1Projects/AlgorithmVisualizer/python_debug_sessions"
    folder_name = debug_id
    full_path = os.path.join(base_path, folder_name)

    os.makedirs(full_path, exist_ok=True)

    template_path = os.path.join(base_path, "_templates")
    html_template_path = os.path.join(template_path, "py_session.html")
    js_template_path = os.path.join(template_path, "interaction.js")

    # Подготовка данных для вставки
    code_lines = code.split('\n')

    # Замена плейсхолдеров в HTML-шаблоне
    with open(html_template_path, 'r', encoding='utf-8') as file:
        html_content = file.read()
        html_content = html_content.replace("{code_lines}", json.dumps(code_lines))
        html_content = html_content.replace("{input_data}", input_data)
        html_content = html_content.replace("{debug_log}", json.dumps(debug_log))

    html_filename = "py_session.html"
    with open(os.path.join(full_path, html_filename), 'w', encoding='utf-8') as file:
        file.write(html_content)

    shutil.copy(js_template_path, os.path.join(full_path, "interaction.js"))

    file_url = f'file:///{full_path}/py_session.html'
    return file_url


@app.route('/')
def index():
    return send_from_directory('.', 'index.html')


@app.route('/new-debug-page', methods=['POST'])
def new_debug_page():
    # Get code and inputs from the request
    code = request.json.get('code', '')
    input_data = request.json.get('input', '')  # Assuming inputs are newline separated

    debug_id = generate_uuid()
    debug_log = get_debug_log(code, input_data)
    # print(debug_log)

    file_url = create_new_debugging_session(debug_id, debug_log, code, input_data)

    return jsonify({
        "url": file_url,
        "id": debug_id,
    })


@app.route('/request-debug-log', methods=['POST'])
def request_debug_log():
    code = request.json.get('code', '')
    input_data = request.json.get('input', '')

    debug_log = get_debug_log(code, input_data)

    return jsonify({
        "log": debug_log,
    })


if __name__ == '__main__':
    app.run(debug=True)
