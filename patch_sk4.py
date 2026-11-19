import sys, os
TSX = 'resources/js/pages/panel/events/penilaian.tsx'
PHP = 'app/Http/Controllers/Panel/JudgingController.php'
MIG = 'database/migrations'
if len(sys.argv) > 1: TSX = sys.argv[1]
if len(sys.argv) > 2: PHP = sys.argv[2]
if len(sys.argv) > 3: MIG = sys.argv[3]

def rep1(s, old, new, what=''):
    assert s.count(old) == 1, f'{what or old[:70]!r}: {s.count(old)}x'
    return s.replace(old, new)

# ================= 2. Controller =================
p = open(PHP).read()
p = rep1(p, "    private function overallData(Event $event): array\n",
"""    private function overallData(Event $event): array
    {
        $d = $this->overallDataBase($event);
        $row = DB::table('judging_overall')->where('event_id', $event->id)->first();
        $lp = (string) (($row->logo_path ?? null) ?: ($event->institution->logo_path ?? ''));
        $d['logo_url'] = $lp !== '' ? '/storage/'.ltrim($lp, '/') : null;

        return $d;
    }

    private function overallDataBase(Event $event): array
""", 'overallData')
sig = "    public function finalizeOverall(Request $request, Event $event): RedirectResponse\n    {\n"
p = rep1(p, sig, sig + """        if ($request->hasFile('logo')) {
            $request->validate(['logo' => 'image|mimes:png,jpg,jpeg,webp|max:2048']);
            $this->guard($request, $event);
            $skLogoPath = $request->file('logo')->store('sk-logo', 'public');
            DB::table('judging_overall')->where('event_id', $event->id)->whereNull('finalized_at')->update(['logo_path' => $skLogoPath]);
        }
""", 'finalizeOverall')

# ================= 3. Frontend (SK event induk) =================
s = open(TSX).read()

st = "    const [position, setPosition] = useState(ov.letter?.signer_position ?? '');\n"
assert s.count(st) == 1, 'state position SK induk'
s = s.replace(st, st + """    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPrev, setLogoPrev] = useState<string | null>(null);
    const skLogo = logoPrev ?? (ov as { logo_url?: string | null }).logo_url ?? null;
""")
s = rep1(s, "router.post(`${base}/juara-umum/tetapkan`, { number, date, signer_name: signer, signer_position: position, confirm: true } as any, {",
         "router.post(`${base}/juara-umum/tetapkan`, { number, date, signer_name: signer, signer_position: position, confirm: true, ...(logoFile ? { logo: logoFile } : {}) } as any, {", 'submit induk')

i0 = s.find(st)
j = s.find('Jabatan penandatangan *</span>', i0)
assert j != -1 and j - i0 < 12000, 'label jabatan induk'
k = s.find('</label>', j); assert k != -1 and k - j < 1500
k += len('</label>')
FIELD = """
                            <div className="md:col-span-2 xl:col-span-4">
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
                            </div>"""
s = s[:k] + FIELD + s[k:]

# --- pratinjau SK induk -> format baru ---
mk = 'Penetapan hasil lomba dan juara umum {title}'
assert s.count(mk) == 1, 'judul SK induk'
a = s.rfind('<div id="sk-print"', 0, s.find(mk))
assert a != -1
endmark = '\n                </div>\n            </div>\n'
e = s.find(endmark, a)
assert e != -1, 'akhir sk-print induk'
e += len('\n                </div>\n')

PAPER = 'rounded-2xl bg-white p-8 shadow-sm sm:p-12 sm:min-h-[1086px] print:min-h-0 print:rounded-none print:p-0 print:shadow-none'
SIG = '''<div className="ml-auto mt-10 w-1/2 text-center">
                            <div>Ditetapkan pada tanggal <b>{date ? lsDate(date) : '…'}</b></div>
                            <div className="mt-1">{position.trim() ? position : <LsMark t="Jabatan belum diisi" />},</div>
                            <div className="h-20" />
                            <div className="font-bold underline">{signer.trim() ? signer : <LsMark t="Nama penandatangan belum diisi" />}</div>
                        </div>'''
TH = 'border border-slate-900 px-1.5 py-2'
TD = 'border border-slate-900 px-1.5 py-1.5'
NEW = '''<div id="sk-print" className="mx-auto max-w-3xl space-y-8 font-serif text-[14px] leading-relaxed text-slate-900 print:space-y-0">
                    {/* ===== Halaman 1: Surat Keputusan ===== */}
                    <div className="''' + PAPER + '''">
                        <div className="pb-1 text-center">
                            {skLogo
                                ? <img src={skLogo} alt={ov.institution || 'Logo lembaga'} className="mx-auto h-24 w-auto max-w-full object-contain" />
                                : <div className="text-lg font-bold uppercase">{ov.institution || 'Nama lembaga'}</div>}
                        </div>
                        <div className="mt-6 text-center">
                            <div className="text-lg font-bold">SURAT KEPUTUSAN</div>
                            <div>Nomor: {number.trim() ? number : <LsMark t="Nomor SK belum diisi" />}</div>
                            <div className="mt-4 text-xs font-bold uppercase tracking-widest text-slate-500">Tentang</div>
                            <div className="font-bold uppercase">Penetapan juara dan juara umum {title}</div>
                        </div>

                        <div className="mt-6 grid grid-cols-[6.5rem_1fr] gap-y-3">
                            <div>Menimbang</div>
                            <ol className="list-decimal space-y-1 pl-5 text-justify">
                                <li>Bahwa seluruh lomba pada {title} telah dilaksanakan melalui sistem SIMPLE dan seluruh penilaian telah diselesaikan oleh juri;</li>
                                <li>Bahwa hasil penilaian telah direkapitulasi dan diperiksa oleh panitia, sehingga perlu ditetapkan dengan Surat Keputusan.</li>
                            </ol>
                            <div>Mengingat</div>
                            <ol className="list-decimal space-y-1 pl-5 text-justify">
                                <li>Rekapitulasi nilai seluruh lomba pada {title} yang tersimpan pada sistem SIMPLE;</li>
                                <li>Hasil pemeriksaan oleh panitia penyelenggara.</li>
                            </ol>
                        </div>

                        <p className="mt-6 text-center font-bold">MEMUTUSKAN</p>
                        <div className="mt-2 grid grid-cols-[6.5rem_1.25rem_1fr] gap-y-2">
                            <div>Menetapkan</div><div>:</div>
                            <div className="text-justify font-bold uppercase">Keputusan tentang penetapan juara dan juara umum {title};</div>
                            <div>Kesatu</div><div>:</div>
                            <div className="text-justify">Hasil dan peringkat tiap lomba ditetapkan sebagaimana tercantum dalam Lampiran bagian A keputusan ini;</div>
                            <div>Kedua</div><div>:</div>
                            <div className="text-justify">Juara umum {title} ditetapkan berdasarkan akumulasi poin peringkat dari seluruh kategori, sebagaimana tercantum dalam Lampiran bagian B keputusan ini;</div>
                            <div>Ketiga</div><div>:</div>
                            <div className="text-justify">Keputusan ini berlaku sejak tanggal ditetapkan, dan apabila terdapat kekeliruan akan diperbaiki sebagaimana mestinya.</div>
                        </div>

                        ''' + SIG + '''
                    </div>

                    {/* ===== Halaman 2: Lampiran ===== */}
                    <div className="break-before-page ''' + PAPER + '''">
                        <div className="pb-1">
                            <p className="font-bold">LAMPIRAN SURAT KEPUTUSAN</p>
                            <p className="font-bold">NOMOR {number.trim() ? number : <LsMark t="Nomor SK belum diisi" />}</p>
                        </div>
                        <div className="mt-6 text-center font-bold uppercase">
                            <div>Penetapan juara dan juara umum {title}</div>
                            {ov.institution && <div>{ov.institution}</div>}
                        </div>

                        <p className="mt-5 font-bold">A. Hasil per lomba</p>
                        {groups.length === 0 && <p className="mt-2 rounded bg-amber-100 px-3 py-2 text-center text-[13px] text-amber-900">Belum ada kategori yang bisa dicantumkan.</p>}
                        {groups.map((g, gi) => (
                            <div key={g.sub_id} className="mt-3">
                                <p className="font-semibold">{gi + 1}. {g.sub}</p>
                                <table className="mt-1 w-full border-collapse border border-slate-900 text-[12.5px]">
                                    <thead>
                                        <tr className="bg-slate-200 text-center font-bold uppercase">
                                            <th className="w-9 ''' + TH + '''">No</th>
                                            <th className="w-24 ''' + TH + '''">Kategori</th>
                                            <th className="w-14 ''' + TH + '''">Juara</th>
                                            <th className="w-32 ''' + TH + '''">Kode peserta</th>
                                            <th className="''' + TH + '''">Nama</th>
                                            <th className="''' + TH + '''">Sekolah / lembaga</th>
                                            <th className="w-20 ''' + TH + '''">Nilai akhir</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {g.categories.map((x, i) => x.rows.length === 0 ? (
                                            <tr key={`x${x.id}`}>
                                                <td className="''' + TD + ''' text-center">{i + 1}</td>
                                                <td className="''' + TD + ''' text-center">{x.name || g.sub}</td>
                                                <td colSpan={5} className="''' + TD + ''' text-center italic">Belum ada peringkat yang bisa dicantumkan.</td>
                                            </tr>
                                        ) : x.rows.map((r, k) => (
                                            <tr key={`x${x.id}-${k}`}>
                                                {k === 0 && <td rowSpan={x.rows.length} className="''' + TD + ''' text-center align-middle">{i + 1}</td>}
                                                {k === 0 && <td rowSpan={x.rows.length} className="''' + TD + ''' text-center align-middle">{x.name || g.sub}</td>}
                                                <td className="''' + TD + ''' text-center font-bold">{r.rank}{r.shared ? ' =' : ''}</td>
                                                <td className="''' + TD + ''' text-center font-mono text-[11.5px]">{r.code}</td>
                                                <td className="''' + TD + '''">{r.name || '-'}</td>
                                                <td className="''' + TD + '''">{r.school || '-'}</td>
                                                <td className="''' + TD + ''' text-right font-semibold">{lsNf(r.score)}</td>
                                            </tr>
                                        )))}
                                    </tbody>
                                </table>
                            </div>
                        ))}

                        <p className="mt-6 font-bold">B. Juara umum {title}</p>
                        {winners.length === 0
                            ? <p className="mt-2 rounded bg-amber-100 px-3 py-2 text-center text-[13px] text-amber-900">Belum ada juara umum yang bisa dicantumkan.</p>
                            : (
                                <table className="mt-2 w-full border-collapse border border-slate-900 text-[12.5px]">
                                    <thead>
                                        <tr className="bg-slate-200 text-center font-bold uppercase">
                                            <th className="w-9 ''' + TH + '''">No</th>
                                            <th className="w-28 ''' + TH + '''">Juara umum</th>
                                            <th className="''' + TH + '''">Sekolah / lembaga</th>
                                            <th className="w-24 ''' + TH + '''">Total poin</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {winners.map((w, i) => (
                                            <tr key={i}>
                                                <td className="''' + TD + ''' text-center">{i + 1}</td>
                                                <td className="''' + TD + ''' text-center font-bold">{w.rank}{w.shared ? ' =' : ''}</td>
                                                <td className="''' + TD + '''">{w.school}</td>
                                                <td className="''' + TD + ''' text-right font-semibold">{num(w.points)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}

                        ''' + SIG + '''
                    </div>
                </div>
'''
s = s[:a] + NEW + s[e:]
open(PHP, 'w').write(p)
open(TSX, 'w').write(s)
# ================= 1. Migrasi =================
mig = os.path.join(MIG, '2026_11_19_190100_add_logo_to_judging_overall.php')
if not os.path.exists(mig):
    open(mig, 'w').write('''<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('judging_overall') && ! Schema::hasColumn('judging_overall', 'logo_path')) {
            Schema::table('judging_overall', fn (Blueprint $t) => $t->string('logo_path')->nullable());
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('judging_overall', 'logo_path')) {
            Schema::table('judging_overall', fn (Blueprint $t) => $t->dropColumn('logo_path'));
        }
    }
};
''')

print('ok: SK event induk diganti (logo, 2 halaman, lampiran A/B)')
print('>>> jalankan: php artisan migrate')
