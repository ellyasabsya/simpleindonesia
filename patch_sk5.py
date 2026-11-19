import sys
TSX = 'resources/js/pages/panel/events/penilaian.tsx'
PHP = 'app/Http/Controllers/Panel/JudgingController.php'
if len(sys.argv) > 1: TSX = sys.argv[1]
if len(sys.argv) > 2: PHP = sys.argv[2]

def rep1(s, old, new, what=''):
    assert s.count(old) == 1, f'{what or old[:70]!r}: {s.count(old)}x'
    return s.replace(old, new)

def segment(p, start_marker):
    a = p.find(start_marker)
    assert a != -1 and p.count(start_marker) == 1, f'{start_marker}: tidak unik/tidak ada'
    n = [x for x in (p.find('\n    private function ', a + 10), p.find('\n    public function ', a + 10)) if x != -1]
    b = min(n) if n else len(p)
    return a, b

# ================= PHP =================
p = open(PHP).read()

HELPERS = '''    /** Nama tim per pendaftaran. Kosong = peserta perorangan. */
    private function teamNames(array $regIds): array
    {
        $ids = array_values(array_filter(array_map('intval', $regIds)));
        if (! $ids || ! \\Illuminate\\Support\\Facades\\Schema::hasTable('registration_teams')) {
            return [];
        }

        return DB::table('registration_teams')->whereIn('event_registration_id', $ids)->orderBy('id')
            ->get(['event_registration_id', 'name'])->unique('event_registration_id')
            ->mapWithKeys(fn ($t) => [(int) $t->event_registration_id => trim((string) $t->name)])
            ->filter()->all();
    }

    /** Tandai peserta tim: nama tim menggantikan nama peserta, dan baris diberi flag team. */
    private function markTeams(int $eventId, array $rows): array
    {
        if (DB::table('events')->where('id', $eventId)->value('registration_method') === 'ticket') {
            return $rows;
        }
        $map = $this->teamNames(array_column($rows, 'id'));
        foreach ($rows as &$r) {
            $tn = $map[(int) ($r['id'] ?? 0)] ?? '';
            $r['team'] = $tn !== '';
            if ($r['team']) {
                $r['name'] = $tn;
            }
        }
        unset($r);

        return $rows;
    }

'''
m = "    private function skLombaData(Event $event): array\n"
p = rep1(p, m, HELPERS + m, 'skLombaData def')

# --- skLombaData ---
a, b = segment(p, "    private function skLombaData(Event $event): array\n")
seg = p[a:b]
seg = rep1(seg, "            $ranked = [];\n            $table = [];\n",
           "            $useRows = $this->markTeams($event->id, $useRows);\n            $ranked = [];\n            $table = [];\n", 'sk: ranked/table')
seg = rep1(seg, "$table[] = [\n", "$table[] = [\n                    'team' => ! empty($r['team']),\n", 'sk: $table')
seg = rep1(seg, "$ranked[] = [\n", "$ranked[] = [\n                        'team' => ! empty($r['team']),\n", 'sk: $ranked')
p = p[:a] + seg + p[b:]

# --- overallDataBase ---
a, b = segment(p, "    private function overallDataBase(Event $event): array\n")
seg = p[a:b]
regs = "                $regs = DB::table('event_registrations')->whereIn('id', array_column($useRows, 'id'))"
seg = rep1(seg, regs, "                $useRows = $this->markTeams((int) $child->id, $useRows);\n" + regs, 'overall: regs')
seg = rep1(seg, "$tbl[] = [\n", "$tbl[] = [\n                        'team' => ! empty($x['team']),\n", 'overall: $tbl')
seg = rep1(seg, "$rnk[] = [\n", "$rnk[] = [\n                            'team' => ! empty($x['team']),\n", 'overall: $rnk')
p = p[:a] + seg + p[b:]

# ================= TSX =================
s = open(TSX).read()
COMP = '''/** Tabel lampiran SK: header nama menyesuaikan perorangan/tim, kolom sekolah tampil hanya bila ada datanya. */
function SkLampiranTable({ cats, fallback }: { cats: { id: number; name?: string | null; rows: any[] }[]; fallback: string }) {
    const all = cats.flatMap((c) => c.rows);
    const hasSchool = all.some((r) => String(r.school ?? '').trim() !== '');
    const teams = all.filter((r) => r.team).length;
    const nameHead = all.length > 0 && teams === all.length ? 'Nama tim' : teams > 0 ? 'Nama peserta / tim' : 'Nama peserta';
    const th = 'border border-slate-900 px-1.5 py-2';
    const td = 'border border-slate-900 px-1.5 py-1.5';
    return (
        <table className="mt-1 w-full border-collapse border border-slate-900 text-[12.5px]">
            <thead>
                <tr className="bg-slate-200 text-center font-bold uppercase">
                    <th className={`w-9 ${th}`}>No</th>
                    <th className={`w-24 ${th}`}>Kategori</th>
                    <th className={`w-14 ${th}`}>Juara</th>
                    <th className={`w-32 ${th}`}>Kode peserta</th>
                    <th className={th}>{nameHead}</th>
                    {hasSchool && <th className={th}>Sekolah / institusi</th>}
                    <th className={`w-20 ${th}`}>Nilai akhir</th>
                </tr>
            </thead>
            <tbody>
                {cats.map((c, i) => c.rows.length === 0 ? (
                    <tr key={`c${c.id}`}>
                        <td className={`${td} text-center`}>{i + 1}</td>
                        <td className={`${td} text-center`}>{c.name || fallback}</td>
                        <td colSpan={hasSchool ? 5 : 4} className={`${td} text-center italic`}>Belum ada peringkat yang bisa dicantumkan.</td>
                    </tr>
                ) : c.rows.map((r, k) => (
                    <tr key={`c${c.id}-${k}`}>
                        {k === 0 && <td rowSpan={c.rows.length} className={`${td} text-center align-middle`}>{i + 1}</td>}
                        {k === 0 && <td rowSpan={c.rows.length} className={`${td} text-center align-middle`}>{c.name || fallback}</td>}
                        <td className={`${td} text-center font-bold`}>{r.rank}{r.shared ? ' =' : ''}</td>
                        <td className={`${td} text-center font-mono text-[11.5px]`}>{r.code}</td>
                        <td className={td}>{r.name || '-'}</td>
                        {hasSchool && <td className={td}>{String(r.school ?? '').trim() || '-'}</td>}
                        <td className={`${td} text-right font-semibold`}>{lsNf(r.score)}</td>
                    </tr>
                )))}
            </tbody>
        </table>
    );
}

'''
s = rep1(s, 'function ParentSK(', COMP + 'function ParentSK(', 'ParentSK def')

def swap_table(s, start, new):
    assert s.count(start) == 1, f'{start[:60]!r}: {s.count(start)}x'
    t0 = s.find(start)
    t1 = s.find('</table>', t0)
    assert t1 != -1
    return s[:t0] + new + s[t1 + len('</table>'):]

s = swap_table(s, '<table className="mt-5 w-full border-collapse border border-slate-900 text-[12.5px]">',
               '<SkLampiranTable cats={sk.categories} fallback={sk.title} />')
# tabel grup SK induk: awalnya 'mt-1 w-full' di dalam g.categories (bukan komponen di atas)
idx = s.find('<table className="mt-1 w-full border-collapse border border-slate-900 text-[12.5px]">', s.find('{groups.map((g, gi) => ('))
assert idx != -1 and s.count('{groups.map((g, gi) => (') >= 1, 'tabel grup induk tidak ketemu'
end = s.find('</table>', idx)
s = s[:idx] + '<SkLampiranTable cats={g.categories} fallback={g.sub} />' + s[end + len('</table>'):]

open(PHP, 'w').write(p)
open(TSX, 'w').write(s)
print('ok: nama peserta/tim + sekolah/institusi otomatis (SK lomba tunggal & SK induk)')
