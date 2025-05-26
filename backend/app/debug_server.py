import os, sys, re, json, time, uuid, shutil
from datetime import datetime
from pathlib import Path

from flask import Flask, redirect, request, jsonify, send_from_directory
from flask_cors import CORS
from apscheduler.schedulers.background import BackgroundScheduler
from flask_limiter import Limiter
from redis import Redis
from flask_limiter.util import get_remote_address

from backend.code_exec.debug_limits import get_debug_log_limited, TimeoutException, MemoryLimitException
from backend.config import *

app = Flask(__name__)
CORS(app)

redis_client = Redis(host="localhost", port=6379, db=0, socket_timeout=1, socket_connect_timeout=1)

limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    storage_uri="redis://localhost:6379/0",
    storage_options={
        "socket_timeout": 1,
        "socket_connect_timeout": 1
    },
    default_limits=["150 per minute", "10 per second"],
    headers_enabled=True
)


def clean_old_debug_sessions():
    """
    Each 1 hour delete everything from SESSION_BASE (except templates),
    WHICH is created 24 hours ago or later
    """
    now = time.time()
    cutoff = 24 * 3600

    for name in os.listdir(SESSIONS_BASE):
        if name == "_templates":
            continue

        path = os.path.join(SESSIONS_BASE, name)
        try:
            ctime = os.path.getctime(path)
        except Exception:
            continue

        if now - ctime > cutoff:
            try:
                if os.path.isdir(path):
                    shutil.rmtree(path)
                else:
                    os.remove(path)
                print(f"[{datetime.now():%Y-%m-%d %H:%M:%S}] removed old session: {path}")
            except Exception as e:
                print(f"[WARNING] cannot remove {path}: {e}")


scheduler = BackgroundScheduler()
scheduler.add_job(
    clean_old_debug_sessions,
    trigger="date",
    run_date=datetime.now()
)
scheduler.add_job(
    clean_old_debug_sessions,
    trigger="interval",
    hours=1
)
scheduler.start()


def generate_uuid():
    return str(uuid.uuid4())


def get_current_datetime():
    return str(datetime.now().strftime("%Y-%m-%d %H:%M:%S"))


def create_new_debugging_session(debug_id, debug_log, code, input_data):
    folder_name = debug_id
    full_path = os.path.join(SESSIONS_BASE, folder_name)

    os.makedirs(full_path, exist_ok=True)

    template_path = os.path.join(SESSIONS_BASE, "_templates")
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

    file_url = f'{BASE_LINK}/python_debug_sessions/{folder_name}/py_session.html'
    return file_url


def create_new_tutle_session(debug_id, debug_log, code, input_data, dp, parent):
    folder_name = debug_id
    full_path = os.path.join(SESSIONS_BASE, folder_name)

    os.makedirs(full_path, exist_ok=True)

    template_path = os.path.join(SESSIONS_BASE, "_templates")
    html_template_path = os.path.join(template_path, "pysession-turtle.html")
    js_template_path = os.path.join(template_path, "interaction-turtle.js")
    interaction_js_template_path = os.path.join(template_path, "interaction.js")

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
    shutil.copy(interaction_js_template_path, os.path.join(full_path, "interaction.js"))

    file_url = f'{BASE_LINK}/python_debug_sessions/{folder_name}/pysession-turtle.html'
    return file_url


def create_new_grasshopper_session(debug_id, debug_log, code, input_data, dp, parent):
    folder_name = debug_id
    full_path = os.path.join(SESSIONS_BASE, folder_name)

    os.makedirs(full_path, exist_ok=True)

    template_path = os.path.join(SESSIONS_BASE, "_templates")
    html_template_path = os.path.join(template_path, "pysession-grasshopper.html")
    js_template_path = os.path.join(template_path, "interaction-grasshopper.js")
    interaction_js_template_path = os.path.join(template_path, "interaction.js")

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
    shutil.copy(interaction_js_template_path, os.path.join(full_path, "interaction.js"))

    file_url = f'{BASE_LINK}/python_debug_sessions/{folder_name}/pysession-grasshopper.html'
    return file_url


def create_new_dfs_session(debug_id, debug_log, code, input_data, parent, graph):
    folder_name = debug_id
    full_path = os.path.join(SESSIONS_BASE, folder_name)

    os.makedirs(full_path, exist_ok=True)

    template_path = os.path.join(SESSIONS_BASE, "_templates")
    html_template_path = os.path.join(template_path, "pysession-dfs.html")
    js_template_path = os.path.join(template_path, "interaction-dfs.js")
    interaction_js_template_path = os.path.join(template_path, "interaction.js")

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
    shutil.copy(interaction_js_template_path, os.path.join(full_path, "interaction.js"))

    file_url = f'{BASE_LINK}/python_debug_sessions/{folder_name}/pysession-dfs.html'
    return file_url


def create_new_bfs_session(debug_id, debug_log, code, input_data, parent, graph):
    folder_name = debug_id
    full_path = os.path.join(SESSIONS_BASE, folder_name)

    os.makedirs(full_path, exist_ok=True)

    template_path = os.path.join(SESSIONS_BASE, "_templates")
    html_template_path = os.path.join(template_path, "pysession-bfs.html")
    js_template_path = os.path.join(template_path, "interaction-dfs.js")
    interaction_js_template_path = os.path.join(template_path, "interaction.js")

    code_lines = code.split('\n')

    with open(html_template_path, 'r', encoding='utf-8') as file:
        html_content = file.read()
        html_content = html_content.replace("{code_lines}", json.dumps(code_lines))
        html_content = html_content.replace("{input_data}", input_data)
        html_content = html_content.replace("{debug_log}", json.dumps(debug_log))
        html_content = html_content.replace("{parentVar}", parent)
        html_content = html_content.replace("{graphVar}", graph)

    html_filename = "pysession-bfs.html"
    with open(os.path.join(full_path, html_filename), 'w', encoding='utf-8') as file:
        file.write(html_content)

    shutil.copy(js_template_path, os.path.join(full_path, "interaction-dfs.js"))
    shutil.copy(interaction_js_template_path, os.path.join(full_path, "interaction.js"))

    file_url = f'{BASE_LINK}/python_debug_sessions/{folder_name}/pysession-bfs.html'
    return file_url


def create_new_dijkstra_session(debug_id, debug_log, code, input_data, parent, graph, dist):
    folder_name = debug_id
    full_path = os.path.join(SESSIONS_BASE, folder_name)
    os.makedirs(full_path, exist_ok=True)

    template_path = os.path.join(SESSIONS_BASE, "_templates")
    html_template_path = os.path.join(template_path, "pysession-dijkstra.html")
    js_template_path = os.path.join(template_path, "interaction-dijkstra.js")
    interaction_js_template_path = os.path.join(template_path, "interaction.js")

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
    shutil.copy(interaction_js_template_path, os.path.join(full_path, "interaction.js"))

    file_url = f'{BASE_LINK}/python_debug_sessions/{folder_name}/pysession-dijkstra.html'
    return file_url


@app.route('/')
@limiter.limit("30 per minute; 5 per second")
def index():
    return send_from_directory(PATH_TO_THEORY, 'index.html')


@app.route('/debug')
@limiter.limit("30 per minute; 5 per second")
def debug_route():
    return send_from_directory(PATH_TO_FRONTEND, 'simple_debug/debug.html')


@app.route('/style-debug.css')
@limiter.limit("30 per minute; 5 per second")
def debug_style_route():
    return send_from_directory(PATH_TO_FRONTEND, 'simple_debug/style-debug.css')


@app.route('/debug-script.js')
@limiter.limit("30 per minute; 5 per second")
def debug_script_route():
    return send_from_directory(PATH_TO_FRONTEND, 'simple_debug/debug-script.js')


@app.route('/new-debug-page', methods=['POST'])
@limiter.limit("30 per minute; 5 per second")
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
@limiter.limit("30 per minute; 5 per second")
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
@limiter.limit("30 per minute; 5 per second")
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
@limiter.limit("30 per minute; 5 per second")
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


@app.route('/new-debug-page-bfs', methods=['POST'])
@limiter.limit("30 per minute; 5 per second")
def new_debug_page_bfs():
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
        file_url = create_new_bfs_session(debug_id, debug_log, code, input_data, parent, graph)

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
@limiter.limit("30 per minute; 5 per second")
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
@limiter.limit("30 per minute; 5 per second")
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
@limiter.limit("30 per minute; 5 per second")
def debug_sessions(debug_id, filename):
    session_folder = os.path.join(SESSIONS_BASE, debug_id)
    return send_from_directory(session_folder, filename)


@app.route('/sessions/<path:filename>')
@limiter.limit("30 per minute; 5 per second")
def sessions(filename):
    return send_from_directory(SESSIONS_BASE, filename)


@app.route('/a.ico')
@limiter.limit("30 per minute; 5 per second")
def serve_ico():
    return send_from_directory(BASE_PATH, "media/a.ico")


@app.route('/<path:filename>')
@limiter.limit("30 per minute; 5 per second")
def serve_src(filename):
    if filename.endswith('.py'):
        return

    if filename == "index.html" or filename == "index":
        return redirect("/", code=301)

    file_path = os.path.join(PATH_TO_THEORY, filename)
    if os.path.exists(file_path):
        return send_from_directory(PATH_TO_THEORY, filename)

    html_path = os.path.join(PATH_TO_THEORY, f"{filename}.html")
    if os.path.exists(html_path):
        return send_from_directory(PATH_TO_THEORY, f"{filename}.html")

    return "File not found", 404


@app.route('/white_black_list_py.html')
@limiter.limit("30 per minute; 5 per second")
def white_black_list():
    return send_from_directory(PATH_TO_THEORY, "../../frontend/theory/white_black_list_py.html")


@app.post("/api/predict")
@limiter.limit("30 per minute; 5 per second")
def api_predict():
    from model_server import _predict
    data = request.get_json(force=True)
    code = data.get("code", "")
    preds = _predict(code)
    return jsonify(predictions=preds), 200


@app.post("/api/log")
@limiter.limit("30 per minute; 5 per second")
def api_log():
    data = request.get_json(force=True)
    from model_server import _append_log
    _append_log({
        "ts": time.time(),
        "code": data.get("code", ""),
        "predicted": data.get("predicted", ""),
        "correct": data.get("correct", "")
    })
    return jsonify(status="ok"), 200


# ─── замена ссылок ────────────────────────────────────────────
DEV_HOST_RE = re.compile(r'https?://127\.0\.0\.1:5000/?')
TEXT_EXTS = ('.html', '.js', '.css')
SESSION_ROOT = 'python_debug_sessions'
SKIP_DIRS = {'venv', '__pycache__', 'migrations',
             'node_modules', 'static', 'logs'}


def replace_localhost_links(base_link: str, root_dir: Path):
    base_link = base_link.rstrip('/')  # https://algolume.ru
    squeeze_re = re.compile(re.escape(base_link) + r'/+')  # <-- трогаем ТОЛЬКО после хоста

    for dirpath, _, filenames in os.walk(root_dir):
        parts = Path(dirpath).relative_to(root_dir).parts
        if SKIP_DIRS.intersection(parts):
            continue
        if parts and parts[0] == SESSION_ROOT and (len(parts) < 2 or parts[1] != '_templates'):
            continue

        for fname in filenames:
            if not fname.endswith(TEXT_EXTS):
                continue
            full = Path(dirpath) / fname
            try:
                text = full.read_text('utf-8')
            except UnicodeDecodeError:
                continue

            # ① меняем localhost-URL на прод-URL
            new = DEV_HOST_RE.sub(base_link + '/', text)

            # ② убираем лишние '/'   ТОЛЬКО   прямо после prod-URL
            new = squeeze_re.sub(base_link + '/', new)

            if new != text:
                full.write_text(new, encoding='utf-8')
                print(f'[replace] {full}')


if __name__ == '__main__':
    replace_localhost_links(BASE_LINK, root_dir=BASE_PATH)
    app.run(host='0.0.0.0', port=5000, debug=True)
