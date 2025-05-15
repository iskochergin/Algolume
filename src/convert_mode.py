#!/usr/bin/env python3
import torch
from transformers import AutoTokenizer, AutoModel
from pathlib import Path

# 1) Point this at your checkpoint directory
CKPT_DIR = Path("model_ckpt")

# 2) Load tokenizer & encoder from your folder
tokenizer = AutoTokenizer.from_pretrained(CKPT_DIR)
encoder   = AutoModel.from_pretrained(CKPT_DIR)
encoder.eval()

# 3) Rebuild your head & load its weights
hidden_sz = encoder.config.hidden_size
# If you have a labels.txt, read it; otherwise hard-code your classes list
classes = (CKPT_DIR / "labels.txt").read_text().splitlines()
mlp = torch.nn.Sequential(
    torch.nn.Linear(hidden_sz, hidden_sz // 2),
    torch.nn.ReLU(),
    torch.nn.Dropout(0.1),
    torch.nn.Linear(hidden_sz // 2, len(classes)),
)
mlp.load_state_dict(torch.load(CKPT_DIR / "mlp_head.pt", map_location="cpu"))
mlp.eval()

# 4) Wrap into a single Module for export
class FullModel(torch.nn.Module):
    def __init__(self, encoder, head):
        super().__init__()
        self.encoder = encoder
        self.head = head
    def forward(self, input_ids, attention_mask):
        # grab [CLS] embedding
        cls_repr = self.encoder(
            input_ids=input_ids,
            attention_mask=attention_mask
        ).last_hidden_state[:, 0]  # (batch, hidden_sz)
        return self.head(cls_repr)     # (batch, num_classes)

model = FullModel(encoder, mlp)
model.eval()

# 5) Prepare a dummy batch (we’ll let the ONNX graph be dynamic along sequence dim)
dummy = tokenizer(
    ["dummy text"] * 2,             # batch of 2 just to show batch-dynamic
    padding="max_length",
    truncation=True,
    max_length=256,                 # this value won’t be hard-coded below
    return_tensors="pt"
)

# 6) Make sure your output directory exists
out_dir = Path("static")
out_dir.mkdir(exist_ok=True)

# 7) Export with BOTH axes dynamic (batch and sequence)
torch.onnx.export(
    model,
    (dummy["input_ids"], dummy["attention_mask"]),
    str(out_dir / "model.onnx"),
    input_names=["input_ids", "attention_mask"],
    output_names=["logits"],
    opset_version=17,
    dynamic_axes={
        "input_ids":      {0: "batch", 1: "seq_len"},
        "attention_mask": {0: "batch", 1: "seq_len"},
        "logits":         {0: "batch"}
    }
)

print("✅ ONNX model exported to:", out_dir / "model.onnx")
