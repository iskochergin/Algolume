from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from datetime import datetime
import uuid
import json
import os
from get_py_debug_log import get_debug_log
from debug_limits import get_debug_log_limited, TimeoutException, MemoryLimitException
import shutil


app = Flask(__name__)
CORS(app)

SESSIONS_BASE = "C:\\Users\\iskoc\\YandexDisk\\Data\\1Projects\\Algolume\\python_debug_sessions"
PATH_TO_SRC = "C:\\Users\\iskoc\\YandexDisk\\Data\\1Projects\\Algolume\\src"


def generate_uuid():
    return str(uuid.uuid4())


def get_current_datetime():
    return str(datetime.now().strftime("%Y-%m-%d %H:%M:%S"))


def create_new_debugging_session(debug_id, debug_log, code, input_data):
    base_path = "C:/Users/iskoc/YandexDisk/Data/1Projects/Algolume/python_debug_sessions"
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

    file_url = f'http://127.0.0.1:5000/python_debug_sessions/{folder_name}/py_session.html'
    return file_url


@app.route('/')
def index():
    return send_from_directory('.', 'index.html')


@app.route('/new-debug-page', methods=['POST'])
def new_debug_page():
    try:
        # Get code and inputs from the request
        data = request.get_json()
        code = data.get('code', '')
        input_data = data.get('input', '')  # Assuming inputs are newline separated

        debug_id = generate_uuid()
        debug_log, exec_time, memory = get_debug_log_limited(code, input_data)
        # debug_log is execution result, and in the case of exception it contains error
        if type(debug_log) is tuple and debug_log[0] == 'error':
            return jsonify({"error": debug_log[1]})
        if type(debug_log) is str and debug_log.startswith('Restricted!'):
            return jsonify({"error": debug_log})

        file_url = create_new_debugging_session(debug_id, debug_log, code, input_data)

        return jsonify({
            "url": file_url,
            "id": debug_id,
            "execution_time": exec_time,
            "memory_used": memory,
            "error": None
        }), 200

    except Exception as e:
        # Log the exception as needed
        return jsonify({"error": "An unexpected error occurred."}), 500

@app.route('/request-debug-log', methods=['POST'])
def request_debug_log():
    try:
        data = request.get_json()
        code = data.get('code', '')
        input_data = data.get('input', '')

        debug_log, exec_time, memory = get_debug_log_limited(code, input_data)
        # debug_log is execution result, and in the case of exception it contains error
        if type(debug_log) is tuple and debug_log[0] == 'error':
            return jsonify({"error": debug_log[1]})
        if type(debug_log) is str and debug_log.startswith('Restricted!'):
            return jsonify({"error": debug_log})

        return jsonify({
            "log": debug_log,
            "execution_time": exec_time,
            "memory_used": memory,
            "error": None
        }), 200
    except Exception as e:
        # Log the exception as needed
        return jsonify({"error": "An unexpected error occurred."}), 500


@app.route('/python_debug_sessions/<debug_id>/<path:filename>')
def debug_sessions(debug_id, filename):
    session_folder = os.path.join(SESSIONS_BASE, debug_id)
    return send_from_directory(session_folder, filename)


@app.route('/sessions/<path:filename>')
def sessions(filename):
    return send_from_directory(SESSIONS_BASE, filename)


@app.route('/script.js')
def get_script_src():
    return send_from_directory(PATH_TO_SRC, "script.js")


@app.route('/style_main_page.css')
def get_style_main_src():
    return send_from_directory(PATH_TO_SRC, "style_main_page.css")


@app.route('/white_black_list_py.html')
def white_black_list():
    return send_from_directory(PATH_TO_SRC, "white_black_list_py.html")


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
