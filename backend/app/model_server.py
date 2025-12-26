from flask import Flask
from flask_cors import CORS
import json
# import torch
from transformers import AutoTokenizer
from pathlib import Path
import numpy as np
import onnxruntime as ort
from backend.config_runtime import *

app = Flask(__name__)
CORS(app)


# ─── ЗАГРУЗКА МОДЕЛИ ─────────────────────────────────────────────
CKPT       = Path(PATH_TO_APP) / "model_ckpt"                      # ваша папка
LABELS_TXT = CKPT / "labels.txt"
classes    = LABELS_TXT.read_text(encoding="utf-8").splitlines()

tokenizer = AutoTokenizer.from_pretrained(str(CKPT), use_fast=False)
ort_sess  = ort.InferenceSession(
    str(Path(PATH_TO_APP) / "static/model.onnx"),
    providers=["CPUExecutionProvider"]
)

def _safe_preprocess(src: str) -> str:
    try:
        from backend.model import preprocess
        return preprocess.preprocess_and_canonicalize(src)
    except Exception:
        return src + "\n"

def _predict(code: str, top_k: int = 5):
    clean = _safe_preprocess(code)
    tok   = tokenizer(
        clean,
        truncation=True, padding="max_length",
        max_length=256, return_tensors="np"  # onnxruntime ждёт numpy
    )
    inputs = {
        "input_ids":      np.array(tok["input_ids"],      dtype=np.int64),
        "attention_mask": np.array(tok["attention_mask"], dtype=np.int64),
    }
    logits = ort_sess.run(None, inputs)[0][0]
    probs  = np.exp(logits) / np.exp(logits).sum()
    ranked = sorted(zip(classes, probs.tolist()), key=lambda x: x[1], reverse=True)
    return ranked[:top_k]


LOG_PATH = Path("static") / "logs.jsonl"
LOG_PATH.parent.mkdir(exist_ok=True)

def _append_log(rec: dict):
    with LOG_PATH.open("a", encoding="utf-8") as f:
        json.dump(rec, f, ensure_ascii=False);
        f.write("\n")
