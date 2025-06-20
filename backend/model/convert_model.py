import torch
from transformers import AutoTokenizer, AutoModel
from pathlib import Path

CKPT_DIR = Path("model_ckpt")

tokenizer = AutoTokenizer.from_pretrained(CKPT_DIR)
encoder   = AutoModel.from_pretrained(CKPT_DIR)
encoder.eval()

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

dummy = tokenizer(
    ["dummy text"] * 2,
    padding="max_length",
    truncation=True,
    max_length=256,
    return_tensors="pt"
)

out_dir = Path("static")
out_dir.mkdir(exist_ok=True)

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
