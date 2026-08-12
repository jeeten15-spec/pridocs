from pathlib import Path
import re

root = Path(__file__).resolve().parent.parent

# Fix mojibake dashes in extracted blog articles
for p in (root / "src/content/blog").glob("*.tsx"):
    t = p.read_text(encoding="utf-8")
    t2 = (
        t.replace("ΓÇö", "—")
        .replace("â€”", "—")
        .replace("&amp;", "&")
    )
    p.write_text(t2, encoding="utf-8")
    print("fixed", p.name)

# Build sitemap from tools + blog + static pages + convert pages
tools_src = (root / "src/data/tools.ts").read_text(encoding="utf-8")
tool_ids = re.findall(r"id: '([^']+)'", tools_src)

blog_src = (root / "src/data/blogPosts.ts").read_text(encoding="utf-8")
blog_slugs = re.findall(r"slug: '([^']+)'", blog_src)

convert_src = (root / "src/data/convertPages.ts").read_text(encoding="utf-8")
convert_slugs = re.findall(r"slug: '([^']+)'", convert_src)

static = [
    ("/", "weekly", "1.0"),
    ("/all-tools", "monthly", "0.9"),
    ("/how-it-works", "monthly", "0.9"),
    ("/about", "monthly", "0.7"),
    ("/privacy-pledge", "monthly", "0.7"),
    ("/blog", "weekly", "0.8"),
    ("/contact", "monthly", "0.6"),
]

lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
]

def add(path: str, freq: str, pri: str):
    lines.append("  <url>")
    lines.append(f"    <loc>https://pridocs.org{path}</loc>")
    lines.append(f"    <changefreq>{freq}</changefreq>")
    lines.append(f"    <priority>{pri}</priority>")
    lines.append("  </url>")

for path, freq, pri in static:
    add(path, freq, pri)

for slug in blog_slugs:
    add(f"/blog/{slug}", "monthly", "0.7")

for tid in tool_ids:
    add(f"/tools/{tid}", "monthly", "0.8")

for slug in convert_slugs:
    add(f"/convert/{slug}", "monthly", "0.8")

lines.append("</urlset>")
lines.append("")

out = root / "public/sitemap.xml"
out.write_text("\n".join(lines), encoding="utf-8")
print("sitemap urls", len(tool_ids) + len(blog_slugs) + len(convert_slugs) + len(static))
