import sys
TSX = 'resources/js/pages/panel/events/penilaian.tsx'
PHP = 'app/Http/Controllers/Panel/JudgingController.php'
if len(sys.argv) > 1: TSX = sys.argv[1]
if len(sys.argv) > 2: PHP = sys.argv[2]

# ================= PHP: kirim logo lembaga ke SK =================
if PHP != '-':
    p = open(PHP).read()
    old = "        $head = ['institution' => $institution, 'title' => $event->title, 'parent_title' => $parentTitle];\n"
    assert p.count(old) == 1, f'PHP head: {p.count(old)}x'
    new = ("        $logoPath = (string) ($event->institution->logo_path ?? '');\n"
           "        $head = ['institution' => $institution, 'title' => $event->title, 'parent_title' => $parentTitle,\n"
           "            'logo_url' => $logoPath !== '' ? '/storage/'.ltrim($logoPath, '/') : null];\n")
    p = p.replace(old, new)
    open(PHP, 'w').write(p)

# ================= TSX: SK 2 lembar =================
s = open(TSX).read()
marker = 'Bahwa untuk menetapkan keseluruhan hasil pelaksanaan lomba {sk.title}{onParent}'
assert s.count(marker) == 1, 'hasil patch pertama tidak ditemukan (sudah menjalankan patch_sk.py?)'
m = s.find(marker)
a = s.rfind('<div id="sk-print"', 0, m)
assert a != -1, 'awal sk-print tidak ketemu'
endmark = '\n                </div>\n            </div>\n'
e = s.find(endmark, m)
assert e != -1, 'akhir sk-print tidak ketemu'
e += len('\n                </div>\n')   # sampai penutup sk-print (termasuk)

PAPER = 'rounded-2xl bg-white p-8 shadow-sm sm:p-12 sm:min-h-[1086px] print:min-h-0 print:rounded-none print:p-0 print:shadow-none'
SIG = '''<div className="ml-auto mt-10 w-1/2 text-center">
                            <div>Ditetapkan pada tanggal <b>{date ? lsDate(date) : '…'}</b></div>
                            <div className="mt-1">{position.trim() ? position : <LsMark t="Jabatan belum diisi" />},</div>
                            <div className="h-20" />
                            <div className="font-bold underline">{signer.trim() ? signer : <LsMark t="Nama penandatangan belum diisi" />}</div>
                        </div>'''
NEW = '''<div id="sk-print" className="mx-auto max-w-3xl space-y-8 font-serif text-[14px] leading-relaxed text-slate-900 print:space-y-0">
                    {/* ===== Halaman 1: Surat Keputusan ===== */}
                    <div className="''' + PAPER + '''">
                        <div className="border-b-2 border-slate-900 pb-3 text-center">
                            {(sk as { logo_url?: string | null }).logo_url
                                ? <img src={(sk as { logo_url?: string | null }).logo_url as string} alt={sk.institution || 'Logo lembaga'} className="mx-auto h-24 w-auto max-w-full object-contain" />
                                : <div className="text-lg font-bold uppercase">{sk.institution || 'Nama lembaga'}</div>}
                        </div>
                        <div className="mt-6 text-center">
                            <div className="text-lg font-bold">SURAT KEPUTUSAN</div>
                            <div>Nomor: {number.trim() ? number : <LsMark t="Nomor SK belum diisi" />}</div>
                            <div className="mt-4 text-xs font-bold uppercase tracking-widest text-slate-500">Tentang</div>
                            <div className="font-bold uppercase">Penetapan juara {sk.title}</div>
                            {sk.parent_title && <div className="font-bold uppercase">{sk.parent_title}</div>}
                        </div>

                        <div className="mt-6 grid grid-cols-[6.5rem_1fr] gap-y-3">
                            <div>Menimbang</div>
                            <ol className="list-decimal space-y-1 pl-5 text-justify">
                                <li>Bahwa lomba {sk.title}{onParent} telah dilaksanakan melalui sistem SIMPLE dan seluruh penilaian telah diselesaikan oleh juri;</li>
                                <li>Bahwa hasil penilaian telah direkapitulasi dan diperiksa oleh panitia, sehingga perlu ditetapkan dengan Surat Keputusan.</li>
                            </ol>
                            <div>Mengingat</div>
                            <ol className="list-decimal space-y-1 pl-5 text-justify">
                                <li>Rekapitulasi nilai lomba {sk.title} yang tersimpan pada sistem SIMPLE;</li>
                                <li>Hasil pemeriksaan oleh panitia penyelenggara.</li>
                            </ol>
                        </div>

                        <p className="mt-6 text-center font-bold">MEMUTUSKAN</p>
                        <div className="mt-2 grid grid-cols-[6.5rem_1.25rem_1fr] gap-y-2">
                            <div>Menetapkan</div><div>:</div>
                            <div className="text-justify font-bold uppercase">Keputusan tentang penetapan juara {sk.title}{sk.parent_title ? ` ${sk.parent_title}` : ''};</div>
                            <div>Kesatu</div><div>:</div>
                            <div className="text-justify">Hasil dan peringkat lomba {sk.title} ditetapkan sebagaimana tercantum dalam lampiran keputusan ini;</div>
                            <div>Kedua</div><div>:</div>
                            <div className="text-justify">Peringkat ditetapkan berdasarkan hasil rekapitulasi nilai yang telah disimpan pada sistem;</div>
                            <div>Ketiga</div><div>:</div>
                            <div className="text-justify">Keputusan ini berlaku sejak tanggal ditetapkan, dan apabila terdapat kekeliruan akan diperbaiki sebagaimana mestinya.</div>
                        </div>

                        ''' + SIG + '''
                    </div>

                    {/* ===== Halaman 2: Lampiran ===== */}
                    <div className="break-before-page ''' + PAPER + '''">
                        <div className="border-b-2 border-slate-900 pb-3">
                            <p className="font-bold">LAMPIRAN SURAT KEPUTUSAN</p>
                            <p className="font-bold">NOMOR {number.trim() ? number : <LsMark t="Nomor SK belum diisi" />}</p>
                        </div>
                        <div className="mt-6 text-center font-bold uppercase">
                            <div>Penetapan juara {sk.title}</div>
                            {sk.parent_title && <div>{sk.parent_title}</div>}
                            {sk.institution && <div>{sk.institution}</div>}
                        </div>

                        {sk.categories.length === 0 && <p className="mt-4 rounded bg-amber-100 px-3 py-2 text-center text-[13px] text-amber-900">Belum ada kategori yang bisa dicantumkan.</p>}
                        {sk.categories.length > 0 && (
                            <table className="mt-5 w-full border-collapse border border-slate-900 text-[13px]">
                                <thead>
                                    <tr className="bg-slate-200 text-center font-bold uppercase">
                                        <th className="w-10 border border-slate-900 px-2 py-2">No</th>
                                        <th className="w-36 border border-slate-900 px-2 py-2">Kategori</th>
                                        <th className="w-16 border border-slate-900 px-2 py-2">Juara</th>
                                        <th className="border border-slate-900 px-2 py-2">Nama</th>
                                        <th className="border border-slate-900 px-2 py-2">Asal sekolah / lembaga</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sk.categories.map((c, i) => c.rows.length === 0 ? (
                                        <tr key={`c${c.id}`}>
                                            <td className="border border-slate-900 px-2 py-1.5 text-center">{i + 1}</td>
                                            <td className="border border-slate-900 px-2 py-1.5 text-center">{c.name || sk.title}</td>
                                            <td colSpan={3} className="border border-slate-900 px-2 py-1.5 text-center italic">Belum ada peringkat yang bisa dicantumkan.</td>
                                        </tr>
                                    ) : c.rows.map((r, k) => (
                                        <tr key={`c${c.id}-${k}`}>
                                            {k === 0 && <td rowSpan={c.rows.length} className="border border-slate-900 px-2 py-1.5 text-center align-middle">{i + 1}</td>}
                                            {k === 0 && <td rowSpan={c.rows.length} className="border border-slate-900 px-2 py-1.5 text-center align-middle">{c.name || sk.title}</td>}
                                            <td className="border border-slate-900 px-2 py-1.5 text-center">{r.rank}{r.shared ? ' =' : ''}</td>
                                            <td className="border border-slate-900 px-2 py-1.5">{r.name || '-'}</td>
                                            <td className="border border-slate-900 px-2 py-1.5">{r.school || '-'}</td>
                                        </tr>
                                    )))}
                                </tbody>
                            </table>
                        )}

                        ''' + SIG + '''
                    </div>
                </div>
'''
s = s[:a] + NEW + s[e:]
open(TSX, 'w').write(s)
print('ok: SK 2 halaman + logo')
