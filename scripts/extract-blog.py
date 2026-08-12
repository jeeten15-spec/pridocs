from pathlib import Path
import re

raw = Path(__file__).resolve().parent / "blog-old.tsx"
text = raw.read_text(encoding="utf-8-sig")
parts = text.split('<article className="prose prose-slate max-w-none">')[1:]
print("articles", len(parts))

outdir = Path(__file__).resolve().parent.parent / "src" / "content" / "blog"
outdir.mkdir(parents=True, exist_ok=True)

for part in parts:
    body = part.split("</article>")[0]
    title_m = re.search(r"<h1[^>]*>([\s\S]*?)</h1>", body)
    title = re.sub(r"<[^>]+>", "", title_m.group(1) if title_m else "")
    title = " ".join(title.split())
    print("TITLE:", title[:90])

    if "Unscrambler" in title or "Word Tools Online" in title:
        name = "WordToolsArticle"
    elif "Background Remover" in title:
        name = "BackgroundRemoverArticle"
    elif "Compress Images" in title:
        name = "CompressImagesArticle"
    elif "Stop Uploading" in title:
        name = "PrivacyConvertersArticle"
    else:
        print("skip")
        continue

    body2 = re.sub(r"<h1[\s\S]*?</h1>\s*", "", body, count=1)
    body2 = re.sub(
        r'<p className="text-slate-500 text-sm mb-8">[\s\S]*?</p>\s*',
        "",
        body2,
        count=1,
    )
    body2 = body2.strip()

    content = (
        "import { Link } from 'react-router-dom'\n\n"
        f"export default function {name}() {{\n"
        f"  return (\n{body2}\n  )\n}}\n"
    )
    (outdir / f"{name}.tsx").write_text(content, encoding="utf-8")
    print("wrote", name)

