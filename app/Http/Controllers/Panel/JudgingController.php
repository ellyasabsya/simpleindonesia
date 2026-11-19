<?php

namespace App\Http\Controllers\Panel;

use App\Models\Event;
use App\Support\Judging;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Response;

class JudgingController extends EventScopedController
{
    private function guard(Request $request, Event $event): void
    {
        $inst = $request->attributes->get('institution');
        abort_unless($inst && $event->institution_id === $inst->id, 404);
    }

    private function judgeOwned(Event $event, int $id): void
    {
        abort_unless(DB::table('judges')->where('id', $id)->where('event_id', $event->id)->exists(), 404);
    }

    /** Kategori yang sedang diatur: dari ?kategori= atau category_id di form; selalu divalidasi terhadap kategori event ini. */
    private function cat(Request $request, Event $event): int
    {
        $ids = Judging::categoryIds($event->id);
        $raw = $request->input('kategori', $request->input('category_id'));
        if ($raw === null || $raw === '') {
            return $ids[0];
        }
        $want = (int) $raw;
        abort_unless(in_array($want, $ids, true), 404);

        return $want;
    }

    private function catName(Event $event, int $cid): string
    {
        foreach (Judging::categories($event->id) as $c) {
            if ($c['id'] === $cid) {
                return $c['name'];
            }
        }

        return '';
    }

    public function index(Request $request, Event $event): Response
    {
        $this->guard($request, $event);

        // patch-264: induk menampilkan halaman Penilaian sub-event terpilih (?sub=ID), atau Juara umum & SK (?sub=umum).
        $frame = null;
        $kids = collect();
        if ($event->parent_id === null && $event->children()->exists()) {
            $kids = $event->children()->orderBy('id')->get();
            $pick = (string) $request->input('sub', '');
            $current = (int) (optional($kids->firstWhere('id', (int) $pick))->id ?? $kids->first()->id); // patch-267: tab Juara umum & SK dihapus
            $frame = [
                'parent' => $event,
                'current' => $current,
                'bar' => [
                    'base' => "/panel/event/{$event->id}/penilaian",
                    'current' => $current,
                    'subs' => $kids->map(fn ($k) => ['id' => (int) $k->id, 'title' => $k->title])->values()->all(),
                ],
            ];
        }

        if ($frame !== null && $frame['current'] === 'umum') {
            $subs = $event->children()->get()->map(function ($c) {
                $cats = Judging::categories($c->id);
                $approved = 0;
                $criteria = 0;
                $judges = 0;
                $parts = 0;
                foreach ($cats as $k) {
                    $approved += Judging::settings($c->id, $k['id'])->enabled ? 1 : 0;
                    $criteria += Judging::criteria($c->id, $k['id'])->count();
                    $judges += DB::table('judges')->where('event_id', $c->id)->where('category_id', $k['id'])->where('active', 1)->count();
                    $parts += count(Judging::participants($c->id, $k['id']));
                }

                return [
                    'id' => $c->id,
                    'title' => $c->title,
                    'categories' => count($cats),
                    'approved' => $approved,
                    'criteria' => $criteria,
                    'judges' => $judges,
                    'participants' => $parts,
                    'system' => $this->systemOf($c),
                ];
            })->values();

            return $this->render('panel/events/penilaian', $event, ['isParent' => true, 'subs' => $subs, 'parentBar' => $frame['bar']]);
        }

        // patch-264: sub-event terpilih diperlakukan seperti halaman sub-event, di dalam menu induk.
        $parentEvent = null;
        if ($frame !== null) {
            $parentEvent = $frame['parent'];
            $event = $kids->firstWhere('id', $frame['current']);
        }

        $cid = $this->cat($request, $event);
        $s = Judging::settings($event->id, $cid);
        $crit = Judging::criteria($event->id, $cid);
        $judgeRows = DB::table('judges')->where('event_id', $event->id)->where('category_id', $cid)->orderBy('id')->get();
        $judges = $judgeRows->map(fn ($j) => [
            'id' => (int) $j->id,
            'name' => $j->name,
            'contact' => $j->contact,
            'active' => (bool) $j->active,
            'url' => url('/juri/'.$j->token),
            'done' => Judging::doneBy((int) $j->id, Judging::leaves($event->id, $cid)->count(), Judging::leaves($event->id, $cid)->pluck('id')->all()),
        ])->values();

        $categories = collect(Judging::categories($event->id))->map(fn ($c) => $c + [
            'approved' => (bool) Judging::settings($event->id, $c['id'])->enabled,
            'participants' => count(Judging::participants($event->id, $c['id'])),
            'judges' => (int) DB::table('judges')->where('event_id', $event->id)->where('category_id', $c['id'])->where('active', 1)->count(),
            'need' => (int) Judging::settings($event->id, $c['id'])->judge_count,
        ])->values();

        $siblings = $event->parent_id
            ? DB::table('events')->where('parent_id', $event->parent_id)->orderBy('id')->get(['id', 'title'])->map(fn ($e) => ['id' => (int) $e->id, 'title' => $e->title, 'approved' => Judging::allApproved((int) $e->id)])->values()
            : [];

        return $this->render('panel/events/penilaian', $event, [
            'isParent' => false, 'isSub' => $event->parent_id !== null,
            'parentBar' => $frame['bar'] ?? null,
            'eventNav' => $this->nav($parentEvent ?? $event),
            'system' => $this->systemOf($event),
            'systemLock' => $this->systemLockReason($event),
            'skLomba' => $this->skLombaData($event),
            'category' => ['id' => $cid, 'name' => $this->catName($event, $cid)],
            'categories' => $categories,
            'settings' => [
                'enabled' => (bool) $s->enabled,
                'scale' => (int) $s->scale,
                'judge_count' => (int) $s->judge_count,
                'avg_decimals' => (int) $s->avg_decimals,
                'rounding' => (string) $s->rounding,
                'deduction_enabled' => (bool) $s->deduction_enabled,
            ],
            'criteria' => $crit->map(fn ($c) => [
                'id' => (int) $c->id, 'name' => $c->name, 'description' => $c->description ?? '', 'weight' => (int) $c->weight,
                'subs' => DB::table('judging_criteria')->where('parent_id', $c->id)->orderBy('sort')->orderBy('id')->get()
                    ->map(fn ($s) => ['id' => (int) $s->id, 'name' => $s->name, 'description' => $s->description ?? '', 'weight' => (int) $s->weight])->values(),
            ])->values(),
            'deductions' => DB::table('judging_deductions')->where('event_id', $event->id)->where('category_id', $cid)->orderBy('sort')->orderBy('id')->get()->map(fn ($d) => ['name' => $d->name, 'points' => (float) $d->points])->values(),
            'judges' => $judges,
            'unassigned' => DB::table('judges')->where('event_id', $event->id)->where('category_id', -1)->orderBy('id')->get()->map(fn ($j) => ['id' => (int) $j->id, 'name' => $j->name, 'contact' => $j->contact])->values(),
            'invites' => DB::table('judge_invitations')->join('users', 'users.id', '=', 'judge_invitations.user_id')->where('judge_invitations.event_id', $event->id)->where('judge_invitations.status', 'menunggu')->orderBy('judge_invitations.id')->get(['judge_invitations.id', 'users.name', 'users.email', 'judge_invitations.status'])->map(fn ($i) => ['id' => (int) $i->id, 'name' => $i->name, 'email' => $i->email, 'status' => $i->status])->values(),
            'inviteBase' => preg_replace('#/penilaian.*$#', '/penilaian', $request->url()),
            'siblings' => $siblings,
            'participants' => count(Judging::participants($event->id, $cid)),
            'ranking' => Judging::ranking($event->id, $cid),
            'hasScores' => DB::table('judging_scores')->whereIn('judge_id', $judgeRows->pluck('id')->all())->exists(),
            'publicationEvent' => $this->publicationEvent($event),
            'recap' => collect(Judging::categories($event->id))->map(fn ($k) => $this->recapData($event, (int) $k['id'], Judging::settings($event->id, (int) $k['id'])))->values()->all(),
            'publications' => collect(Judging::categories($event->id))->map(fn ($k) => [
                'category' => ['id' => (int) $k['id'], 'name' => $k['name']],
            ] + $this->publicationData($event, (int) $k['id'], Judging::settings($event->id, (int) $k['id'])))->values()->all(),
        ]);
    }

    public function toggle(Request $request, Event $event): RedirectResponse
    {
        $this->guard($request, $event);
        $cid = $this->cat($request, $event);
        $open = $request->boolean('open');
        $name = $this->catName($event, $cid);
        $label = count(Judging::categories($event->id)) > 1 || $cid > 0 ? " untuk kategori {$name}" : '';

        if (! $open) {
            if ($this->locked($event, $cid)) {
                return back()->with('error', "Kunci tidak bisa dibuka{$label}: hasil sudah ditetapkan.");
            }
            if ($this->saved($event, $cid)) {
                return back()->with('error', "Kunci tidak bisa dibuka{$label}: hasil sudah disimpan. Klik Edit di Rekap nilai dulu.");
            }
            $ps = DB::table('judging_publication_settings')->where('event_id', $event->id)->where('category_id', $cid)->first();
            $ev = DB::table('judging_event_publication')->where('event_id', $event->id)->first();
            if (($ev && $ev->visibility !== 'hidden') || ($ps && $ps->rules_sent)) {
                return back()->with('error', "Kunci tidak bisa dibuka{$label}: aturan atau hasil sedang tampil ke peserta. Matikan saklar di tab Publikasi dulu.");
            }
        }

        if ($open) {
            $s = Judging::settings($event->id, $cid);
            $problems = Judging::problems($event->id, $cid);
            if ($problems) {
                return back()->with('error', "Tidak bisa disahkan{$label}: ".implode(' ', $problems));
            }
        }

        Judging::settings($event->id, $cid);
        DB::table('judging_settings')->where('event_id', $event->id)->where('category_id', $cid)->update(['enabled' => $open, 'updated_at' => now()]);

        return back()->with('success', $open ? "Penilaian{$label} disahkan. Konfigurasi terkunci dan juri sudah bisa menilai." : "Penilaian{$label} dibuka kuncinya. Konfigurasi bisa diubah lagi.");
    }

    /** Simpan pengaturan satu kategori: skala, kriteria, juri dan pembulatan, serta pengurangan nilai. */
    public function saveCriteria(Request $request, Event $event): RedirectResponse
    {
        $this->guard($request, $event);
        $cid = $this->cat($request, $event);

        if (Judging::settings($event->id, $cid)->enabled) {
            return back()->with('error', 'Konfigurasi terkunci. Buka kunci kategori ini dulu untuk mengubahnya.');
        }

        $data = $request->validate([
            'scale' => 'required|in:100,1000',
            'judge_count' => 'required|integer|min:1|max:15',
            'avg_decimals' => 'required|integer|min:0|max:4',
            'rounding' => 'required|in:nearest,up,down',
            'deduction_enabled' => 'required|boolean',
            'criteria' => 'required|array|min:1|max:15',
            'criteria.*.id' => 'nullable|integer',
            'criteria.*.name' => 'required|string|max:60',
            'criteria.*.description' => 'nullable|string|max:200',
            'criteria.*.weight' => 'required|integer|min:1|max:100',
            'criteria.*.subs' => 'nullable|array|max:15',
            'criteria.*.subs.*.id' => 'nullable|integer',
            'criteria.*.subs.*.name' => 'required|string|max:60',
            'criteria.*.subs.*.description' => 'nullable|string|max:200',
            'criteria.*.subs.*.weight' => 'required|integer|min:1|max:100',
            'deductions' => 'nullable|array|max:20',
            'deductions.*.name' => 'required|string|max:60',
            'deductions.*.points' => 'required|numeric|min:0|max:1000',
        ], [
            'criteria.*.name.required' => 'Nama kriteria tidak boleh kosong.',
            'criteria.*.weight.required' => 'Bobot tiap kriteria harus diisi.',
            'deductions.*.name.required' => 'Nama pengurangan tidak boleh kosong.',
        ]);

        $total = array_sum(array_map(fn ($c) => (int) $c['weight'], $data['criteria']));
        if ($total !== 100) {
            throw ValidationException::withMessages(['criteria' => "Total bobot harus 100%, sekarang {$total}%."]);
        }

        foreach ($data['criteria'] as $cr) {
            if (! empty($cr['subs'])) {
                $st = array_sum(array_map(fn ($x) => (int) $x['weight'], $cr['subs']));
                if ($st !== 100) {
                    throw ValidationException::withMessages(['criteria' => "Total bobot sub kriteria {$cr['name']} harus 100%, sekarang {$st}%."]);
                }
            }
        }

        if (array_sum(array_map(fn ($x) => (int) $x['weight'], $data['criteria'])) !== 100) {
            throw ValidationException::withMessages(['criteria' => 'Total bobot kriteria harus 100%.']);
        }

        DB::transaction(function () use ($event, $data, $cid) {
            DB::table('judging_settings')->where('event_id', $event->id)->where('category_id', $cid)->update([
                'scale' => (int) $data['scale'],
                'judge_count' => (int) $data['judge_count'],
                'avg_decimals' => (int) $data['avg_decimals'],
                'rounding' => $data['rounding'],
                'deduction_enabled' => (bool) $data['deduction_enabled'],
                'updated_at' => now(),
            ]);

            $existing = DB::table('judging_criteria')->where('event_id', $event->id)->where('category_id', $cid)->pluck('id')->all();
            $keep = [];
            $scale = (int) $data['scale'];
            $put = function (array $c, int $i, ?int $parent, float $share) use (&$keep, $existing, $event, $cid, $scale): int {
                $row = [
                    'name' => trim($c['name']),
                    'description' => isset($c['description']) && trim($c['description']) !== '' ? trim($c['description']) : null,
                    'weight' => (int) $c['weight'],
                    'max_score' => (int) ($c['_pts'] ?? 0),
                    'parent_id' => $parent,
                    'sort' => $i,
                    'updated_at' => now(),
                ];
                if (! empty($c['id']) && in_array((int) $c['id'], $existing, true)) {
                    DB::table('judging_criteria')->where('id', $c['id'])->update($row);
                    $id = (int) $c['id'];
                } else {
                    $id = (int) DB::table('judging_criteria')->insertGetId($row + ['event_id' => $event->id, 'category_id' => $cid, 'created_at' => now()]);
                }
                $keep[] = $id;

                return $id;
            };
            $leafW = [];
            foreach (array_values($data['criteria']) as $c) {
                if (! empty($c['subs'])) {
                    foreach ($c['subs'] as $sc) {
                        $leafW[] = ((int) $c['weight']) * ((int) $sc['weight']) / 100;
                    }
                } else {
                    $leafW[] = (int) $c['weight'];
                }
            }
            $pts = Judging::allocate($scale, $leafW);
            $n = 0;
            foreach (array_values($data['criteria']) as $i => $c) {
                $subs = array_values($c['subs'] ?? []);
                if ($subs) {
                    $sp = array_slice($pts, $n, count($subs));
                    $n += count($subs);
                    $c['_pts'] = array_sum($sp);
                    $pid = $put($c, $i, null, 1.0);
                    foreach ($subs as $k => $sc) {
                        $sc['_pts'] = $sp[$k];
                        $put($sc, $k, $pid, 1.0);
                    }
                } else {
                    $c['_pts'] = $pts[$n++];
                    $put($c, $i, null, 1.0);
                }
            }
            $drop = array_values(array_diff($existing, $keep));
            if ($drop) {
                DB::table('judging_criteria')->whereIn('id', $drop)->delete();
            }

            // Skala atau bobot bisa berubah, jadi nilai lama di kategori ini tidak lagi sebanding.
            $judgeIds = DB::table('judges')->where('event_id', $event->id)->where('category_id', $cid)->pluck('id')->all();
            DB::table('judging_scores')->whereIn('judge_id', $judgeIds)->delete();

            DB::table('judging_deductions')->where('event_id', $event->id)->where('category_id', $cid)->delete();
            foreach (array_values($data['deductions'] ?? []) as $i => $d) {
                DB::table('judging_deductions')->insert([
                    'event_id' => $event->id, 'category_id' => $cid, 'name' => trim($d['name']), 'points' => (float) $d['points'], 'sort' => $i,
                    'created_at' => now(), 'updated_at' => now(),
                ]);
            }
        });

        return back()->with('success', 'Pengaturan penilaian disimpan.');
    }

    private function alreadyIn(Event $event, int $userId): bool
    {
        return DB::table('judge_invitations')->where('event_id', $event->id)->where('user_id', $userId)->exists()
            || DB::table('judges')->where('event_id', $event->id)->where('user_id', $userId)->exists();
    }

    public function inviteLookup(Request $request, Event $event): \Illuminate\Http\JsonResponse
    {
        $this->guard($request, $event);
        $cid = $this->cat($request, $event);
        $email = strtolower(trim((string) $request->query('email', '')));
        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return response()->json(['status' => 'invalid']);
        }
        $user = \App\Models\User::where('email', $email)->first();
        if (! $user) {
            return response()->json(['status' => 'not_found']);
        }
        if ($this->alreadyIn($event, (int) $user->id)) {
            return response()->json(['status' => 'invited']);
        }

        return response()->json(['status' => 'ok', 'user' => ['name' => $user->name, 'city' => $user->city ?? null]]);
    }

    public function inviteStore(Request $request, Event $event): RedirectResponse
    {
        $this->guard($request, $event);
        $cid = $this->cat($request, $event);
        $data = $request->validate(['email' => 'required|email'], ['email.required' => 'Email wajib diisi.', 'email.email' => 'Format email tidak valid.']);
        $user = \App\Models\User::where('email', $data['email'])->first();
        if (! $user) {
            throw ValidationException::withMessages(['email' => 'Email ini belum terdaftar di SIMPLE.']);
        }
        if ($this->alreadyIn($event, (int) $user->id)) {
            throw ValidationException::withMessages(['email' => 'Akun ini sudah diundang atau sudah menjadi juri di event ini.']);
        }
        DB::table('judge_invitations')->insert(['event_id' => $event->id, 'category_id' => $cid, 'user_id' => $user->id, 'status' => 'menunggu', 'created_at' => now(), 'updated_at' => now()]);

        try {
            $user->notify(new \App\Notifications\AdminAlert('Undangan menjadi juri', "Anda diundang menjadi juri {$event->title}. Terima atau tolak undangan ini.", '/dashboard?tab=undangan'));
        } catch (\Throwable $e) {
            report($e);
        }

        return back()->with('success', "Undangan dikirim ke {$user->name}. Menunggu persetujuan.");
    }

    public function inviteCancel(Request $request, Event $event, int $inv): RedirectResponse
    {
        $this->guard($request, $event);
        abort_unless(DB::table('judge_invitations')->where('id', $inv)->where('event_id', $event->id)->where('status', 'menunggu')->exists(), 404);
        DB::table('judge_invitations')->where('id', $inv)->delete();

        return back()->with('success', 'Undangan dibatalkan.');
    }

    public function storeJudge(Request $request, Event $event): RedirectResponse
    {
        $this->guard($request, $event);
        $cid = $this->cat($request, $event);
        $data = $request->validate(['name' => 'required|string|max:80', 'contact' => 'nullable|string|max:80'], ['name.required' => 'Nama juri harus diisi.']);
        DB::table('judges')->insert([
            'event_id' => $event->id, 'category_id' => $cid, 'name' => trim($data['name']), 'contact' => $data['contact'] ?? null, 'active' => true,
            'token' => Str::random(32), 'created_at' => now(), 'updated_at' => now(),
        ]);

        return back()->with('success', 'Juri ditambahkan.');
    }

    /** Juri sudah punya nilai dan penilaian kategorinya sedang dibuka. */
    private function judgeScoring(Event $event, int $judgeId): bool
    {
        $cid = (int) DB::table('judges')->where('id', $judgeId)->value('category_id');
        if ($cid < 0) {
            return false;
        }

        return (bool) Judging::settings($event->id, $cid)->enabled
            && DB::table('judging_scores')->where('judge_id', $judgeId)->exists();
    }

    public function updateJudge(Request $request, Event $event, int $item): RedirectResponse
    {
        $this->guard($request, $event);
        $this->judgeOwned($event, $item);
        if ($this->judgeLocked($event, $item)) {
            return back()->with('error', 'Hasil sudah ditetapkan. Juri tidak bisa diubah.');
        }
        $data = $request->validate(['name' => 'required|string|max:80', 'contact' => 'nullable|string|max:80', 'active' => 'required|boolean']);
        if (! $data['active'] && $this->judgeScoring($event, $item)) {
            return back()->with('error', 'Juri ini sudah memberi nilai dan penilaian sedang dibuka. Tutup penilaian dulu di tab Pengaturan penilaian sebelum menonaktifkan juri.');
        }
        DB::table('judges')->where('id', $item)->update(['name' => trim($data['name']), 'contact' => $data['contact'] ?? null, 'active' => $data['active'], 'updated_at' => now()]);

        return back()->with('success', 'Juri diperbarui.');
    }

    public function assignJudge(Request $request, Event $event, int $item): RedirectResponse
    {
        $this->guard($request, $event);
        $this->judgeOwned($event, $item);
        $data = $request->validate(['categories' => 'required|array|min:1', 'categories.*' => 'integer'], ['categories.required' => 'Pilih minimal satu kategori.', 'categories.min' => 'Pilih minimal satu kategori.']);
        $j = DB::table('judges')->where('id', $item)->first();
        if ((int) $j->category_id !== -1) {
            return back()->with('error', 'Juri ini sudah ditugaskan.');
        }
        $valid = Judging::categoryIds($event->id);
        $cats = collect($data['categories'])->map(fn ($v) => (int) $v)->unique()->values();
        abort_unless($cats->every(fn ($c) => in_array($c, $valid, true)), 422);
        foreach ($cats as $c) {
            $s = Judging::settings($event->id, $c);
            if (! empty($s->finalized_at) || ! empty($s->saved_at)) {
                return back()->with('error', 'Hasil salah satu kategori sudah disimpan atau ditetapkan. Juri tidak bisa ditugaskan ke sana.');
            }
            if ($s->enabled) {
                $act = DB::table('judges')->where('event_id', $event->id)->where('category_id', $c)->where('active', 1)->count();
                if ($act >= (int) $s->judge_count) {
                    return back()->with('error', 'Penilaian salah satu kategori sedang dibuka dan jumlah juri sudah cukup. Tutup penilaian dulu kalau ingin mengganti juri.');
                }
            }
        }
        DB::transaction(function () use ($cats, $j, $event) {
            foreach ($cats as $i => $c) {
                if ($i === 0) {
                    DB::table('judges')->where('id', $j->id)->update(['category_id' => $c, 'updated_at' => now()]);
                } else {
                    DB::table('judges')->insert([
                        'event_id' => $event->id, 'category_id' => $c, 'user_id' => $j->user_id,
                        'name' => $j->name, 'contact' => $j->contact, 'active' => true,
                        'token' => Str::random(32), 'created_at' => now(), 'updated_at' => now(),
                    ]);
                }
            }
        });

        return back()->with('success', 'Juri ditugaskan.');
    }

    private function judgeKey($j): string
    {
        return $j->user_id ? 'u'.$j->user_id : 'n'.mb_strtolower(trim($j->name)).'|'.($j->contact ?? '');
    }

    /** Juri event ini yang bertugas di kategori lain dan belum ada di kategori yang sedang dibuka. */
    public function eventJudges(Request $request, Event $event): \Illuminate\Http\JsonResponse
    {
        $this->guard($request, $event);
        $cid = $this->cat($request, $event);

        $all = DB::table('judges')->where('event_id', $event->id)->where('category_id', '>=', 0)->orderBy('id')->get();
        $here = $all->where('category_id', $cid)->map(fn ($j) => $this->judgeKey($j))->all();

        $out = [];
        foreach ($all->where('category_id', '!=', $cid) as $j) {
            $k = $this->judgeKey($j);
            if (in_array($k, $here, true)) {
                continue;
            }
            $out[$k] ??= ['id' => $j->id, 'name' => $j->name, 'contact' => $j->contact, 'from' => []];
            $out[$k]['from'][] = $this->catName($event, (int) $j->category_id);
        }

        return response()->json(array_values($out));
    }

    /** Tambahkan juri yang sudah bertugas ke kategori lain (baris baru, token baru). */
    public function addToCategory(Request $request, Event $event, int $item): RedirectResponse
    {
        $this->guard($request, $event);
        $this->judgeOwned($event, $item);
        $data = $request->validate(['category_id' => 'required|integer']);
        $c = (int) $data['category_id'];
        abort_unless(in_array($c, Judging::categoryIds($event->id), true), 422);

        $j = DB::table('judges')->where('id', $item)->first();
        if ((int) $j->category_id === -1 || (int) $j->category_id === $c) {
            return back()->with('error', 'Juri ini tidak bisa ditambahkan ke kategori tersebut.');
        }
        $key = $this->judgeKey($j);
        foreach (DB::table('judges')->where('event_id', $event->id)->where('category_id', $c)->get() as $x) {
            if ($this->judgeKey($x) === $key) {
                return back()->with('error', 'Juri ini sudah ada di kategori tersebut.');
            }
        }

        $s = Judging::settings($event->id, $c);
        if (! empty($s->finalized_at) || ! empty($s->saved_at)) {
            return back()->with('error', 'Hasil kategori tersebut sudah disimpan atau ditetapkan. Juri tidak bisa ditambahkan.');
        }
        if ($s->enabled) {
            $act = DB::table('judges')->where('event_id', $event->id)->where('category_id', $c)->where('active', 1)->count();
            if ($act >= (int) $s->judge_count) {
                return back()->with('error', 'Penilaian kategori tersebut sedang dibuka dan jumlah juri sudah cukup. Tutup penilaian dulu.');
            }
        }

        DB::table('judges')->insert([
            'event_id' => $event->id, 'category_id' => $c, 'user_id' => $j->user_id,
            'name' => $j->name, 'contact' => $j->contact, 'active' => true,
            'token' => Str::random(32), 'created_at' => now(), 'updated_at' => now(),
        ]);

        return back()->with('success', 'Juri ditambahkan ke kategori ini.');
    }

    public function destroyJudge(Request $request, Event $event, int $item): RedirectResponse
    {
        $this->guard($request, $event);
        $this->judgeOwned($event, $item);
        if ($this->judgeLocked($event, $item)) {
            return back()->with('error', 'Hasil sudah ditetapkan. Juri tidak bisa dihapus.');
        }
        if ($this->judgeScoring($event, $item)) {
            return back()->with('error', 'Juri ini sudah memberi nilai dan penilaian sedang dibuka. Tutup penilaian dulu di tab Pengaturan penilaian sebelum menghapus juri.');
        }
        DB::table('judging_scores')->where('judge_id', $item)->delete();
        DB::table('judge_invitations')->where('judge_id', $item)->delete();
        DB::table('judges')->where('id', $item)->delete();

        return back()->with('success', 'Juri dihapus beserta nilainya.');
    }

    public function resetLink(Request $request, Event $event, int $item): RedirectResponse
    {
        $this->guard($request, $event);
        $this->judgeOwned($event, $item);
        DB::table('judges')->where('id', $item)->update(['token' => Str::random(32), 'updated_at' => now()]);

        return back()->with('success', 'Link juri diganti. Link lama tidak berlaku lagi.');
    }

    private function pubRules(Event $event, int $cid, object $s): array
    {
        $rounding = ['nearest' => 'dibulatkan biasa', 'up' => 'dibulatkan ke atas', 'down' => 'dibulatkan ke bawah'][(string) $s->rounding] ?? (string) $s->rounding;
        $dedCount = DB::table('judging_deductions')->where('event_id', $event->id)->where('category_id', $cid)->count();

        return [
            'method' => 'Penilaian berbasis bobot',
            'combine' => 'Rata-rata',
            'scale' => '0 sampai '.(int) $s->scale,
            'rounding' => (int) $s->avg_decimals.' desimal, '.$rounding,
            'ranking' => 'Nilai terbesar terbaik',
            'deduction' => ($s->deduction_enabled && $dedCount > 0) ? "Dipakai ({$dedCount} jenis)" : 'Tidak dipakai',
            'deductions' => DB::table('judging_deductions')->where('event_id', $event->id)->where('category_id', $cid)->orderBy('sort')->orderBy('id')->get()
                ->map(fn ($d) => ['name' => $d->name, 'points' => (float) $d->points])->values()->all(),
            'criteria' => Judging::criteria($event->id, $cid)->map(fn ($c) => [
                'name' => $c->name,
                'description' => $c->description ?? '',
                'weight' => (int) $c->weight,
                'subs' => DB::table('judging_criteria')->where('parent_id', $c->id)->orderBy('sort')->orderBy('id')->get()
                    ->map(fn ($x) => ['name' => $x->name, 'description' => $x->description ?? '', 'weight' => (int) $x->weight])->values()->all(),
            ])->values()->all(),
            'penalty_types' => ['Teguran', 'Peringatan resmi', 'Pengurangan nilai', 'Konsekuensi khusus', 'Pembatalan hasil', 'Diskualifikasi'],
        ];
    }

    private function pubSettings(Event $event, int $cid): object
    {
        DB::table('judging_publication_settings')->insertOrIgnore([
            'event_id' => $event->id, 'category_id' => $cid, 'created_at' => now(), 'updated_at' => now(),
        ]);

        return DB::table('judging_publication_settings')->where('event_id', $event->id)->where('category_id', $cid)->first();
    }

    private function publicationData(Event $event, int $cid, object $s): array
    {
        $rules = $this->pubRules($event, $cid, $s);
        $hash = hash('sha256', json_encode($rules));
        $ps = $this->pubSettings($event, $cid);
        $latest = DB::table('judging_publications')->where('event_id', $event->id)->where('category_id', $cid)->orderByDesc('number')->first();

        return [
            'rules' => $rules,
            'latest_version' => $latest ? (int) $latest->number : null,
            'up_to_date' => (bool) ($latest && $latest->rules_hash === $hash),
            'rules_sent' => (bool) ($ps->rules_sent ?? false),
            'enabled' => (bool) $s->enabled,
        ];
    }

    private function pubEvent(Event $event): object
    {
        DB::table('judging_event_publication')->insertOrIgnore(['event_id' => $event->id, 'created_at' => now(), 'updated_at' => now()]);

        return DB::table('judging_event_publication')->where('event_id', $event->id)->first();
    }

    private function publicationEvent(Event $event): array
    {
        $ev = $this->pubEvent($event);
        $cats = collect(Judging::categories($event->id));
        $names = $cats->pluck('name', 'id');
        $pending = $cats->filter(fn ($k) => ! Judging::settings($event->id, (int) $k['id'])->enabled)
            ->map(fn ($k) => ['id' => (int) $k['id'], 'name' => $k['name']])->values()->all();
        $appeals = DB::table('judging_appeals')->where('event_id', $event->id)->orderByDesc('id')->get();

        return [
            'visibility' => $ev->visibility,
            'appeals_open' => (bool) $ev->appeals_open,
            'appeals_deadline' => $ev->appeals_deadline ? \Illuminate\Support\Carbon::parse($ev->appeals_deadline)->format('Y-m-d\TH:i') : null,
            'pending' => $pending,
            'appeals' => $appeals->map(fn ($a) => [
                'id' => (int) $a->id,
                'category' => $names[(int) $a->category_id] ?? '',
                'participant' => $a->participant_name,
                'reason' => $a->reason,
                'status' => $a->status,
                'created_at' => \Illuminate\Support\Carbon::parse($a->created_at)->format('d/m/Y, H.i'),
            ])->values()->all(),
        ];
    }

    public function publish(Request $request, Event $event): RedirectResponse
    {
        $this->guard($request, $event);
        $cid = $this->cat($request, $event);
        $data = $request->validate(['note' => 'nullable|string|max:300']);
        $s = Judging::settings($event->id, $cid);

        if (! $s->enabled) {
            return back()->with('error', 'Sahkan penilaian kategori ini dulu sebelum menerbitkan aturan ke peserta.');
        }

        $rules = $this->pubRules($event, $cid, $s);
        $hash = hash('sha256', json_encode($rules));
        $latest = DB::table('judging_publications')->where('event_id', $event->id)->where('category_id', $cid)->orderByDesc('number')->first();
        if ($latest && $latest->rules_hash === $hash) {
            return back()->with('error', 'Aturan sudah terbaru. Tidak ada perubahan untuk diterbitkan.');
        }

        $number = $latest ? ((int) $latest->number + 1) : 1;
        DB::table('judging_publications')->insert([
            'event_id' => $event->id, 'category_id' => $cid, 'number' => $number,
            'rules' => json_encode($rules), 'rules_hash' => $hash,
            'note' => isset($data['note']) && trim($data['note']) !== '' ? trim($data['note']) : null,
            'published_by' => $request->user()?->name,
            'recipients' => count(Judging::participants($event->id, $cid)),
            'created_at' => now(), 'updated_at' => now(),
        ]);

        return back()->with('success', "Aturan versi {$number} diterbitkan ke peserta.");
    }

    public function savePublication(Request $request, Event $event): RedirectResponse
    {
        $this->guard($request, $event);
        $cid = $this->cat($request, $event);
        $data = $request->validate([
            'visibility' => 'nullable|in:hidden,own,all',
            'appeals_open' => 'nullable|boolean',
            'appeals_deadline' => 'nullable|date',
            'rules_sent' => 'nullable|boolean',
            'note' => 'nullable|string|max:300',
        ]);
        $msg = 'Pengaturan publikasi disimpan.';

        // Tingkat event: hasil dan keberatan, satu untuk semua kategori.
        $ev = ['updated_at' => now()];
        if (! empty($data['visibility'])) {
            if ($data['visibility'] !== 'hidden') {
                $pending = collect(Judging::categories($event->id))->filter(fn ($k) => ! Judging::settings($event->id, (int) $k['id'])->enabled)->pluck('name')->all();
                if ($pending) {
                    return back()->with('error', 'Sahkan penilaian dulu di kategori: '.implode(', ', $pending).'.');
                }
            }
            $ev['visibility'] = $data['visibility'];
            $msg = match ($data['visibility']) {
                'hidden' => 'Hasil disembunyikan dari peserta.',
                'own' => 'Hasil ditampilkan: tiap peserta melihat nilai timnya sendiri.',
                'all' => 'Hasil ditampilkan: semua peserta melihat nilai semua peserta.',
            };
        }
        if (array_key_exists('appeals_open', $data) && $data['appeals_open'] !== null) {
            $ev['appeals_open'] = (bool) $data['appeals_open'];
            $msg = $ev['appeals_open'] ? 'Pengajuan keberatan dibuka.' : 'Pengajuan keberatan ditutup.';
        }
        if (array_key_exists('appeals_deadline', $data)) {
            $ev['appeals_deadline'] = $data['appeals_deadline'];
        }
        if (count($ev) > 1) {
            $this->pubEvent($event);
            DB::table('judging_event_publication')->where('event_id', $event->id)->update($ev);
        }

        // Tingkat kategori: kirim aturan.
        if (array_key_exists('rules_sent', $data) && $data['rules_sent'] !== null) {
            $s = Judging::settings($event->id, $cid);
            $this->pubSettings($event, $cid);
            $upd = ['updated_at' => now()];
            $name = $this->catName($event, $cid);
            $for = $name !== '' ? " kategori {$name}" : '';

            if ($data['rules_sent']) {
                if (! $s->enabled) {
                    return back()->with('error', "Sahkan penilaian{$for} dulu sebelum mengirim aturan ke peserta.");
                }
                $rules = $this->pubRules($event, $cid, $s);
                $hash = hash('sha256', json_encode($rules));
                $latest = DB::table('judging_publications')->where('event_id', $event->id)->where('category_id', $cid)->orderByDesc('number')->first();
                if (! $latest || $latest->rules_hash !== $hash) {
                    $number = $latest ? ((int) $latest->number + 1) : 1;
                    $recipients = count(Judging::participants($event->id, $cid));
                    DB::table('judging_publications')->insert([
                        'event_id' => $event->id, 'category_id' => $cid, 'number' => $number,
                        'rules' => json_encode($rules), 'rules_hash' => $hash,
                        'note' => isset($data['note']) && trim($data['note']) !== '' ? trim($data['note']) : null,
                        'published_by' => $request->user()?->name,
                        'recipients' => $recipients,
                        'created_at' => now(), 'updated_at' => now(),
                    ]);
                    $msg = "Aturan{$for} versi {$number} dikirim ke {$recipients} peserta.";
                } else {
                    $msg = "Aturan{$for} ditampilkan ke peserta.";
                }
                $upd['rules_sent'] = true;
            } else {
                $upd['rules_sent'] = false;
                $msg = "Aturan{$for} disembunyikan dari peserta.";
            }
            DB::table('judging_publication_settings')->where('event_id', $event->id)->where('category_id', $cid)->update($upd);
        }

        return back()->with('success', $msg);
    }

    private function recapData(Event $event, int $cid, object $s): array
    {
        $parts = Judging::participants($event->id, $cid);
        $leaves = Judging::leaves($event->id, $cid);
        $leafIds = $leaves->pluck('id')->all();
        $roots = Judging::criteria($event->id, $cid);
        $rootOf = [];
        $maxOf = [];
        foreach ($leaves as $l) {
            $rootOf[(int) $l->id] = (int) ($l->parent_id ?: $l->id);
            $maxOf[(int) $l->id] = (float) $l->max_score;
        }
        $need = max(1, (int) $s->judge_count);
        $judgeIds = DB::table('judges')->where('event_id', $event->id)->where('category_id', $cid)->where('active', 1)->pluck('id')->all();
        $scores = ($leafIds && $judgeIds)
            ? DB::table('judging_scores')->whereIn('judge_id', $judgeIds)->whereIn('criterion_id', $leafIds)->get(['judge_id', 'registration_id', 'criterion_id', 'score'])->groupBy('registration_id')
            : collect();
        $regs = $parts ? DB::table('event_registrations')->where('event_id', $event->id)->whereIn('id', array_column($parts, 'id'))->get()->keyBy('id') : collect();
        $has = fn ($col) => \Illuminate\Support\Facades\Schema::hasColumn('event_registrations', $col);
        $codeCol = collect(['code', 'registration_code', 'reg_code'])->first($has);
        $orderCol = collect(['performance_order', 'order_no', 'start_order'])->first($has);
        $pens = DB::table('judging_penalties')->where('event_id', $event->id)->where('category_id', $cid)->orderByDesc('id')->get();
        $dq = ['Diskualifikasi', 'Pembatalan hasil'];
        $dec = (int) $s->avg_decimals;
        $mode = (string) $s->rounding;

        $labels = ['Nilai akhir'];
        foreach ($roots as $i => $rt) {
            $labels[] = 'Kriteria '.($i + 1).': '.$rt->name;
        }
        foreach ([5, 4, 3, 2, 1] as $k) {
            $labels[] = "Jumlah level {$k} dari semua juri";
        }

        $codes = [];
        $rows = [];
        $items = [];
        foreach ($parts as $p) {
            $reg = $regs->get($p['id']);
            $code = ($codeCol && $reg && ! empty($reg->{$codeCol})) ? (string) $reg->{$codeCol} : (($p['code'] ?? '') !== '' ? (string) $p['code'] : 'REG-'.$p['id']);
            $codes[$p['id']] = $code;
            $perJudge = [];
            $critSums = [];
            $counts = [5 => 0, 4 => 0, 3 => 0, 2 => 0, 1 => 0];
            foreach ($scores->get($p['id'], collect())->groupBy('judge_id') as $cells) {
                if ($cells->pluck('criterion_id')->unique()->count() < count($leafIds)) {
                    continue;
                }
                $perJudge[] = (float) $cells->sum('score');
                foreach ($cells as $cell) {
                    $leafId = (int) $cell->criterion_id;
                    $rid = $rootOf[$leafId] ?? null;
                    if ($rid === null) {
                        continue;
                    }
                    $critSums[$rid] = ($critSums[$rid] ?? 0) + (float) $cell->score;
                    $mx = $maxOf[$leafId] ?? 0;
                    if ($mx > 0) {
                        $raw = Judging::level((float) $cell->score, $mx);
                        $counts[$raw]++;
                    }
                }
            }
            $done = count($perJudge);
            $base = $done ? Judging::round(array_sum($perJudge) / $done, $dec, $mode) : null;
            $mine = $pens->where('registration_id', $p['id'])->where('status', 'disetujui');
            $pen = (float) $mine->where('type', 'Pengurangan nilai')->sum('points');
            $disq = $mine->whereIn('type', $dq)->isNotEmpty();
            $score = ($done >= 1 && ! $disq) ? (float) max(0, Judging::round(($base ?? 0) - $pen, $dec, $mode)) : null;
            $final = ($done >= $need && $score !== null) ? $score : null;

            if ($score !== null) {
                $vals = [round($score, 4)];
                foreach ($roots as $rt) {
                    $vals[] = $done ? round(($critSums[(int) $rt->id] ?? 0) / $done, 4) : 0.0;
                }
                foreach ([5, 4, 3, 2, 1] as $k) {
                    $vals[] = (float) $counts[$k];
                }
                $items[] = ['id' => $p['id'], 'code' => $code, 'v' => $vals];
            }

            $rows[] = [
                'rank' => null,
                'id' => $p['id'],
                'code' => $code,
                'name' => $p['name'],
                'school' => $p['school'],
                'order' => ($orderCol && $reg && $reg->{$orderCol} !== null) ? (int) $reg->{$orderCol} : null,
                'judges_done' => $done,
                'base' => $base,
                'deduction' => 0,
                'penalty' => $pen,
                'score' => $score,
                'provisional' => $score !== null && $final === null,
                'final' => $final,
                'status' => $done === 0 ? 'belum' : ($done < $need ? 'sebagian' : 'selesai'),
            ];
        }

        // Keputusan dewan juri: yang terbaru menang.
        $log = DB::table('judging_tie_decisions')->where('event_id', $event->id)->where('category_id', $cid)->orderBy('id')->get();
        $decisions = [];
        foreach ($log as $d) {
            $decisions[$d->group_key] = $d;
        }

        // Deteksi seri dan pemecahan bertahap.
        $info = [];
        foreach ($items as $it) {
            $info[$it['id']] = ['tied' => false, 'with' => [], 'trail' => [], 'by' => null, 'council' => false];
        }
        $byScore = [];
        foreach ($items as $it) {
            $byScore[(string) $it['v'][0]][] = $it;
        }
        krsort($byScore, SORT_NUMERIC);
        $buckets = [];
        foreach ($byScore as $g) {
            if (count($g) > 1) {
                foreach ($g as $it) {
                    $info[$it['id']]['tied'] = true;
                    $info[$it['id']]['with'] = array_values(array_map(fn ($o) => $o['code'], array_filter($g, fn ($o) => $o['id'] !== $it['id'])));
                }
            }
            foreach ($this->tieSplit($g, 1, $labels, $info) as $b) {
                $buckets[] = $b;
            }
        }

        // Peringkat.
        $ranks = [];
        $shared = [];
        $councils = [];
        $councilOf = [];
        $pos = 0;
        foreach ($buckets as $b) {
            if (count($b) === 1) {
                $ranks[$b[0]['id']] = $pos + 1;
                $pos++;

                continue;
            }
            $ids = array_map('intval', array_column($b, 'id'));
            sort($ids);
            $key = implode('-', $ids);
            $d = $decisions[$key] ?? null;
            $kind = $d ? $d->decision : null;
            $order = null;
            if ($kind === 'urut') {
                $o = array_map('intval', json_decode((string) $d->order_json, true) ?: []);
                $chk = $o;
                sort($chk);
                $order = $chk === $ids ? array_values($o) : null;
                if ($order === null) {
                    $kind = null;
                }
            }
            if ($kind === 'urut') {
                foreach ($order as $k => $rid) {
                    $ranks[$rid] = $pos + $k + 1;
                }
            } else {
                foreach ($ids as $rid) {
                    $ranks[$rid] = $pos + 1;
                    $shared[$rid] = true;
                }
            }
            $pos += count($b);
            $co = [
                'key' => $key,
                'ids' => $ids,
                'codes' => array_map(fn ($rid) => $codes[$rid], $ids),
                'decision' => $kind,
                'order' => $order ? array_map(fn ($rid) => $codes[$rid], $order) : null,
                'note' => $kind ? ($d->note ?? null) : null,
                'decided_by' => $kind ? ($d->decided_by ?? null) : null,
                'decided_at' => $kind ? \Illuminate\Support\Carbon::parse($d->created_at)->format('d/m/Y, H.i') : null,
                'resolved' => in_array($kind, ['bersama', 'urut'], true),
            ];
            $councils[] = $co;
            foreach ($ids as $rid) {
                $councilOf[$rid] = $co;
            }
        }

        $dtxt = ['bersama' => 'juara bersama', 'ulang' => 'tanding ulang', 'urut' => 'urutan hasil tanding ulang'];
        foreach ($rows as &$r) {
            $rid = $r['id'];
            $r['rank'] = $ranks[$rid] ?? null;
            $r['rank_shared'] = isset($shared[$rid]);
            $r['tie'] = null;
            $r['tie_text'] = '';
            if (isset($info[$rid]) && $info[$rid]['tied']) {
                $in = $info[$rid];
                $co = $councilOf[$rid] ?? null;
                $r['tie'] = [
                    'with' => $in['with'], 'trail' => $in['trail'], 'by' => $in['by'], 'council' => $in['council'],
                    'decision' => $co['decision'] ?? null, 'key' => $co['key'] ?? null,
                ];
                $txt = 'Seri dengan '.implode(', ', $in['with']);
                if ($in['council']) {
                    $txt .= isset($dtxt[$co['decision'] ?? '']) ? ' · keputusan dewan juri: '.$dtxt[$co['decision']] : ' · menunggu keputusan dewan juri';
                } else {
                    $txt .= ' · ditentukan di '.($in['by'] ?? '-');
                }
                $r['tie_text'] = $txt;
            }
        }
        unset($r);
        usort($rows, fn ($a, $b) => [$a['rank'] ?? 9999, $a['id']] <=> [$b['rank'] ?? 9999, $b['id']]);

        // Pemeriksaan sebelum menetapkan hasil.
        $incomplete = collect($rows)->filter(fn ($r) => $r['judges_done'] < $need)->pluck('code')->all();
        $pendingPen = $pens->where('status', 'diajukan');
        $pendingDed = $pendingPen->where('type', 'Pengurangan nilai')->count();
        $unresolved = array_values(array_filter($councils, fn ($x) => ! $x['resolved']));
        $anyTie = collect($rows)->contains(fn ($r) => $r['tie'] !== null);
        $dedOn = (bool) $s->deduction_enabled;
        $checks = [
            ['key' => 'scores', 'ok' => count($rows) > 0 && ! $incomplete && count($judgeIds) >= $need,
                'title' => "Semua nilai sudah 100% dinilai oleh {$need} juri",
                'detail' => count($rows) === 0 ? 'Belum ada peserta terdaftar.' : (count($judgeIds) < $need ? 'Juri aktif baru '.count($judgeIds).' dari '.$need.'.' : ($incomplete ? 'Belum lengkap: '.implode(', ', $incomplete).'.' : 'Semua tim sudah dinilai lengkap.'))],
            ['key' => 'deduction', 'ok' => ! $dedOn ? true : $pendingDed === 0, 'manual' => $dedOn,
                'title' => 'Pengurangan nilai sudah dilaksanakan',
                'detail' => ! $dedOn ? 'Pengurangan nilai tidak diaktifkan di kategori ini.' : ($pendingDed > 0 ? "Masih ada {$pendingDed} penalti pengurangan nilai yang belum diputuskan." : 'Centang konfirmasi di bawah setelah panitia memastikan pengurangan sudah dilaksanakan.')],
            ['key' => 'penalty', 'ok' => $pendingPen->count() === 0,
                'title' => 'Penalti sudah selesai diinput dan diputuskan',
                'detail' => $pendingPen->count() > 0 ? $pendingPen->count().' penalti masih berstatus diajukan.' : 'Tidak ada penalti yang menunggu keputusan.'],
            ['key' => 'ties', 'ok' => ! $unresolved,
                'title' => 'Tidak ada posisi seri yang belum diputuskan',
                'detail' => $unresolved
                    ? 'Seri sampai dewan juri: '.implode('; ', array_map(fn ($x) => implode(' = ', $x['codes']).($x['decision'] === 'ulang' ? ' (tanding ulang belum selesai)' : ' (belum diputuskan)'), $unresolved)).'.'
                    : ($anyTie ? 'Semua seri sudah terpecahkan oleh aturan atau keputusan dewan juri.' : 'Semua peringkat berbeda.')],
        ];

        $tieLog = $log->reverse()->values()->map(function ($d) use ($codes) {
            $ids = array_map('intval', json_decode((string) $d->ids_json, true) ?: []);
            $ord = $d->order_json ? array_map('intval', json_decode((string) $d->order_json, true) ?: []) : [];

            return [
                'id' => (int) $d->id,
                'codes' => array_map(fn ($i) => $codes[$i] ?? 'REG-'.$i, $ids),
                'decision' => $d->decision,
                'order' => array_map(fn ($i) => $codes[$i] ?? 'REG-'.$i, $ord),
                'note' => $d->note,
                'by' => $d->decided_by,
                'at' => \Illuminate\Support\Carbon::parse($d->created_at)->format('d/m/Y, H.i'),
            ];
        })->all();

        return [
            'category' => ['id' => $cid, 'name' => $this->catName($event, $cid)],
            'enabled' => (bool) $s->enabled,
            'judge_need' => $need,
            'scale' => (int) $s->scale,
            'checks' => $checks,
            'locked' => ! empty($s->finalized_at),
            'saved' => ! empty($s->saved_at),
            'saved_at' => ! empty($s->saved_at) ? \Illuminate\Support\Carbon::parse($s->saved_at)->format('d/m/Y, H.i') : null,
            'saved_by' => $s->saved_by ?? null,
            'saved_version' => (int) ($s->saved_version ?? 0),
            'history' => $this->histOf($event, $cid),
            'finalized_at' => ! empty($s->finalized_at) ? \Illuminate\Support\Carbon::parse($s->finalized_at)->format('d/m/Y, H.i') : null,
            'finalized_by' => $s->finalized_by ?? null,
            'leaves' => $leaves->map(fn ($l) => ['name' => $l->name, 'max' => (int) $l->max_score])->values()->all(),
            'info' => 'Penggabungan juri: rata-rata. Pengurangan nilai dicatat juri, lalu digabung dengan cara yang sama. Batas nilai 0 sampai '.number_format((int) $s->scale, 0, ',', '.').'. Juri dibutuhkan: '.$need.'.',
            'rows' => $rows,
            'councils' => $councils,
            'tie_log' => $tieLog,
            'penalties' => $pens->map(fn ($x) => [
                'id' => (int) $x->id,
                'team' => $codes[(int) $x->registration_id] ?? ('REG-'.$x->registration_id),
                'type' => $x->type,
                'points' => (float) $x->points,
                'reason' => $x->reason,
                'status' => $x->status,
                'created_at' => \Illuminate\Support\Carbon::parse($x->created_at)->format('d/m/Y, H.i'),
            ])->values()->all(),
        ];
    }

    public function storePenalty(Request $request, Event $event): RedirectResponse
    {
        $this->guard($request, $event);
        $cid = $this->cat($request, $event);
        if ($this->locked($event, $cid)) {
            return back()->with('error', 'Hasil sudah ditetapkan. Penalti tidak bisa ditambah lagi.');
        }
        if ($this->saved($event, $cid)) {
            return back()->with('error', 'Hasil sudah disimpan. Klik Edit di Rekap nilai kalau mau mengubah penalti.');
        }
        $data = $request->validate([
            'team' => 'required|string|max:80',
            'type' => 'required|in:Teguran,Peringatan resmi,Pengurangan nilai,Konsekuensi khusus,Pembatalan hasil,Diskualifikasi',
            'points' => 'nullable|numeric|min:0|max:1000',
            'reason' => 'required|string|min:5|max:500',
        ], ['reason.required' => 'Alasan wajib diisi.', 'reason.min' => 'Alasan wajib diisi dengan jelas.']);

        $rec = $this->recapData($event, $cid, Judging::settings($event->id, $cid));
        $row = collect($rec['rows'])->firstWhere('code', $data['team']);
        if (! $row) {
            throw ValidationException::withMessages(['team' => 'Tim tidak ditemukan di kategori ini.']);
        }
        if ($data['type'] === 'Pengurangan nilai' && (float) ($data['points'] ?? 0) <= 0) {
            throw ValidationException::withMessages(['points' => 'Isi poin pengurangan lebih dari 0.']);
        }

        DB::table('judging_penalties')->insert([
            'event_id' => $event->id, 'category_id' => $cid, 'registration_id' => $row['id'],
            'type' => $data['type'], 'points' => $data['type'] === 'Pengurangan nilai' ? (float) $data['points'] : 0,
            'reason' => trim($data['reason']), 'status' => 'diajukan',
            'created_by' => $request->user()?->name, 'created_at' => now(), 'updated_at' => now(),
        ]);

        return back()->with('success', 'Penalti dicatat dan menunggu keputusan panitia.');
    }

    public function decidePenalty(Request $request, Event $event, int $pen): RedirectResponse
    {
        $this->guard($request, $event);
        $pr = DB::table('judging_penalties')->where('id', $pen)->where('event_id', $event->id)->first();
        abort_unless($pr, 404);
        if ($this->locked($event, (int) $pr->category_id)) {
            return back()->with('error', 'Hasil sudah ditetapkan. Keputusan penalti tidak bisa diubah.');
        }
        if ($this->saved($event, (int) $pr->category_id)) {
            return back()->with('error', 'Hasil sudah disimpan. Klik Edit di Rekap nilai kalau mau mengubah keputusan penalti.');
        }
        $data = $request->validate(['status' => 'required|in:disetujui,ditolak,diajukan']);
        DB::table('judging_penalties')->where('id', $pen)->update(['status' => $data['status'], 'updated_at' => now()]);

        return back()->with('success', $data['status'] === 'disetujui' ? 'Penalti disetujui dan masuk perhitungan nilai.' : ($data['status'] === 'ditolak' ? 'Penalti ditolak.' : 'Penalti dikembalikan ke status diajukan.'));
    }

    private function lembarHtml(Event $event, int $cid, ?int $blank): string
    {
        $s = Judging::settings($event->id, $cid);
        $leaves = Judging::leaves($event->id, $cid);
        $deds = $s->deduction_enabled
            ? DB::table('judging_deductions')->where('event_id', $event->id)->where('category_id', $cid)->orderBy('sort')->orderBy('id')->get()
            : collect();
        $nf = fn ($v) => rtrim(rtrim(number_format((float) $v, 2, ',', '.'), '0'), ',');
        $catName = $this->catName($event, $cid);
        $codes = $blank === null
            ? array_values(array_map(fn ($x) => (string) $x['code'], $this->recapData($event, $cid, $s)['rows']))
            : array_fill(0, $blank, '');

        $rowsHtml = '';
        foreach ($leaves as $l) {
            $label = '<b>'.e($l->name).'</b>';
            if (! empty($l->parent_name)) {
                $label = '<span class="grp">'.e($l->parent_name).'</span><br>'.$label;
            }
            $label .= '<br><span class="sm">bobot '.$nf($l->eff_weight).'%</span>'; $label .= '<br><span class="sm">skala 0 - '.$nf((float) $l->max_score).'</span>';
            $cells = '';
            foreach ([1, 2, 3, 4, 5] as $k) {
                $cells .= '<td class="o">'.implode('', array_map(fn ($v) => '<div class="opt">'.$nf($v).'</div>', Judging::choicesByLevel((float) $l->max_score)[$k])).'</td>';
            }
            $rowsHtml .= '<tr><td class="lbl">'.$label.'</td>'.$cells.'</tr>';
        }
        $dedHtml = '';
        if ($deds->count()) {
            $items = '';
            foreach ($deds as $d) {
                $items .= '<span class="ded">[&nbsp;&nbsp;] '.e($d->name).' (-'.$nf($d->points).')</span> ';
            }
            $dedHtml = '<tr><td class="lbl"><b>Pengurangan</b><br><span class="sm">centang yang berlaku</span></td><td colspan="5">'.$items.'</td></tr>';
        }

        $blocks = '';
        foreach ($codes as $i => $code) {
            $codeHtml = $code !== '' ? e($code) : 'Kode tim: ..............................';
            $blocks .= '<div class="blk"><table class="team"><thead><tr><th class="no">No. '.($i + 1).'</th><th colspan="3">'.$codeHtml.'</th><th colspan="2" class="paraf">Paraf: ..........</th></tr><tr class="lv"><th></th><th style="font-size:9px;font-weight:normal;color:#475569;text-align:center;padding:2px 0">Level 1<br>terendah</th><th style="font-size:9px;font-weight:normal;color:#475569;text-align:center;padding:2px 0">Level 2<br></th><th style="font-size:9px;font-weight:normal;color:#475569;text-align:center;padding:2px 0">Level 3<br></th><th style="font-size:9px;font-weight:normal;color:#475569;text-align:center;padding:2px 0">Level 4<br></th><th style="font-size:9px;font-weight:normal;color:#475569;text-align:center;padding:2px 0">Level 5<br>tertinggi</th></tr></thead><tbody>'
                .$rowsHtml.$dedHtml
                .'<tr class="fin"><td class="lbl"><b>NILAI AKHIR</b></td><td colspan="5"><div class="box"></div></td></tr></tbody></table></div>';
        }
        if ($blocks === '') {
            $blocks = '<p>Belum ada peserta di kategori ini.</p>';
        }

        $css = '@page{margin:14mm 12mm}body{font-family:"DejaVu Sans",sans-serif;font-size:10px;color:#111}'
            .'h1{font-size:15px;margin:0 0 6px;color:#1e3a8a}table.meta{width:100%;border-collapse:collapse;margin-bottom:6px}.meta td{padding:1px 0;font-size:10px;vertical-align:top}.meta .k{width:55px;color:#555}'
            .'.note{border:1px solid #f0b429;background:#fff8e6;padding:5px 8px;margin:6px 0 10px;font-size:9.5px}'
            .'.blk{page-break-inside:avoid;margin-bottom:9px}table.team{border-collapse:collapse;width:100%}'
            .'.team th,.team td{border:1px solid #333;padding:3px 5px}.team thead th{background:#e5e9f2;text-align:left;font-size:10px}.team th.no{width:30%}.team th.paraf{text-align:right;font-weight:normal;color:#555}'
            .'.team td.lbl{width:30%}.team td.o{width:14%;text-align:center}.sm{color:#555;font-size:9px}.grp{color:#555;font-size:9px}'
            .'.opt{border:1px solid #333;border-radius:4px;padding:2px 0;margin:2px 0;text-align:center;font-weight:bold;font-size:11px}'
            .'.ded{margin-right:10px}.fin td{background:#f4f6fb}.box{width:110px;height:24px;border:1px solid #333;border-radius:4px;margin:0 auto;background:#fff}'
            .'table.foot{width:100%;border-collapse:collapse;margin-top:12px;page-break-inside:avoid}.foot td{vertical-align:top}.foot .cat{border:1px solid #333;height:60px;padding:4px;color:#555;width:62%}.foot .ttd{text-align:center}';

        return '<!doctype html><html lang="id"><head><meta charset="utf-8"><title>Lembar penilaian</title><style>'.$css.'</style></head><body>'
            .'<h1>LEMBAR PENILAIAN JURI</h1>'
            .'<table class="meta"><tr><td class="k">Lomba</td><td>: '.e($event->title).'</td><td class="k">Juri</td><td>: ..........................................</td></tr>'
            .'<tr><td class="k">Kategori</td><td>: '.e($catName !== '' ? $catName : 'Semua peserta').'</td><td class="k">Tanggal</td><td>: ....................... (dicetak '.now()->format('d/m/Y').')</td></tr>'
            .'<tr><td class="k">Skala</td><td colspan="3">: 0 sampai '.(int) $s->scale.' (nilai tiap kriteria dibagi 5 level, tiap level 3 pilihan)</td></tr></table>'
            .'<div class="note"><b>Cara mengisi:</b> lingkari satu angka pada setiap baris. Jangan menulis angka lain dan jangan melingkari dua angka. Tulis nilai akhir pada kotak NILAI AKHIR di tiap tim.'.($blank !== null ? ' Tulis kode tim pada kolom Kode tim.' : '').' Angka resmi tetap dihitung dari nilai yang diinput.</div>'
            .$blocks
            .'<table class="foot"><tr><td class="cat">Catatan juri:</td><td class="ttd">Juri,<br><br><br><br>(..................................)</td></tr></table>'
            .'</body></html>';
    }

    private function pdfResponse(string $html, string $name)
    {
        $pdf = new \Dompdf\Dompdf(['isRemoteEnabled' => false, 'defaultFont' => 'DejaVu Sans']);
        $pdf->loadHtml($html, 'UTF-8');
        $pdf->setPaper('A4', 'portrait');
        $pdf->render();

        return response($pdf->output(), 200, ['Content-Type' => 'application/pdf', 'Content-Disposition' => 'attachment; filename="'.$name.'"']);
    }

    public function rekapLembar(Request $request, Event $event)
    {
        $this->guard($request, $event);
        $cid = $this->cat($request, $event);

        return $this->pdfResponse($this->lembarHtml($event, $cid, null), 'lembar-penilaian-'.Str::slug($event->title.' '.$this->catName($event, $cid)).'.pdf');
    }

    public function rekapLembarKosong(Request $request, Event $event)
    {
        $this->guard($request, $event);
        $cid = $this->cat($request, $event);
        $n = max(1, min(40, (int) $request->query('jumlah', 10)));

        return $this->pdfResponse($this->lembarHtml($event, $cid, $n), 'lembar-penilaian-kosong-'.Str::slug($event->title.' '.$this->catName($event, $cid)).'.pdf');
    }

    public function rekapExcel(Request $request, Event $event)
    {
        $this->guard($request, $event);
        $cid = $this->cat($request, $event);
        $s = Judging::settings($event->id, $cid);
        $rec = $this->recapData($event, $cid, $s);
        $leaves = Judging::leaves($event->id, $cid)->values();
        $L = max(1, $leaves->count());
        $N = max(1, (int) $s->judge_count);
        $dec = (int) $s->avg_decimals;
        $mode = (string) $s->rounding;
        $rf = ['up' => 'ROUNDUP', 'down' => 'ROUNDDOWN'][$mode] ?? 'ROUND';
        $modeText = ['up' => 'selalu ke atas', 'down' => 'selalu ke bawah'][$mode] ?? 'terdekat';
        $col = fn (int $i) => \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($i);
        $catName = (string) ($rec['category']['name'] ?? '');

        $ss = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
        $in = $ss->getActiveSheet();
        $in->setTitle('Input');
        $hs = $ss->createSheet();
        $hs->setTitle('Hasil');
        $pt = $ss->createSheet();
        $pt->setTitle('Petunjuk');

        $teams = array_values($rec['rows']);
        $first = 6;
        $last = $first + count($teams) + 10 - 1;
        $yellow = 'FFFFF2CC';
        $head = 'FFE5E9F2';

        // ---------- Input ----------
        $in->setCellValue('A1', 'Input nilai juri: '.$event->title.($catName !== '' ? ' - '.$catName : ''));
        $in->setCellValue('A2', 'Ketik hanya angka yang dilingkari juri (sel kuning). Kode tim boleh diubah atau diisi untuk tim tambahan.');
        $in->setCellValue('A5', 'No');
        $in->setCellValue('B5', 'Kode tim');
        for ($j = 1; $j <= $N; $j++) {
            $s0 = 3 + ($j - 1) * $L;
            $in->setCellValue($col($s0).'4', 'Juri '.$j);
            $in->mergeCells($col($s0).'4:'.$col($s0 + $L - 1).'4');
            foreach ($leaves as $i => $l) {
                $cc = $col($s0 + $i);
                $in->setCellValue($cc.'5', $l->name."\n(maks ".(float) $l->max_score.')');
                $opts = implode(',', array_map(fn ($v) => (string) $v, Judging::choices((float) $l->max_score)));
                $dv = new \PhpOffice\PhpSpreadsheet\Cell\DataValidation();
                $dv->setType(\PhpOffice\PhpSpreadsheet\Cell\DataValidation::TYPE_LIST);
                $dv->setErrorStyle(\PhpOffice\PhpSpreadsheet\Cell\DataValidation::STYLE_STOP);
                $dv->setAllowBlank(true);
                $dv->setShowErrorMessage(true);
                $dv->setErrorTitle('Nilai tidak sah');
                $dv->setError('Pilih salah satu angka yang tersedia (yang dilingkari juri).');
                $dv->setFormula1('"'.$opts.'"');
                $in->setDataValidation($cc.$first.':'.$cc.$last, $dv);
            }
        }
        $lastIn = $col(2 + $N * $L);
        for ($i = 0; $i < count($teams) + 10; $i++) {
            $rr = $first + $i;
            $in->setCellValue('A'.$rr, $i + 1);
            $in->setCellValue('B'.$rr, $teams[$i]['code'] ?? '');
        }
        $in->getStyle('C'.$first.':'.$lastIn.$last)->getFill()->setFillType('solid')->getStartColor()->setARGB($yellow);
        $in->getStyle('B'.$first.':B'.$last)->getFill()->setFillType('solid')->getStartColor()->setARGB($yellow);
        $in->getStyle('A4:'.$lastIn.'5')->getFill()->setFillType('solid')->getStartColor()->setARGB($head);
        $in->getStyle('A1')->getFont()->setBold(true)->setSize(14);
        $in->getStyle('A4:'.$lastIn.'5')->getFont()->setBold(true);
        $in->getStyle('A4:'.$lastIn.$last)->getAlignment()->setHorizontal('center')->setVertical('center')->setWrapText(true);
        $in->getStyle('A4:'.$lastIn.$last)->getBorders()->getAllBorders()->setBorderStyle('thin');
        $in->getColumnDimension('A')->setWidth(5);
        $in->getColumnDimension('B')->setWidth(24);
        for ($i = 3; $i <= 2 + $N * $L; $i++) {
            $in->getColumnDimension($col($i))->setWidth(14);
        }
        $in->getRowDimension(5)->setRowHeight(42);
        $in->freezePane('C'.$first);

        // ---------- Hasil ----------
        $cCnt = 3 + $N;
        $cAvg = 4 + $N;
        $cDed = 5 + $N;
        $cPen = 6 + $N;
        $cFin = 7 + $N;
        $cRank = 8 + $N;
        $cSeri = 9 + $N;
        $cStat = 10 + $N;
        $hs->setCellValue('A1', 'Hasil hitung: '.$event->title.($catName !== '' ? ' - '.$catName : ''));
        $hs->setCellValue('A2', 'Kolom kuning (Pengurangan dan Penalti) diisi panitia. Kolom lain dihitung otomatis dari sheet Input.');
        $hs->setCellValue('A5', 'No');
        $hs->setCellValue('B5', 'Kode tim');
        for ($j = 1; $j <= $N; $j++) {
            $hs->setCellValue($col(2 + $j).'5', 'Total juri '.$j);
        }
        foreach ([$cCnt => 'Juri lengkap', $cAvg => 'Nilai dasar (rata-rata)', $cDed => 'Pengurangan (poin)', $cPen => 'Penalti (poin)', $cFin => 'Nilai akhir', $cRank => 'Peringkat', $cSeri => 'Seri?', $cStat => 'Status'] as $ci => $t) {
            $hs->setCellValue($col($ci).'5', $t);
        }
        $finR = $col($cFin).$first.':'.$col($cFin).$last;
        for ($i = 0; $i < count($teams) + 10; $i++) {
            $rr = $first + $i;
            $hs->setCellValue('A'.$rr, '=Input!A'.$rr);
            $hs->setCellValue('B'.$rr, '=IF(Input!B'.$rr.'="","",Input!B'.$rr.')');
            for ($j = 1; $j <= $N; $j++) {
                $s0 = 3 + ($j - 1) * $L;
                $rng = 'Input!'.$col($s0).$rr.':'.$col($s0 + $L - 1).$rr;
                $hs->setCellValue($col(2 + $j).$rr, '=IF(COUNT('.$rng.')='.$L.',SUM('.$rng.'),"")');
            }
            $jr = $col(3).$rr.':'.$col(2 + $N).$rr;
            $cnt = $col($cCnt).$rr;
            $avg = $col($cAvg).$rr;
            $fin = $col($cFin).$rr;
            $hs->setCellValue($cnt, '=COUNT('.$jr.')');
            $hs->setCellValue($avg, '=IF('.$cnt.'=0,"",'.$rf.'(AVERAGE('.$jr.'),'.$dec.'))');
            $pen = (float) ($teams[$i]['penalty'] ?? 0);
            if ($pen > 0) {
                $hs->setCellValue($col($cPen).$rr, $pen);
            }
            $hs->setCellValue($fin, '=IF(OR(B'.$rr.'="",'.$cnt.'<'.$N.'),"",MAX(0,'.$rf.'('.$avg.'-N('.$col($cDed).$rr.')-N('.$col($cPen).$rr.'),'.$dec.')))');
            $hs->setCellValue($col($cRank).$rr, '=IF('.$fin.'="","",COUNTIF('.$finR.',">"&'.$fin.')+1)');
            $hs->setCellValue($col($cSeri).$rr, '=IF('.$fin.'="","",IF(COUNTIF('.$finR.','.$fin.')>1,"SERI",""))');
            $hs->setCellValue($col($cStat).$rr, '=IF(B'.$rr.'="","",IF('.$cnt.'=0,"belum",IF('.$cnt.'<'.$N.',"sebagian","selesai")))');
        }
        $lastH = $col($cStat);
        $hs->getStyle($col($cDed).$first.':'.$col($cPen).$last)->getFill()->setFillType('solid')->getStartColor()->setARGB($yellow);
        $hs->getStyle('A5:'.$lastH.'5')->getFill()->setFillType('solid')->getStartColor()->setARGB($head);
        $hs->getStyle('A1')->getFont()->setBold(true)->setSize(14);
        $hs->getStyle('A5:'.$lastH.'5')->getFont()->setBold(true);
        $hs->getStyle($col($cFin).$first.':'.$col($cFin).$last)->getFont()->setBold(true);
        $hs->getStyle('A5:'.$lastH.$last)->getAlignment()->setHorizontal('center')->setVertical('center')->setWrapText(true);
        $hs->getStyle('A5:'.$lastH.$last)->getBorders()->getAllBorders()->setBorderStyle('thin');
        $hs->getColumnDimension('A')->setWidth(5);
        $hs->getColumnDimension('B')->setWidth(24);
        for ($i = 3; $i <= $cStat; $i++) {
            $hs->getColumnDimension($col($i))->setWidth(15);
        }
        $hs->getRowDimension(5)->setRowHeight(32);
        $hs->freezePane('C'.$first);

        // ---------- Petunjuk ----------
        $lines = [
            ['Petunjuk hitung manual', null],
            ['Lomba', $event->title],
            ['Kategori', $catName !== '' ? $catName : 'Semua peserta'],
            ['Skala nilai', '0 sampai '.(int) $s->scale],
            ['Juri dibutuhkan', $N],
            ['Desimal nilai rata-rata', $dec],
            ['Pembulatan', $modeText],
            ['', ''],
            ['Cara pakai', null],
            ['1', 'Buka sheet Input. Ketik angka yang dilingkari juri pada sel kuning, per tim dan per juri. Dropdown hanya menerima angka yang sah.'],
            ['2', 'Tim yang mendaftar belakangan: isi kode tim pada baris cadangan di bawah daftar.'],
            ['3', 'Buka sheet Hasil. Isi Pengurangan dan Penalti (poin) kalau ada. Isi Pengurangan sebagai total poin yang dikurangkan, sesuai catatan juri dan aturan lomba.'],
            ['4', 'Nilai akhir muncul setelah semua juri yang dibutuhkan lengkap. Peringkat dihitung dari nilai akhir.'],
            ['5', 'Tim bertanda SERI diputuskan manual oleh panitia atau dewan juri sesuai aturan lomba. Excel tidak memutuskan seri.'],
            ['', ''],
            ['Rumus', 'Total juri = jumlah nilai semua kriteria. Dasar = rata-rata total juri yang lengkap, dibulatkan. Akhir = bulatkan(dasar - pengurangan - penalti), minimal 0.'],
            ['', ''],
            ['Kriteria', 'Pilihan angka yang boleh dilingkari'],
        ];
        $rowN = 1;
        foreach ($lines as [$k, $v]) {
            $pt->setCellValue('A'.$rowN, $k);
            if ($v !== null) {
                $pt->setCellValue('B'.$rowN, $v);
            }
            $rowN++;
        }
        foreach ($leaves as $l) {
            $opts = implode(', ', Judging::choices((float) $l->max_score));
            $pt->setCellValue('A'.$rowN, ($l->parent_name ? $l->parent_name.' / ' : '').$l->name.' (bobot '.round((float) $l->eff_weight, 2).'%, skala 0 - '.round((float) $l->max_score).')');
            $pt->setCellValue('B'.$rowN, $opts);
            $rowN++;
        }
        $pt->getColumnDimension('A')->setWidth(34);
        $pt->getColumnDimension('B')->setWidth(100);
        $pt->getStyle('A1:A'.$rowN)->getFont()->setBold(true);
        $pt->getStyle('A1')->getFont()->setSize(14);
        $pt->getStyle('B1:B'.$rowN)->getAlignment()->setWrapText(true);
        $pt->getStyle('A1:B'.$rowN)->getAlignment()->setVertical('top');

        $ss->setActiveSheetIndex(0);
        $name = 'hitung-nilai-'.Str::slug($event->title.' '.$catName).'.xlsx';

        return response()->streamDownload(function () use ($ss) {
            (new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($ss))->save('php://output');
        }, $name, ['Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']);
    }

    private function locked(Event $event, int $cid): bool
    {
        return ! empty(Judging::settings($event->id, $cid)->finalized_at);
    }

    private function judgeLocked(Event $event, int $judgeId): bool
    {
        $cid = (int) DB::table('judges')->where('id', $judgeId)->value('category_id');
        if ($cid < 0) {
            return false;
        }

        return $this->locked($event, $cid);
    }

    public function finalizeResult(Request $request, Event $event): RedirectResponse
    {
        $this->guard($request, $event);
        return back()->with('error', 'Penetapan dilakukan di tab Penetapan & SK. Di Rekap nilai gunakan Simpan hasil.');
        $cid = $this->cat($request, $event);
        $data = $request->validate(['confirm_deduction' => 'nullable|boolean']);
        $s = Judging::settings($event->id, $cid);
        $name = $this->catName($event, $cid);
        $for = $name !== '' ? " kategori {$name}" : '';

        if (! empty($s->finalized_at)) {
            return back()->with('error', "Hasil{$for} sudah ditetapkan.");
        }
        if (! $s->enabled) {
            return back()->with('error', "Sahkan penilaian{$for} dulu sebelum menetapkan hasil.");
        }

        $rec = $this->recapData($event, $cid, $s);
        $failed = [];
        foreach ($rec['checks'] as $ch) {
            $ok = $ch['ok'];
            if ($ch['key'] === 'deduction' && ! empty($ch['manual']) && $ok && ! $request->boolean('confirm_deduction')) {
                $ok = false;
                $ch['detail'] = 'Konfirmasi pelaksanaan pengurangan nilai belum dicentang.';
            }
            if (! $ok) {
                $failed[] = $ch['title'].' ('.$ch['detail'].')';
            }
        }
        if ($failed) {
            return back()->with('error', 'Hasil belum bisa ditetapkan: '.implode(' ', $failed));
        }

        DB::table('judging_settings')->where('event_id', $event->id)->where('category_id', $cid)->update([
            'finalized_at' => now(), 'finalized_by' => $request->user()?->name, 'updated_at' => now(),
        ]);

        return back()->with('success', "Hasil{$for} ditetapkan dan tidak bisa diubah lagi.");
    }

    /** Pecah kelompok yang seri level demi level. Mengembalikan daftar kelompok berurutan (terbaik dulu); kelompok yang masih >1 anggota harus diputuskan dewan juri. */
    private function tieSplit(array $group, int $level, array $labels, array &$info): array
    {
        if (count($group) < 2) {
            return [$group];
        }
        if ($level >= count($labels)) {
            foreach ($group as $it) {
                $info[$it['id']]['council'] = true;
            }

            return [$group];
        }
        $by = [];
        foreach ($group as $it) {
            $by[(string) $it['v'][$level]][] = $it;
        }
        krsort($by, SORT_NUMERIC);
        $top = (string) array_key_first($by);
        $cmp = array_map(fn ($it) => ['code' => $it['code'], 'value' => $it['v'][$level]], $group);
        foreach ($group as $it) {
            $val = (string) $it['v'][$level];
            $info[$it['id']]['trail'][] = [
                'label' => $labels[$level],
                'value' => $it['v'][$level],
                'cmp' => $cmp,
                'result' => count($by) === 1 ? 'sama' : ($val === $top ? 'unggul' : 'kalah'),
            ];
        }
        $out = [];
        foreach ($by as $sub) {
            if (count($sub) === 1) {
                $info[$sub[0]['id']]['by'] ??= $labels[$level];
            }
            foreach ($this->tieSplit($sub, $level + 1, $labels, $info) as $b) {
                $out[] = $b;
            }
        }

        return $out;
    }

    public function storeTie(Request $request, Event $event): RedirectResponse
    {
        $this->guard($request, $event);
        $cid = $this->cat($request, $event);
        if ($this->locked($event, $cid)) {
            return back()->with('error', 'Hasil sudah ditetapkan. Keputusan dewan juri tidak bisa ditambah lagi.');
        }
        if ($this->saved($event, $cid)) {
            return back()->with('error', 'Hasil sudah disimpan. Klik Edit di Rekap nilai kalau mau mengubah keputusan dewan juri.');
        }
        $data = $request->validate([
            'key' => 'required|string|max:150',
            'decision' => 'required|in:bersama,ulang,urut',
            'order' => 'nullable|array',
            'order.*' => 'integer',
            'note' => 'required|string|min:5|max:500',
        ], ['note.required' => 'Catatan keputusan wajib diisi.', 'note.min' => 'Catatan keputusan wajib diisi dengan jelas.']);

        $rec = $this->recapData($event, $cid, Judging::settings($event->id, $cid));
        $co = collect($rec['councils'])->firstWhere('key', $data['key']);
        if (! $co) {
            throw ValidationException::withMessages(['key' => 'Seri ini sudah tidak berlaku karena nilai berubah. Muat ulang halaman.']);
        }
        $order = null;
        if ($data['decision'] === 'urut') {
            $order = array_map('intval', $data['order'] ?? []);
            $chk = $order;
            sort($chk);
            if ($chk !== $co['ids']) {
                throw ValidationException::withMessages(['order' => 'Urutan harus memuat semua tim yang seri, tanpa duplikat.']);
            }
        }
        DB::table('judging_tie_decisions')->insert([
            'event_id' => $event->id, 'category_id' => $cid, 'group_key' => $data['key'],
            'ids_json' => json_encode($co['ids']), 'decision' => $data['decision'],
            'order_json' => $order ? json_encode($order) : null,
            'note' => trim($data['note']), 'decided_by' => $request->user()?->name,
            'created_at' => now(), 'updated_at' => now(),
        ]);
        $label = ['bersama' => 'Juara bersama dicatat.', 'ulang' => 'Tanding ulang dicatat. Hasil belum bisa ditetapkan sampai ada keputusan akhir.', 'urut' => 'Hasil tanding ulang dicatat dan urutan diterapkan.'][$data['decision']];

        return back()->with('success', $label);
    }

    /** Sistem penilaian terpilih untuk satu event. Event lama yang sudah punya data dianggap 'weighted'. */
    private function systemOf(Event $event): ?string
    {
        $row = DB::table('judging_systems')->where('event_id', $event->id)->where('category_id', 0)->first();
        if ($row) {
            return $row->system ?: null;
        }
        foreach (Judging::categories($event->id) as $k) {
            $kid = (int) $k['id'];
            if (Judging::settings($event->id, $kid)->enabled
                || Judging::criteria($event->id, $kid)->count() > 0
                || DB::table('judges')->where('event_id', $event->id)->where('category_id', $kid)->exists()) {
                return 'weighted';
            }
        }

        return null;
    }

    /** Alasan sistem tidak boleh diubah, atau null kalau masih boleh. */
    private function systemLockReason(Event $event): ?string
    {
        $names = [];
        foreach (Judging::categories($event->id) as $k) {
            if (Judging::settings($event->id, (int) $k['id'])->enabled) {
                $names[] = trim((string) ($k['name'] ?? '')) ?: 'event ini';
            }
        }
        if ($names) {
            return 'kategori '.implode(', ', $names).' sudah disahkan (buka kunci kategorinya dulu di tab Pengaturan penilaian)';
        }
        $judgeIds = DB::table('judges')->where('event_id', $event->id)->pluck('id')->all();
        if ($judgeIds && DB::table('judging_scores')->whereIn('judge_id', $judgeIds)->exists()) {
            return 'nilai juri sudah masuk';
        }

        return null;
    }

    public function setSystem(Request $request, Event $event): RedirectResponse
    {
        $this->guard($request, $event);
        $data = $request->validate(['system' => 'nullable|in:weighted']);
        if ($reason = $this->systemLockReason($event)) {
            return back()->with('error', 'Sistem penilaian tidak bisa diubah karena '.$reason.'.');
        }
        DB::table('judging_systems')->updateOrInsert(
            ['event_id' => $event->id, 'category_id' => 0],
            ['system' => $data['system'] ?? null, 'created_at' => now(), 'updated_at' => now()]
        );

        return back()->with('success', ($data['system'] ?? null) ? 'Sistem penilaian dipilih.' : 'Pilihan sistem penilaian dibatalkan.');
    }

    /** SK satu lomba (sub-event): memuat semua kategorinya. Kalau sudah ditetapkan, dibaca dari salinan beku. */
    private function skLombaData(Event $event): array
    {
        $institution = (string) ($event->institution->name ?? '');
        $parentTitle = $event->parent_id ? DB::table('events')->where('id', $event->parent_id)->value('title') : null;
        $stored = DB::table('judging_sk')->where('event_id', $event->id)->first();
        $letter = $stored ? [
            'number' => (string) $stored->number,
            'date' => \Illuminate\Support\Carbon::parse($stored->sk_date)->toDateString(),
            'signer_name' => (string) $stored->signer_name,
            'signer_position' => (string) $stored->signer_position,
            'finalized_at' => ! empty($stored->finalized_at) ? \Illuminate\Support\Carbon::parse($stored->finalized_at)->format('d/m/Y, H.i') : null,
            'finalized_by' => $stored->finalized_by,
        ] : null;
        $head = ['institution' => $institution, 'title' => $event->title, 'parent_title' => $parentTitle];

        if ($stored && ! empty($stored->finalized_at)) {
            $snap = json_decode((string) $stored->snapshot_json, true) ?: [];

            return $head + [
                'categories' => $snap['categories'] ?? [],
                'blockers' => [], 'warnings' => [],
                'progress' => $snap['progress'] ?? ['done' => 0, 'total' => 0],
                'finalized' => true, 'letter' => $letter,
            ];
        }

        $blockers = [];
        $warnings = [];
        $cats = [];
        $done = 0;
        $total = 0;
        if ($this->systemOf($event) === null) {
            $blockers[] = 'Belum memilih sistem penilaian.';
        }
        foreach (Judging::categories($event->id) as $k) {
            $kid = (int) $k['id'];
            $rec = $this->recapData($event, $kid, Judging::settings($event->id, $kid));
            if (count($rec['rows']) === 0) {
                continue;
            }
            $label = $kid > 0 ? $k['name'] : $event->title;
            $total++;
            $useRows = $rec['rows'];
            if (! empty($rec['saved'])) {
                $snapRows = $this->savedSnapshot($event, $kid)['rows'] ?? null;
                if (is_array($snapRows)) {
                    $useRows = $snapRows;
                }
            }
            if ($rec['locked'] || ! empty($rec['saved'])) {
                $done++;
            } else {
                $blockers[] = $label.': hasil belum disimpan di Rekap nilai.';
            }
            $unranked = count(array_filter($useRows, fn ($r) => $r['rank'] === null && $r['status'] === 'selesai'));
            if ($unranked > 0) {
                $warnings[] = $label.': '.$unranked.' tim tidak mendapat peringkat (diskualifikasi atau dibatalkan) dan tidak dicantumkan di SK.';
            }
            $ranked = [];
            $table = [];
            foreach ($useRows as $r) {
                $table[] = [
                    'rank' => $r['rank'], 'shared' => (bool) ($r['rank_shared'] ?? false),
                    'code' => $r['code'], 'name' => (string) ($r['name'] ?? ''), 'school' => (string) ($r['school'] ?? ''),
                    'order' => $r['order'] ?? null, 'judges_done' => (int) $r['judges_done'],
                    'base' => $r['base'], 'deduction' => $r['deduction'], 'penalty' => $r['penalty'],
                    'score' => $r['score'], 'provisional' => (bool) $r['provisional'], 'status' => $r['status'],
                ];
                if ($r['rank'] !== null && $r['score'] !== null) {
                    $ranked[] = [
                        'rank' => (int) $r['rank'], 'shared' => (bool) ($r['rank_shared'] ?? false),
                        'code' => $r['code'], 'name' => (string) ($r['name'] ?? ''), 'school' => (string) ($r['school'] ?? ''),
                        'score' => $r['score'],
                    ];
                }
            }
            $cats[] = [
                'id' => $kid, 'name' => $kid > 0 ? $k['name'] : '', 'locked' => (bool) $rec['locked'], 'saved' => ! empty($rec['saved']),
                'need' => (int) $rec['judge_need'], 'unranked' => $unranked, 'rows' => $ranked, 'table' => $table,
            ];
        }
        if ($total === 0) {
            $blockers[] = 'Belum ada kategori dengan peserta.';
        }

        return $head + [
            'categories' => $cats, 'blockers' => $blockers, 'warnings' => $warnings,
            'progress' => ['done' => $done, 'total' => $total],
            'finalized' => false, 'letter' => $letter,
        ];
    }

    public function finalizeSkLomba(Request $request, Event $event): RedirectResponse
    {
        $this->guard($request, $event);
        if ($event->parent_id !== null) {
            return back()->with('error', 'SK ditetapkan di event utama, bukan di sub-event.');
        }
        $data = $request->validate([
            'number' => 'required|string|max:100',
            'date' => 'required|date',
            'signer_name' => 'required|string|max:150',
            'signer_position' => 'required|string|max:150',
            'confirm' => 'accepted',
        ], [
            'number.required' => 'Nomor SK wajib diisi.', 'date.required' => 'Tanggal SK wajib diisi.',
            'signer_name.required' => 'Nama penandatangan wajib diisi.', 'signer_position.required' => 'Jabatan penandatangan wajib diisi.',
            'confirm.accepted' => 'Centang konfirmasi pemeriksaan SK dulu.',
        ]);
        if (DB::table('judging_sk')->where('event_id', $event->id)->whereNotNull('finalized_at')->exists()) {
            return back()->with('error', 'SK lomba ini sudah ditetapkan.');
        }
        $pre = $this->skLombaData($event);
        if ($pre['blockers']) {
            return back()->with('error', 'SK belum bisa ditetapkan: '.implode(' ', $pre['blockers']));
        }

        DB::transaction(function () use ($event, $data, $request) {
            foreach (Judging::categories($event->id) as $k) {
                $kid = (int) $k['id'];
                $s = Judging::settings($event->id, $kid);
                if (! empty($s->finalized_at) || count(Judging::participants($event->id, $kid)) === 0) {
                    continue;
                }
                DB::table('judging_settings')->where('event_id', $event->id)->where('category_id', $kid)->update([
                    'finalized_at' => now(), 'finalized_by' => $request->user()?->name, 'updated_at' => now(),
                ]);
            }
            $live = $this->skLombaData($event);
            DB::table('judging_sk')->updateOrInsert(
                ['event_id' => $event->id],
                [
                    'number' => trim($data['number']), 'sk_date' => $data['date'],
                    'signer_name' => trim($data['signer_name']), 'signer_position' => trim($data['signer_position']),
                    'snapshot_json' => json_encode(['categories' => $live['categories'], 'progress' => $live['progress']]),
                    'finalized_at' => now(), 'finalized_by' => $request->user()?->name,
                    'created_at' => now(), 'updated_at' => now(),
                ]
            );
        });

        return back()->with('success', 'SK ditetapkan. Hasil semua kategori lomba ini sudah terkunci.');
    }

    private function saved(Event $event, int $cid): bool
    {
        return ! empty(Judging::settings($event->id, $cid)->saved_at);
    }

    /** Riwayat penyimpanan dan pembukaan kembali hasil satu kategori (terbaru dulu). */
    private function histOf(Event $event, int $cid): array
    {
        return DB::table('judging_result_history')->where('event_id', $event->id)->where('category_id', $cid)
            ->orderByDesc('id')->limit(50)->get(['id', 'version', 'action', 'reason', 'actor', 'created_at'])
            ->map(fn ($h) => [
                'id' => (int) $h->id, 'version' => (int) $h->version, 'action' => (string) $h->action,
                'reason' => $h->reason, 'actor' => $h->actor,
                'at' => \Illuminate\Support\Carbon::parse($h->created_at)->format('d/m/Y, H.i'),
            ])->values()->all();
    }

    /** Salinan hasil dari versi yang sedang tersimpan. Null kalau belum disimpan. */
    private function savedSnapshot(Event $event, int $cid): ?array
    {
        $s = Judging::settings($event->id, $cid);
        if (empty($s->saved_at)) {
            return null;
        }
        $h = DB::table('judging_result_history')->where('event_id', $event->id)->where('category_id', $cid)
            ->where('action', 'simpan')->where('version', (int) $s->saved_version)->orderByDesc('id')->first();

        return $h ? (json_decode((string) $h->snapshot_json, true) ?: null) : null;
    }

    /** Simpan hasil: membekukan nilai, penalti, dan keputusan seri sebagai satu versi di riwayat. */
    public function saveResult(Request $request, Event $event): RedirectResponse
    {
        $this->guard($request, $event);
        $cid = $this->cat($request, $event);
        $request->validate(['confirm_deduction' => 'nullable|boolean']);
        $s = Judging::settings($event->id, $cid);
        $name = $this->catName($event, $cid);
        $for = $name !== '' ? " kategori {$name}" : '';

        if (! empty($s->finalized_at)) {
            return back()->with('error', "Hasil{$for} sudah ditetapkan dan tidak bisa diubah.");
        }
        if (! empty($s->saved_at)) {
            return back()->with('error', "Hasil{$for} sudah disimpan. Buka kunci dulu kalau ada perubahan.");
        }
        if (! $s->enabled) {
            return back()->with('error', "Sahkan penilaian{$for} dulu sebelum menyimpan hasil.");
        }

        $rec = $this->recapData($event, $cid, $s);
        $failed = [];
        foreach ($rec['checks'] as $ch) {
            $ok = $ch['ok'];
            if ($ch['key'] === 'deduction' && ! empty($ch['manual']) && $ok && ! $request->boolean('confirm_deduction')) {
                $ok = false;
                $ch['detail'] = 'Konfirmasi pelaksanaan pengurangan nilai belum dicentang.';
            }
            if (! $ok) {
                $failed[] = $ch['title'].' ('.$ch['detail'].')';
            }
        }
        if ($failed) {
            return back()->with('error', 'Hasil belum bisa disimpan: '.implode(' ', $failed));
        }

        $version = (int) ($s->saved_version ?? 0) + 1;
        $snap = [
            'rows' => array_map(fn ($r) => [
                'rank' => $r['rank'], 'rank_shared' => (bool) ($r['rank_shared'] ?? false), 'id' => $r['id'], 'code' => $r['code'],
                'name' => (string) ($r['name'] ?? ''), 'school' => (string) ($r['school'] ?? ''), 'order' => $r['order'] ?? null,
                'judges_done' => $r['judges_done'], 'base' => $r['base'], 'deduction' => $r['deduction'], 'penalty' => $r['penalty'],
                'score' => $r['score'], 'final' => $r['final'] ?? null, 'provisional' => (bool) $r['provisional'],
                'status' => $r['status'], 'tie_text' => $r['tie_text'] ?? '',
            ], $rec['rows']),
            'penalties' => $rec['penalties'],
            'councils' => $rec['councils'],
        ];
        $by = $request->user()?->name;

        DB::transaction(function () use ($event, $cid, $version, $snap, $by) {
            DB::table('judging_settings')->where('event_id', $event->id)->where('category_id', $cid)->update([
                'saved_at' => now(), 'saved_by' => $by, 'saved_version' => $version, 'updated_at' => now(),
            ]);
            DB::table('judging_result_history')->insert([
                'event_id' => $event->id, 'category_id' => $cid, 'version' => $version, 'action' => 'simpan',
                'reason' => null, 'actor' => $by, 'snapshot_json' => json_encode($snap),
                'created_at' => now(), 'updated_at' => now(),
            ]);
        });

        return back()->with('success', "Hasil{$for} disimpan sebagai versi {$version}. Penalti, keputusan seri, dan nilai juri terkunci sampai Anda menekan Edit.");
    }

    /** Edit: membuka kembali hasil yang sudah disimpan. Alasan wajib dan tercatat di riwayat. */
    public function reopenResult(Request $request, Event $event): RedirectResponse
    {
        $this->guard($request, $event);
        $cid = $this->cat($request, $event);
        $data = $request->validate(
            ['reason' => 'required|string|min:5|max:500'],
            ['reason.required' => 'Alasan wajib diisi.', 'reason.min' => 'Alasan wajib diisi dengan jelas.']
        );
        $s = Judging::settings($event->id, $cid);

        if (! empty($s->finalized_at)) {
            return back()->with('error', 'Hasil sudah ditetapkan di Penetapan & SK dan tidak bisa dibuka kembali.');
        }
        if (empty($s->saved_at)) {
            return back()->with('error', 'Hasil belum disimpan, jadi tidak perlu dibuka kembali.');
        }
        $by = $request->user()?->name;

        DB::transaction(function () use ($event, $cid, $s, $data, $by) {
            DB::table('judging_settings')->where('event_id', $event->id)->where('category_id', $cid)->update([
                'saved_at' => null, 'saved_by' => null, 'updated_at' => now(),
            ]);
            DB::table('judging_result_history')->insert([
                'event_id' => $event->id, 'category_id' => $cid, 'version' => (int) $s->saved_version, 'action' => 'buka_kembali',
                'reason' => trim($data['reason']), 'actor' => $by, 'snapshot_json' => null,
                'created_at' => now(), 'updated_at' => now(),
            ]);
        });

        return back()->with('success', 'Hasil dibuka kembali untuk diedit. Simpan hasil lagi setelah perubahan selesai.');
    }
}
