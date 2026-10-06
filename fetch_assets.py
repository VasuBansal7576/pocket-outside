#!/usr/bin/env python3
"""Fetch only the pinned public assets needed by this entry; write inside this project."""
import hashlib
import json
import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent
HF = "https://huggingface.co/Xenova/all-MiniLM-L6-v2/resolve/751bff37182d3f1213fa05d7196b954e230abad9/"
MODEL = "models/Xenova/all-MiniLM-L6-v2/resolve/751bff37182d3f1213fa05d7196b954e230abad9/"
CDN = "https://cdn.jsdelivr.net/npm/"
ASSETS = [
 ("vendor/transformers.js", CDN+"@huggingface/transformers@3.8.1/+esm"),
 ("vendor/onnxruntime-common.js", CDN+"onnxruntime-common@1.21.0/+esm"),
 ("vendor/onnxruntime-web.js", CDN+"onnxruntime-web@1.22.0-dev.20250409-89f8206ba4/+esm"),
 ("vendor/ort-wasm-simd-threaded.jsep.mjs", CDN+"@huggingface/transformers@3.8.1/dist/ort-wasm-simd-threaded.jsep.mjs"),
 ("vendor/ort-wasm-simd-threaded.jsep.wasm", CDN+"@huggingface/transformers@3.8.1/dist/ort-wasm-simd-threaded.jsep.wasm"),
 *[(MODEL+name,HF+name) for name in ["config.json","tokenizer_config.json","tokenizer.json","onnx/model_quantized.onnx"]],
 ("vendor/transformers.LICENSE", CDN+"@huggingface/transformers@3.8.1/LICENSE"),
 ("vendor/onnxruntime.LICENSE", "https://raw.githubusercontent.com/microsoft/onnxruntime/89f8206ba4/LICENSE"),
 ("models/MODEL-LICENSE.txt", "https://www.apache.org/licenses/LICENSE-2.0.txt"),
 ("models/MODEL-CARD.md", HF+"README.md")
]

def sha(data):
    return hashlib.sha256(data).hexdigest()

if __name__ == "__main__":
    manifest_path = ROOT / "assets-provenance.json"
    previous = json.loads(manifest_path.read_text()) if manifest_path.exists() else {"assets":[]}
    expected = {item["path"]:item for item in previous["assets"]}
    records = []
    for path, url in ASSETS:
        target = ROOT / path
        if target.exists() and path in expected:
            if sha(target.read_bytes()) != expected[path]["sha256"]:
                raise RuntimeError("Existing asset checksum differs: "+path)
            records.append(expected[path])
            print("Verified",path,flush=True)
            continue
        request = urllib.request.Request(url,headers={"User-Agent":"PocketOutside/1.0"})
        with urllib.request.urlopen(request, timeout=60) as response:
            data = response.read(65_000_001)
        if len(data)>65_000_000:
            raise RuntimeError("Unexpectedly large asset: "+path)
        original_hash = sha(data)
        adjustments = []
        if path == "vendor/transformers.js":
            replacements = {
                b'"/npm/onnxruntime-common/+esm"':b'"./onnxruntime-common.js"',
                b'"/npm/onnxruntime-web@1.22.0-dev.20250409-89f8206ba4/+esm"':b'"./onnxruntime-web.js"'
            }
            for original, local in replacements.items():
                if original not in data:
                    raise RuntimeError("Upstream import layout changed")
                data = data.replace(original,local)
            adjustments.append("Two CDN imports changed to bundled local runtime modules")
        if path.endswith((".js",".mjs")):
            data = re.sub(rb"(?m)^//# sourceMappingURL=.*$",b"",data)
            adjustments.append("Source-map URL removed; no source-map artifact is required")
        if path == "vendor/transformers.js":
            data = b'/* Modified by Pocket Outside on 6 October 2026: CDN imports point to bundled local ONNX modules; source-map URL removed. Original package notices retained below. */\n' + data
            adjustments.append("Prominent modification notice added")
        if path in expected and sha(data)!=expected[path]["sha256"]:
            raise RuntimeError("Fetched asset checksum differs: "+path)
        target.parent.mkdir(parents=True,exist_ok=True)
        target.write_bytes(data)
        records.append({"path":path,"source_url":url,"bytes":len(data),"source_sha256":original_hash,
                        "sha256":sha(data),"adjustments":adjustments})
        print("Saved",path,len(data),flush=True)
    manifest_path.write_text(json.dumps({
        "downloaded_utc":"2026-10-06",
        "model_revision":"751bff37182d3f1213fa05d7196b954e230abad9",
        "assets":records
    },indent=2)+"\n")
