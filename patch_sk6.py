import os, sys

ROOT = os.environ.get("SK_ROOT", ".")
TSX = os.path.join(ROOT, "resources/js/pages/panel/events/penilaian.tsx")
PHP = os.path.join(ROOT, "app/Http/Controllers/Panel/JudgingController.php")

tsx = open(TSX, encoding="utf-8").read()
php = open(PHP, encoding="utf-8").read()


def once(text, old, new, label):
    n = text.count(old)
    assert n == 1, f"GAGAL [{label}]: ditemukan {n}x (harus 1). Tidak ada file yang diubah."
    return text.replace(old, new)


# ---------- PHP: bawa penanda tim dan asal sekolah ke data juara umum ----------
php = once(
    php,
    "$unit[$key] ??= ['school' => $label, 'pid' => $pcode,",
    "$unit[$key] ??= ['school' => $label, 'team' => ! empty($r['team']), 'inst' => $school, 'pid' => $pcode,",
    "php unit",
)
php = once(
    php,
    "$winners[] = ['rank' => $rk, 'code' => $r['code'], 'school' => $label];",
    "$winners[] = ['rank' => $rk, 'code' => $r['code'], 'school' => $label, 'team' => ! empty($r['team']), 'inst' => $school];",
    "php winners",
)

# ---------- TSX: helper judul kolom ----------
helper = """function skWinnerCols(ws: any[]) {
    const norm = (s: any) => String(s ?? '').trim().toLowerCase();
    const bySchool = ws.length > 0 && ws.every((w) => norm(w.inst) !== '' && norm(w.inst) === norm(w.school));
    const teams = ws.filter((w) => w.team).length;
    const nameHead = bySchool ? 'Sekolah / institusi' : teams === 0 ? 'Nama peserta' : teams === ws.length ? 'Nama tim' : 'Nama peserta / tim';
    const showInst = !bySchool && ws.some((w) => norm(w.inst) !== '' && norm(w.inst) !== norm(w.school));
    return { nameHead, showInst };
}

"""
tsx = once(tsx, "function ParentSK(", helper + "function ParentSK(", "tsx helper")

# ---------- TSX: kolom tabel juara umum ----------
tsx = once(
    tsx,
    'px-1.5 py-2">Sekolah / lembaga</th>',
    'px-1.5 py-2">{skWinnerCols(winners as any[]).nameHead}</th>\n'
    '                                            {skWinnerCols(winners as any[]).showInst && <th className="border border-slate-900 px-1.5 py-2">Sekolah / institusi</th>}',
    "tsx th",
)
tsx = once(
    tsx,
    '<td className="border border-slate-900 px-1.5 py-1.5">{w.school}</td>',
    '<td className="border border-slate-900 px-1.5 py-1.5">{w.school}</td>\n'
    '                                                {skWinnerCols(winners as any[]).showInst && <td className="border border-slate-900 px-1.5 py-1.5">{(w as any).inst || \'-\'}</td>}',
    "tsx td",
)

open(TSX, "w", encoding="utf-8").write(tsx)
open(PHP, "w", encoding="utf-8").write(php)
print("ok: kolom juara umum diperbaiki (nama peserta/tim + sekolah/institusi terpisah)")
