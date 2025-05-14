from flask import Flask, redirect, request, jsonify, send_from_directory
from flask_cors import CORS
from datetime import datetime
import uuid
import json
import os
from get_py_debug_log import get_debug_log
from debug_limits import get_debug_log_limited, TimeoutException, MemoryLimitException
import shutil
from pathlib import Path
import time, json, torch
from transformers import AutoTokenizer, AutoModel

# ─────────────── 2. МОДЕЛЬ (вставить сразу после констант) ───────
CKPT = Path("model_ckpt")  # папка с labels.txt, tokenizer_config.json, pytorch_model.bin …
classes = CKPT.joinpath("labels.txt").read_text().splitlines()

tokenizer = AutoTokenizer.from_pretrained(str(CKPT), use_fast=False)  # <- критично!
encoder = AutoModel.from_pretrained(str(CKPT))
hidden_sz = encoder.config.hidden_size

mlp = torch.nn.Sequential(
    torch.nn.Linear(hidden_sz, hidden_sz // 2),
    torch.nn.ReLU(),
    torch.nn.Dropout(0.1),
    torch.nn.Linear(hidden_sz // 2, len(classes)),
)
mlp.load_state_dict(torch.load(CKPT / "mlp_head.pt", map_location="cpu"))

encoder.eval();
mlp.eval()

LOG_PATH = Path("static") / "logs.jsonl"
LOG_PATH.parent.mkdir(exist_ok=True)


def _safe_preprocess(src: str) -> str:
    try:
        from model import preprocess
        return preprocess.preprocess_and_canonicalize(src)
    except Exception:
        return src + "\n"


def _predict(code: str, top_k: int = 5):
    clean = _safe_preprocess(code)
    tok = tokenizer(clean, truncation=True, padding="max_length",
                    max_length=256, return_tensors="pt")
    with torch.no_grad():
        logits = mlp(encoder(**tok).last_hidden_state[:, 0])
        probs = torch.softmax(logits, dim=-1).squeeze().tolist()
    ranked = sorted(zip(classes, probs), key=lambda x: x[1], reverse=True)
    return ranked[:top_k]


def _append_log(rec: dict):
    with LOG_PATH.open("a", encoding="utf-8") as f:
        json.dump(rec, f, ensure_ascii=False);
        f.write("\n")


app = Flask(__name__)
CORS(app)

SESSIONS_BASE = "/Users/ivankochergin/Yandex.Disk.localized/Data/1Projects/Algolume/python_debug_sessions"
PATH_TO_SRC = "/Users/ivankochergin/Yandex.Disk.localized/Data/1Projects/Algolume/src"
BASE_PATH = "/Users/ivankochergin/Yandex.Disk.localized/Data/1Projects/Algolume/python_debug_sessions"


def generate_uuid():
    return str(uuid.uuid4())


def get_current_datetime():
    return str(datetime.now().strftime("%Y-%m-%d %H:%M:%S"))


def create_new_debugging_session(debug_id, debug_log, code, input_data):
    folder_name = debug_id
    full_path = os.path.join(BASE_PATH, folder_name)

    os.makedirs(full_path, exist_ok=True)

    template_path = os.path.join(BASE_PATH, "_templates")
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


def create_new_tutle_session(debug_id, debug_log, code, input_data, dp, parent):
    folder_name = debug_id
    full_path = os.path.join(BASE_PATH, folder_name)

    os.makedirs(full_path, exist_ok=True)

    template_path = os.path.join(BASE_PATH, "_templates")
    html_template_path = os.path.join(template_path, "pysession-turtle.html")
    js_template_path = os.path.join(template_path, "interaction-turtle.js")

    code_lines = code.split('\n')

    with open(html_template_path, 'r', encoding='utf-8') as file:
        html_content = file.read()
        html_content = html_content.replace("{code_lines}", json.dumps(code_lines))
        html_content = html_content.replace("{input_data}", input_data)
        html_content = html_content.replace("{debug_log}", json.dumps(debug_log))
        html_content = html_content.replace("{dpVar}", dp)
        html_content = html_content.replace("{parentVar}", parent)

    html_filename = "pysession-turtle.html"
    with open(os.path.join(full_path, html_filename), 'w', encoding='utf-8') as file:
        file.write(html_content)

    shutil.copy(js_template_path, os.path.join(full_path, "interaction-turtle.js"))

    file_url = f'http://127.0.0.1:5000/python_debug_sessions/{folder_name}/pysession-turtle.html'
    return file_url


def create_new_grasshopper_session(debug_id, debug_log, code, input_data, dp, parent):
    folder_name = debug_id
    full_path = os.path.join(BASE_PATH, folder_name)

    os.makedirs(full_path, exist_ok=True)

    template_path = os.path.join(BASE_PATH, "_templates")
    html_template_path = os.path.join(template_path, "pysession-grasshopper.html")
    js_template_path = os.path.join(template_path, "interaction-grasshopper.js")

    code_lines = code.split('\n')

    with open(html_template_path, 'r', encoding='utf-8') as file:
        html_content = file.read()
        html_content = html_content.replace("{code_lines}", json.dumps(code_lines))
        html_content = html_content.replace("{input_data}", input_data)
        html_content = html_content.replace("{debug_log}", json.dumps(debug_log))
        html_content = html_content.replace("{dpVar}", dp)
        html_content = html_content.replace("{parentVar}", parent)

    html_filename = "pysession-grasshopper.html"
    with open(os.path.join(full_path, html_filename), 'w', encoding='utf-8') as file:
        file.write(html_content)

    shutil.copy(js_template_path, os.path.join(full_path, "interaction-grasshopper.js"))

    file_url = f'http://127.0.0.1:5000/python_debug_sessions/{folder_name}/pysession-grasshopper.html'
    return file_url


def create_new_dfs_session(debug_id, debug_log, code, input_data, parent, graph):
    folder_name = debug_id
    full_path = os.path.join(BASE_PATH, folder_name)

    os.makedirs(full_path, exist_ok=True)

    template_path = os.path.join(BASE_PATH, "_templates")
    html_template_path = os.path.join(template_path, "pysession-dfs.html")
    js_template_path = os.path.join(template_path, "interaction-dfs.js")

    code_lines = code.split('\n')

    with open(html_template_path, 'r', encoding='utf-8') as file:
        html_content = file.read()
        html_content = html_content.replace("{code_lines}", json.dumps(code_lines))
        html_content = html_content.replace("{input_data}", input_data)
        html_content = html_content.replace("{debug_log}", json.dumps(debug_log))
        html_content = html_content.replace("{parentVar}", parent)
        html_content = html_content.replace("{graphVar}", graph)

    html_filename = "pysession-dfs.html"
    with open(os.path.join(full_path, html_filename), 'w', encoding='utf-8') as file:
        file.write(html_content)

    shutil.copy(js_template_path, os.path.join(full_path, "interaction-dfs.js"))

    file_url = f'http://127.0.0.1:5000/python_debug_sessions/{folder_name}/pysession-dfs.html'
    return file_url


def create_new_dijkstra_session(debug_id, debug_log, code, input_data, parent, graph, dist):
    folder_name = debug_id
    full_path = os.path.join(BASE_PATH, folder_name)
    os.makedirs(full_path, exist_ok=True)

    template_path = os.path.join(BASE_PATH, "_templates")
    html_template_path = os.path.join(template_path, "pysession-dijkstra.html")
    js_template_path = os.path.join(template_path,
                                    "interaction-dijkstra.js")  # if you have a separate JS file; otherwise, you can reuse the DFS one

    code_lines = code.split('\n')

    with open(html_template_path, 'r', encoding='utf-8') as file:
        html_content = file.read()
        html_content = html_content.replace("{code_lines}", json.dumps(code_lines))
        html_content = html_content.replace("{input_data}", input_data)
        html_content = html_content.replace("{debug_log}", json.dumps(debug_log))
        html_content = html_content.replace("{parentVar}", parent)
        html_content = html_content.replace("{graphVar}", graph)
        html_content = html_content.replace("{distVar}", dist)

    html_filename = "pysession-dijkstra.html"
    with open(os.path.join(full_path, html_filename), 'w', encoding='utf-8') as file:
        file.write(html_content)

    shutil.copy(js_template_path, os.path.join(full_path, "interaction-dijkstra.js"))
    file_url = f'http://127.0.0.1:5000/python_debug_sessions/{folder_name}/pysession-dijkstra.html'
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


@app.route('/new-debug-page-turtle', methods=['POST'])
def new_debug_page_turtle():
    try:
        data = request.get_json()
        code = data.get('code', '')
        input_data = data.get('input', '')
        dp = data.get('dpVar', '')
        parent = data.get('parentVar', '')

        if not dp or not parent:
            return jsonify({"error": "dpVar or parent is missing"})

        debug_id = generate_uuid()
        debug_log, exec_time, memory = get_debug_log_limited(code, input_data)
        if type(debug_log) is tuple and debug_log[0] == 'error':
            return jsonify({"error": debug_log[1]})
        if type(debug_log) is str and debug_log.startswith('Restricted!'):
            return jsonify({"error": debug_log})

        print('OK')
        file_url = create_new_tutle_session(debug_id, debug_log, code, input_data, dp, parent)

        return jsonify({
            "url": file_url,
            "id": debug_id,
            "execution_time": exec_time,
            "memory_used": memory,
            "error": None
        }), 200

    except Exception as e:
        return jsonify({"error": "An unexpected error occurred."}), 500


@app.route('/new-debug-page-grasshopper', methods=['POST'])
def new_debug_page_grasshopper():
    try:
        data = request.get_json()
        code = data.get('code', '')
        input_data = data.get('input', '')
        dp = data.get('dpVar', '')
        parent = data.get('parentVar', '')

        if not dp or not parent:
            return jsonify({"error": "dpVar or parent is missing"})

        debug_id = generate_uuid()
        debug_log, exec_time, memory = get_debug_log_limited(code, input_data)
        if type(debug_log) is tuple and debug_log[0] == 'error':
            return jsonify({"error": debug_log[1]})
        if type(debug_log) is str and debug_log.startswith('Restricted!'):
            return jsonify({"error": debug_log})

        print('OK')
        file_url = create_new_grasshopper_session(debug_id, debug_log, code, input_data, dp, parent)

        return jsonify({
            "url": file_url,
            "id": debug_id,
            "execution_time": exec_time,
            "memory_used": memory,
            "error": None
        }), 200

    except Exception as e:
        return jsonify({"error": "An unexpected error occurred."}), 500


@app.route('/new-debug-page-dfs', methods=['POST'])
def new_debug_page_dfs():
    try:
        data = request.get_json()
        code = data.get('code', '')
        input_data = data.get('input', '')
        parent = data.get('parentVar', '')
        graph = data.get('graphVar', '')

        if not parent or not graph:
            return jsonify({"error": "dpVar or graph is missing"})

        debug_id = generate_uuid()
        debug_log, exec_time, memory = get_debug_log_limited(code, input_data)
        if type(debug_log) is tuple and debug_log[0] == 'error':
            return jsonify({"error": debug_log[1]})
        if type(debug_log) is str and debug_log.startswith('Restricted!'):
            return jsonify({"error": debug_log})

        print('OK')
        file_url = create_new_dfs_session(debug_id, debug_log, code, input_data, parent, graph)

        return jsonify({
            "url": file_url,
            "id": debug_id,
            "execution_time": exec_time,
            "memory_used": memory,
            "error": None
        }), 200

    except Exception as e:
        return jsonify({"error": "An unexpected error occurred."}), 500


@app.route('/new-debug-page-dijkstra', methods=['POST'])
def new_debug_page_dijkstra():
    try:
        data = request.get_json()
        code = data.get('code', '')
        input_data = data.get('input', '')
        parent = data.get('parentVar', '')
        graph = data.get('graphVar', '')
        dist = data.get('distVar', '')

        if not parent or not graph or not dist:
            return jsonify({"error": "One or more required variables are missing (parent, graph, or dist)."}), 400

        debug_id = generate_uuid()
        debug_log, exec_time, memory = get_debug_log_limited(code, input_data)
        if type(debug_log) is tuple and debug_log[0] == 'error':
            return jsonify({"error": debug_log[1]})
        if type(debug_log) is str and debug_log.startswith('Restricted!'):
            return jsonify({"error": debug_log})

        file_url = create_new_dijkstra_session(debug_id, debug_log, code, input_data, parent, graph, dist)

        return jsonify({
            "url": file_url,
            "id": debug_id,
            "execution_time": exec_time,
            "memory_used": memory,
            "error": None
        }), 200

    except Exception as e:
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


@app.route('/a.ico')
def serve_ico():
    return send_from_directory("/Users/ivankochergin/Yandex.Disk.localized/Data/1Projects/Algolume/", "a.ico")


@app.route('/<path:filename>')
def serve_src(filename):
    if filename.endswith('.py'):
        return

    if filename == "index.html" or filename == "index":
        return redirect("/", code=301)

    file_path = os.path.join(PATH_TO_SRC, filename)
    if os.path.exists(file_path):
        return send_from_directory(PATH_TO_SRC, filename)

    html_path = os.path.join(PATH_TO_SRC, f"{filename}.html")
    if os.path.exists(html_path):
        return send_from_directory(PATH_TO_SRC, f"{filename}.html")

    return "File not found", 404


@app.route('/white_black_list_py.html')
def white_black_list():
    return send_from_directory(PATH_TO_SRC, "white_black_list_py.html")


# ─────────────── 3. API-РОУТЫ  (добавить перед if __name__ …) ─────
@app.post("/api/predict")
def api_predict():
    data = request.get_json(force=True)
    code = data.get("code", "")
    preds = _predict(code)
    # jsonify превращает list[tuple] → list[list]  (нормально для JS)
    return jsonify(predictions=preds), 200


@app.post("/api/log")
def api_log():
    data = request.get_json(force=True)
    _append_log({
        "ts": time.time(),
        "code": data.get("code", ""),
        "correct": data.get("correct", "")
    })
    return jsonify(status="ok"), 200


# ───────────────────────────────────────────────────────────────────


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
