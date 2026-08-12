from pathlib import Path
import re

p = Path(r"C:\Users\Hp\pridocs\src\data\tools.ts")
t = p.read_text(encoding="utf-8")

# Strip all popular: true lines
t = re.sub(r"\n\s*popular:\s*true,?", "", t)

PRIORITY = [
    "heic-to-jpg",
    "background-remover",
    "image-resize",
    "image-to-text",
    "word-daily",
    "emi-calculator",
    "song2vid",
    "docx-to-pdf",
]

for tid in PRIORITY:
    # Insert popular: true after phase: 1 for this tool block
    pattern = rf"(id: '{re.escape(tid)}',[\s\S]*?phase: 1)(,?)(\n)"
    m = re.search(pattern, t)
    if not m:
        print("MISS", tid)
        continue
    t = t[: m.start(1)] + m.group(1) + ",\n    popular: true" + m.group(3) + t[m.end() :]
    print("OK", tid)

p.write_text(t, encoding="utf-8")
print("written")
