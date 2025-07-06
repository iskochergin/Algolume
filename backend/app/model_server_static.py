import json
from pathlib import Path

import numpy as np
import onnxruntime as ort
from transformers import AutoTokenizer

from backend.config import *

CKPT = Path(PATH_TO_APP) / "model_ckpt"
LABELS_TXT = CKPT / "labels.txt"
classes = LABELS_TXT.read_text(encoding="utf-8").splitlines()

MODEL_PATH = Path(PATH_TO_APP) / "static" / "model.quant.onnx"
LOG_PATH = Path(PATH_TO_APP) / "static" / "logs.jsonl"
LOG_PATH.parent.mkdir(parents=True, exist_ok=True)

tokenizer = AutoTokenizer.from_pretrained(str(CKPT), use_fast=False)

sess_opt = ort.SessionOptions()
sess_opt.enable_cpu_mem_arena = False
sess_opt.enable_mem_pattern = False
sess_opt.intra_op_num_threads = 1
sess_opt.inter_op_num_threads = 1

ort_sess = ort.InferenceSession(
    str(MODEL_PATH),
    sess_options=sess_opt,
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

    tok = tokenizer(
        clean,
        truncation=True,
        padding="max_length",
        max_length=256,
        return_tensors="np"
    )

    inputs = {
        "input_ids": np.asarray(tok["input_ids"], dtype=np.int64),
        "attention_mask": np.asarray(tok["attention_mask"], dtype=np.int64),
    }

    logits = ort_sess.run(None, inputs)[0][0]

    e = np.exp(logits - logits.max())
    probs = e / e.sum()

    ranked = sorted(
        zip(classes, probs.tolist()),
        key=lambda x: x[1],
        reverse=True
    )
    return ranked[:top_k]


def _append_log(rec: dict):
    with LOG_PATH.open("a", encoding="utf-8") as f:
        json.dump(rec, f, ensure_ascii=False)
        f.write("\n")
