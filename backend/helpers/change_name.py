import os
import sys
import json
from pathlib import Path
from datetime import datetime

ROOT_DIR = Path("/Users/ivankochergin/Yandex.Disk.localized/Data/1Projects/Algolume")
OLD_TEXT = ""
NEW_TEXT = ""
LOG_PATH = "/Users/ivankochergin/Yandex.Disk.localized/Data/1Projects/Algolume/backend/helpers/replace_log.json"

def load_log(json_path: Path) -> dict:
    if not json_path.exists():
        return {"actions": []}
    try:
        with json_path.open("r", encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError:
        print(f"ERROR: {json_path} повреждён или невалиден как JSON.", file=sys.stderr)
        raise

def save_log(json_path: Path, data: dict):
    with json_path.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def do_replacement(root_dir: Path, old_text: str, new_text: str, log_path):
    log_path = Path(log_path) if isinstance(log_path, str) else log_path
    root_dir = root_dir.resolve()

    if not root_dir.exists():
        print(f"ERROR: Корневая директория не найдена: {root_dir}", file=sys.stderr)
        return

    script_path = Path(__file__).resolve()

    log_data = load_log(log_path)
    actions = log_data.get("actions", [])
    new_id = max((act["id"] for act in actions), default=0) + 1
    this_action = {
        "id": new_id,
        "timestamp": datetime.utcnow().isoformat(),
        "files": []
    }

    print(f"\n=== Запускаем поиск/замену (action id={new_id}) ===")
    total_replacements = 0

    for dirpath, dirnames, filenames in os.walk(root_dir):
        for fname in filenames:
            file_path = Path(dirpath) / fname
            file_path = file_path.resolve()

            if file_path == script_path:
                continue

            try:
                text = file_path.read_text(encoding="utf-8")
            except (UnicodeDecodeError, PermissionError):
                continue

            if old_text in text:
                backup_text = text
                new_content = text.replace(old_text, new_text)
                try:
                    file_path.write_text(new_content, encoding="utf-8")
                except PermissionError:
                    print(f"WARNING: Не удалось перезаписать {file_path}", file=sys.stderr)
                    continue

                rel_path = str(file_path.relative_to(root_dir))
                this_action["files"].append({
                    "path": rel_path,
                    "backup": backup_text
                })
                total_replacements += 1
                print(f"  → Replaced in: {rel_path}")

    if total_replacements == 0:
        print("Ни в одном файле не найдено совпадений. Ничего не меняем, в лог ничего не пишем.")
        return

    actions.append(this_action)
    log_data["actions"] = actions
    save_log(log_path, log_data)

    print(f"\nЗавершено: изменено {total_replacements} файлов.")
    print(f"Действие записано в лог (id={new_id}) → {log_path}")

if __name__ == "__main__":
    do_replacement(ROOT_DIR, OLD_TEXT, NEW_TEXT, LOG_PATH)
