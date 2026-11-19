import sys
P = 'resources/js/pages/panel/events/penilaian.tsx'
if len(sys.argv) > 1: P = sys.argv[1]
s = open(P).read()

# ---- 1. judul: hilangkan "LOMBA LOMBA" ----
old_t = '<div className="font-bold uppercase">Penetapan hasil lomba {sk.title}</div>'
assert s.count(old_t) == 1, f'judul: {s.count(old_t)}x'
s = s.replace(old_t, '<div className="font-bold uppercase">Penetapan juara {sk.title}</div>')

# ---- 2. badan SK (Menimbang .. tanda tangan) ----
a = s.find('<p className="mt-6"><b>Menimbang:</b> bahwa lomba {sk.title}{onParent}')
assert a != -1 and s.count('bahwa lomba {sk.title}{onParent}') == 1, 'awal Menimbang tidak ketemu'
endmark = '<div className="font-bold underline">{signer.trim() ? signer : <LsMark t="Nama penandatangan belum diisi" />}</div>\n                    </div>\n'
b = s.find(endmark, a)
assert b != -1, 'akhir tanda tangan tidak ketemu'
b += len(endmark)

SIG = '''<div className="ml-auto mt-8 w-1/2 text-center">
                        <div>Ditetapkan pada tanggal <b>{date ? lsDate(date) : '…'}</b></div>
                        <div className="mt-1">{position.trim() ? position : <LsMark t="Jabatan belum diisi" />},</div>
                        <div className="h-20" />
                        <div className="font-bold underline">{signer.trim() ? signer : <LsMark t="Nama penandatangan belum diisi" />}</div>
                    </div>
'''

NEW = '''<p className="mt-5 text-center font-bold uppercase">Dengan rahmat Tuhan Yang Maha Esa</p>
                    <p className="text-center font-bold uppercase">{position.trim() ? position : <LsMark t="Jabatan belum diisi" />}</p>

                    <div className="mt-5 grid grid-cols-[6.5rem_1fr] gap-y-3">
                        <div>Menimbang</div>
                        <ol className="list-decimal space-y-1 pl-5 text-justify">
                            <li>Bahwa untuk menetapkan keseluruhan hasil pelaksanaan lomba {sk.title}{onParent}, dipandang perlu untuk menetapkan para juara;</li>
                            <li>Bahwa penilaian telah diselesaikan oleh seluruh juri dan hasilnya telah diperiksa oleh panitia, sebagaimana tercantum dalam Lampiran Surat Keputusan ini.</li>
                        </ol>
                        <div>Mengingat</div>
                        <ol className="list-decimal space-y-1 pl-5 text-justify">
                            <li>Pedoman dan ketentuan penyelenggaraan lomba {sk.title};</li>
                            <li>Hasil penilaian dewan juri yang telah direkapitulasi dan disimpan pada sistem SIMPLE Indonesia.</li>
                        </ol>
                    </div>

                    <p className="mt-5 text-center font-bold">MEMUTUSKAN</p>
                    <div className="mt-2 grid grid-cols-[6.5rem_1.25rem_1fr] gap-y-2">
                        <div>Menetapkan</div><div>:</div>
                        <div className="text-justify font-bold uppercase">Keputusan {position.trim() ? position : '…'} tentang penetapan juara {sk.title}{sk.parent_title ? ` ${sk.parent_title}` : ''}{sk.institution ? ` ${sk.institution}` : ''};</div>
                        <div>Kesatu</div><div>:</div>
                        <div className="text-justify">Susunan penetapan juara lomba {sk.title} sebagaimana tersebut dalam lampiran keputusan ini;</div>
                        <div>Kedua</div><div>:</div>
                        <div className="text-justify">Menetapkan para peserta sebagaimana tercantum dalam daftar lampiran keputusan ini sebagai juara;</div>
                        <div>Ketiga</div><div>:</div>
                        <div className="text-justify">Segala biaya yang timbul sebagai akibat pelaksanaan keputusan ini dibebankan kepada anggaran penyelenggara dan sumber lain yang sah;</div>
                        <div>Keempat</div><div>:</div>
                        <div className="text-justify">Keputusan ini berlaku mulai tanggal ditetapkan, dengan ketentuan apabila di kemudian hari terdapat kekeliruan dalam keputusan ini maka akan diubah dan diperbaiki sebagaimana mestinya.</div>
                    </div>

                    ''' + SIG + '''
                    <div className="break-before-page mt-12 print:mt-0">
                        <p className="text-[13px] font-bold">LAMPIRAN SURAT KEPUTUSAN {position.trim() ? position.toUpperCase() : '…'}</p>
                        <p className="text-[13px] font-bold">NOMOR {number.trim() ? number : <LsMark t="Nomor SK belum diisi" />}</p>
                        <div className="mt-5 text-center font-bold uppercase">
                            <div>Penetapan juara {sk.title}</div>
                            {sk.parent_title && <div>{sk.parent_title}</div>}
                            {sk.institution && <div>{sk.institution}</div>}
                        </div>

                        {sk.categories.length === 0 && <p className="mt-3 rounded bg-amber-100 px-3 py-2 text-center text-[13px] text-amber-900">Belum ada kategori yang bisa dicantumkan.</p>}
                        {sk.categories.length > 0 && (
                            <table className="mt-4 w-full border-collapse border border-slate-900 text-[13px]">
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

                        ''' + SIG.replace('\n                        ', '\n                            ').replace('<div className="ml-auto', '<div className="ml-auto', 1) + '''                    </div>
'''
s = s[:a] + NEW + s[b:]
open(P, 'w').write(s)
print('ok: SK lomba tunggal diganti')
