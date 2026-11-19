import os

ROOT = os.environ.get("SK_ROOT", ".")
TSX = os.path.join(ROOT, "resources/js/pages/panel/events/penilaian.tsx")
tsx = open(TSX, encoding="utf-8").read()

old = "{ov.checks.map((x, i) => ("
new = "{(okBlock ? [] : ov.checks).map((x, i) => ("
n = tsx.count(old)
assert n == 1, f"GAGAL: ditemukan {n}x (harus 1). Tidak ada file yang diubah."
assert "const okBlock = ov.checks.length > 0" in tsx, "GAGAL: okBlock tidak ditemukan. Tidak ada file yang diubah."

open(TSX, "w", encoding="utf-8").write(tsx.replace(old, new))
print("ok: daftar periksa disembunyikan kalau semua butir sudah lengkap")
