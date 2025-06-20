import os
import json
from pathlib import Path

ROOT_DIR = Path("/Users/ivankochergin/Yandex.Disk.localized/Data/1Projects/Algolume")
ROLLBACK_COUNT = 1
LOG_FILENAME = "replace_log.json"

def load_log(json_path: Path) -> dict:
    if not json_path.exists():
        return {"actions": []}
    try:
        with json_path.open("r", encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError:
        print(f"ERROR: {json_path} повреждён или невалиден как JSON.")
        raise

def save_log(json_path: Path, data: dict):
    with json_path.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def do_rollback(root_dir: Path, count_from_end: int, log_path: Path):
    root_dir = root_dir.resolve()
    if not root_dir.exists():
        print(f"ERROR: Корневая директория не найдена: {root_dir}")
        return

    log_data = load_log(log_path)
    actions = log_data.get("actions", [])
    total = len(actions)
    if total == 0:
        print("В логе нет ни одного действия. Некуда откатываться.")
        return

    if count_from_end < 1 or count_from_end > total:
        print(f"INVALID: ROLLBACK_COUNT={count_from_end}, но в логе всего {total} действий.")
        return

    target_index = total - count_from_end
    to_undo = actions[target_index + 1 : ]

    if not to_undo:
        print("Нечего откатывать — вы уже на нужном действии.")
        return

    print(f"\n=== Начинаем откат {count_from_end} действий ===")
    for action in reversed(to_undo):
        aid = action["id"]
        print(f"Откатываем действие id={aid} (timestamp={action['timestamp']}) ...")
        for file_info in action["files"]:
            rel_path = file_info["path"]
            backup_text = file_info["backup"]
            actual_file = root_dir / rel_path
            try:
                actual_file.write_text(backup_text, encoding="utf-8")
                print(f"  → Файл восстановлен: {rel_path}")
            except Exception as e:
                print(f"ERROR: не удалось восстановить {rel_path}: {e}")

        print(f"Действие id={aid} полностью откатилось.\n")

    new_actions = actions[: target_index + 1]
    log_data["actions"] = new_actions
    save_log(log_path, log_data)

    print(f"=== Откат завершён. В логе теперь {len(new_actions)} действий. ===")
    if new_actions:
        print(f"Последний оставшийся action id = {new_actions[-1]['id']}")
    else:
        print("Лог пуст (все действия отменены).")

if __name__ == "__main__":
    log_file = ROOT_DIR / LOG_FILENAME
    do_rollback(ROOT_DIR, ROLLBACK_COUNT, log_file)
