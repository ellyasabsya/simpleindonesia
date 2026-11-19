import sys, os
TSX = 'resources/js/pages/panel/events/penilaian.tsx'
PHP = 'app/Http/Controllers/Panel/JudgingController.php'
MIG = 'database/migrations'
if len(sys.argv) > 1: TSX = sys.argv[1]
if len(sys.argv) > 2: PHP = sys.argv[2]
if len(sys.argv) > 3: MIG = sys.argv[3]

# ================= 1. Migrasi: kolom logo di judging_sk =================
mig = os.path.join(MIG, '2026_11_19_190000_add_logo_to_judging_sk.php')
if not os.path.exists(mig):
    open(mig, 'w').write('''<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('judging_sk') && ! Schema::hasColumn('judging_sk', 'logo_path')) {
            Schema::table('judging_sk', fn (Blueprint $t) => $t->string('logo_path')->nullable());
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('judging_sk', 'logo_path')) {
            Schema::table('judging_sk', fn (Blueprint $t) => $t->dropColumn('logo_path'));
        }
    }
};
''')

# ================= 2. Controller =================
p = open(PHP).read()
old = "        $logoPath = (string) ($event->institution->logo_path ?? '');\n"
assert p.count(old) == 1, f'PHP logoPath: {p.count(old)}x (patch_sk2 sudah dijalankan?)'
p = p.replace(old, "        $logoPath = (string) (($stored->logo_path ?? null) ?: ($event->institution->logo_path ?? ''));\n")

f0 = p.find('public function finalizeSkLomba(')
assert f0 != -1, 'finalizeSkLomba tidak ketemu'
f1 = p.find('    public function ', f0 + 10)
seg = p[f0:f1 if f1 != -1 else len(p)]
def rep(seg, old, new):
    assert seg.count(old) == 1, f'{old[:60]!r}: {seg.count(old)}x'
    return seg.replace(old, new)
seg = rep(seg, "            'confirm' => 'accepted',\n        ], [",
          "            'logo' => 'nullable|image|mimes:png,jpg,jpeg,webp|max:2048',\n            'confirm' => 'accepted',\n        ], [")
seg = rep(seg, "        DB::transaction(function () use ($event, $data, $request) {",
          "        $skLogo = $request->file('logo') ? $request->file('logo')->store('sk-logo', 'public') : null;\n\n        DB::transaction(function () use ($event, $data, $request, $skLogo) {")
seg = rep(seg, "'signer_position' => trim($data['signer_position']),\n",
          "'signer_position' => trim($data['signer_position']), 'logo_path' => $skLogo,\n")
p = p[:f0] + seg + (p[f1:] if f1 != -1 else '')
open(PHP, 'w').write(p)

# ================= 3. Frontend =================
s = open(TSX).read()
def rep1(s, old, new):
    assert s.count(old) == 1, f'{old[:70]!r}: {s.count(old)}x'
    return s.replace(old, new)

# garis kop dihapus
s = rep1(s, '<div className="border-b-2 border-slate-900 pb-3 text-center">', '<div className="pb-1 text-center">')
s = rep1(s, '<div className="border-b-2 border-slate-900 pb-3">', '<div className="pb-1">')

# state logo + pratinjau
st = "    const [position, setPosition] = useState(sk?.letter?.signer_position ?? '');\n"
assert s.count(st) == 1, 'state position SK lomba'
s = s.replace(st, st + """    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPrev, setLogoPrev] = useState<string | null>(null);
    const skLogo = logoPrev ?? (sk as { logo_url?: string | null } | null)?.logo_url ?? null;
""")
s = rep1(s, "{(sk as { logo_url?: string | null }).logo_url\n", "{skLogo\n")
s = rep1(s, "src={(sk as { logo_url?: string | null }).logo_url as string}", "src={skLogo as string}")

# kirim logo saat tetapkan
old = "router.post(`${base}/sk/tetapkan-lomba`, { number, date, signer_name: signer, signer_position: position, confirm: true } as any, {"
s = rep1(s, old, "router.post(`${base}/sk/tetapkan-lomba`, { number, date, signer_name: signer, signer_position: position, confirm: true, ...(logoFile ? { logo: logoFile } : {}) } as any, {")

# field upload di form (setelah label Jabatan penandatangan)
i0 = s.find(st)
j = s.find('Jabatan penandatangan *</span>', i0)
assert j != -1 and j - i0 < 12000, 'label jabatan tidak ketemu'
k = s.find('</label>', j)
assert k != -1 and k - j < 1500, 'penutup label jabatan tidak ketemu'
k += len('</label>')
FIELD = """
                            {!locked && (
                                <div className="sm:col-span-2 lg:col-span-4">
                                    <span className={`${lbl} !normal-case !tracking-normal`}>Logo kop SK (opsional)</span>
                                    <div className="mt-1 flex flex-wrap items-center gap-3">
                                        {skLogo
                                            ? <img src={skLogo} alt="Logo SK" className="h-14 w-14 rounded-xl border border-slate-200 bg-white object-contain p-1" />
                                            : <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-dashed border-slate-300 text-[10px] font-bold text-slate-400">Logo</div>}
                                        <input
                                            type="file"
                                            accept="image/png,image/jpeg,image/webp"
                                            className="block max-w-xs text-sm file:mr-3 file:cursor-pointer file:rounded-xl file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-bold file:text-indigo-700"
                                            onChange={(e) => {
                                                const f = e.target.files?.[0] ?? null;
                                                setLogoFile(f);
                                                setLogoPrev(f ? URL.createObjectURL(f) : null);
                                            }}
                                        />
                                        {logoFile && <button type="button" onClick={() => { setLogoFile(null); setLogoPrev(null); }} className="text-xs font-bold text-rose-600">Batalkan logo baru</button>}
                                        <span className="text-xs text-slate-500">PNG/JPG/WEBP, maks. 2 MB. Kosongkan untuk memakai logo lembaga.</span>
                                    </div>
                                </div>
                            )}"""
s = s[:k] + FIELD + s[k:]

# tabel lampiran: data aplikasi (kode peserta, nama, sekolah/lembaga, nilai akhir)
t0 = s.find('<table className="mt-5 w-full border-collapse border border-slate-900 text-[13px]">')
assert t0 != -1, 'tabel lampiran tidak ketemu'
t1 = s.find('</table>', t0)
assert t1 != -1
t1 += len('</table>')
TABLE = '''<table className="mt-5 w-full border-collapse border border-slate-900 text-[12.5px]">
                                <thead>
                                    <tr className="bg-slate-200 text-center font-bold uppercase">
                                        <th className="w-9 border border-slate-900 px-1.5 py-2">No</th>
                                        <th className="w-24 border border-slate-900 px-1.5 py-2">Kategori</th>
                                        <th className="w-14 border border-slate-900 px-1.5 py-2">Juara</th>
                                        <th className="w-32 border border-slate-900 px-1.5 py-2">Kode peserta</th>
                                        <th className="border border-slate-900 px-1.5 py-2">Nama</th>
                                        <th className="border border-slate-900 px-1.5 py-2">Sekolah / lembaga</th>
                                        <th className="w-20 border border-slate-900 px-1.5 py-2">Nilai akhir</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sk.categories.map((c, i) => c.rows.length === 0 ? (
                                        <tr key={`c${c.id}`}>
                                            <td className="border border-slate-900 px-1.5 py-1.5 text-center">{i + 1}</td>
                                            <td className="border border-slate-900 px-1.5 py-1.5 text-center">{c.name || sk.title}</td>
                                            <td colSpan={5} className="border border-slate-900 px-1.5 py-1.5 text-center italic">Belum ada peringkat yang bisa dicantumkan.</td>
                                        </tr>
                                    ) : c.rows.map((r, k) => (
                                        <tr key={`c${c.id}-${k}`}>
                                            {k === 0 && <td rowSpan={c.rows.length} className="border border-slate-900 px-1.5 py-1.5 text-center align-middle">{i + 1}</td>}
                                            {k === 0 && <td rowSpan={c.rows.length} className="border border-slate-900 px-1.5 py-1.5 text-center align-middle">{c.name || sk.title}</td>}
                                            <td className="border border-slate-900 px-1.5 py-1.5 text-center font-bold">{r.rank}{r.shared ? ' =' : ''}</td>
                                            <td className="border border-slate-900 px-1.5 py-1.5 text-center font-mono text-[11.5px]">{r.code}</td>
                                            <td className="border border-slate-900 px-1.5 py-1.5">{r.name || '-'}</td>
                                            <td className="border border-slate-900 px-1.5 py-1.5">{r.school || '-'}</td>
                                            <td className="border border-slate-900 px-1.5 py-1.5 text-right font-semibold">{lsNf(r.score)}</td>
                                        </tr>
                                    )))}
                                </tbody>
                            </table>'''
s = s[:t0] + TABLE + s[t1:]
open(TSX, 'w').write(s)
print('ok: tahap 3 (logo upload, garis dihapus, tabel data aplikasi)')
print('>>> jalankan: php artisan migrate')
