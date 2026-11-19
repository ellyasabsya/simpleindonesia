#!/usr/bin/env python3
"""Bungkus /berita dan /berita/{slug} dengan Navbar, PageBackground, dan Footer."""
import re
from pathlib import Path

FILES = ["resources/js/pages/berita/index.tsx", "resources/js/pages/berita/show.tsx"]
IMPORTS = (
    "import type { ComponentProps } from 'react';\n"
    "import Footer from '@/components/landing/footer';\n"
    "import Navbar from '@/components/landing/navbar';\n"
    "import PageBackground from '@/components/page-background';\n"
)

for rel in FILES:
    p = Path(rel)
    if not p.exists():
        print("lewati (tidak ada):", rel)
        continue
    s = p.read_text(encoding="utf-8")
    if "PageBackground" in s:
        print("lewati (sudah dibungkus):", rel)
        continue
    m = re.search(r"export default function (\w+)\(", s)
    if not m:
        print("GAGAL: export default function tidak ketemu di", rel)
        continue
    name = m.group(1)
    s = s.replace(m.group(0), f"function {name}Inner(", 1)
    # sisipkan import setelah blok import terakhir di bagian atas
    last = list(re.finditer(r"^import .*?;\s*$", s, re.M | re.S))
    pos = last[-1].end() if last else 0
    s = s[:pos] + "\n" + IMPORTS + s[pos:]
    s = s.rstrip("\n") + f"""

export default function {name}(props: ComponentProps<typeof {name}Inner>) {{
    return (
        <div className="relative min-h-screen text-slate-900 transition-colors dark:text-white">
            <PageBackground />
            <Navbar />
            <div className="relative z-10 pt-24">
                <{name}Inner {{...props}} />
                <Footer />
            </div>
        </div>
    );
}}
"""
    p.write_text(s, encoding="utf-8")
    print("ok: dibungkus", rel)
