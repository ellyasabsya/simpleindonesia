<?php

namespace App\Http\Controllers;

use App\Support\Judging;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class JudgePublicController extends Controller
{
    private function judge(string $token): object
    {
        $j = DB::table('judges')->where('token', $token)->first();
        abort_unless($j, 404);

        return $j;
    }

    public function show(Request $request, string $token): Response
    {
        $j = $this->judge($token);
        $cid = (int) $j->category_id;
        $ev = DB::table('events')->where('id', $j->event_id)->first(['id', 'title']);
        if ($request->filled('peserta') && (int) $j->category_id >= 0) {
            return $this->pesertaPage($request, $token, $j, $ev);
        }
        if ($cid < 0) {
            return Inertia::render('juri/nilai', [
                'token' => $token,
                'judge' => ['name' => $j->name, 'active' => (bool) $j->active],
                'event' => ['title' => $ev->title.' - belum ditugaskan'],
                'enabled' => false, 'scale' => 100, 'criteria' => [], 'participants' => [], 'scores' => (object) [],
            ]);
        }
        $s = Judging::settings($j->event_id, $cid);
        $crit = Judging::leaves($j->event_id, $cid);
        $catName = $cid > 0 ? DB::table('event_participant_categories')->where('id', $cid)->value('name') : null;

        $scores = [];
        foreach (DB::table('judging_scores')->where('judge_id', $j->id)->get() as $sc) {
            $scores[(int) $sc->registration_id][(int) $sc->criterion_id] = (float) $sc->score;
        }

        return Inertia::render('juri/nilai', [
            'token' => $token,
            'judge' => ['name' => $j->name, 'active' => (bool) $j->active],
            'event' => ['title' => $ev->title.($catName ? ' - '.$catName : '')],
            'enabled' => (bool) $s->enabled && (bool) $s->judging_open && empty($s->saved_at) && empty($s->finalized_at),
            'scale' => (int) $s->scale,
            'criteria' => $crit->map(fn ($c) => ['id' => (int) $c->id, 'name' => $c->name, 'description' => $c->description, 'weight' => round((float) $c->eff_weight, 2), 'max_score' => (int) $c->max_score, 'group' => $c->parent_name])->values(),
            'participants' => array_map(fn ($p) => ['name' => $p['code'], 'school' => null] + $p, Judging::participants($j->event_id, $cid)),
            'scores' => (object) $scores,
        ]);
    }

    private function pesertaPage(Request $request, string $token, object $j, object $ev): Response
    {
        $cid = (int) $j->category_id;
        $s = Judging::settings($j->event_id, $cid);
        $crit = Judging::leaves($j->event_id, $cid);
        $catName = $cid > 0 ? DB::table('event_participant_categories')->where('id', $cid)->value('name') : null;
        $list = collect(Judging::participants($j->event_id, $cid))->map(fn ($p) => ['name' => $p['code'], 'school' => null] + $p);
        $reg = (int) $request->query('peserta');
        $idx = $list->search(fn ($x) => $x['id'] === $reg);
        abort_unless($idx !== false, 404);

        $mine = [];
        foreach (DB::table('judging_scores')->where('judge_id', $j->id)->where('registration_id', $reg)->get() as $sc) {
            $mine[(int) $sc->criterion_id] = (float) $sc->score;
        }

        return Inertia::render('juri/peserta', [
            'token' => $token,
            'judge' => ['name' => $j->name, 'active' => (bool) $j->active],
            'event' => ['title' => $ev->title.($catName ? ' - '.$catName : '')],
            'enabled' => (bool) $s->enabled && (bool) $s->judging_open && empty($s->saved_at) && empty($s->finalized_at),
            'scale' => (int) $s->scale,
            'criteria' => $crit->map(fn ($c) => ['id' => (int) $c->id, 'name' => $c->name, 'description' => $c->description, 'weight' => round((float) $c->eff_weight, 2), 'max_score' => (int) $c->max_score, 'group' => $c->parent_name])->values(),
            'participant' => $list->get($idx),
            'position' => ['index' => $idx + 1, 'total' => $list->count()],
            'prev' => $list->get($idx - 1)['id'] ?? null,
            'next' => $list->get($idx + 1)['id'] ?? null,
            'scores' => (object) $mine,
        ]);
    }

    public function store(Request $request, string $token): RedirectResponse
    {
        $j = $this->judge($token);
        $cid = (int) $j->category_id;
        abort_unless($cid >= 0, 403);
        abort_unless($j->active, 403);
        abort_unless(Judging::settings($j->event_id, $cid)->enabled && Judging::settings($j->event_id, $cid)->judging_open, 403);
        $lk = Judging::settings($j->event_id, $cid);
        if (! empty($lk->finalized_at) || ! empty($lk->saved_at)) {
            throw ValidationException::withMessages(['scores' => 'Penilaian kategori ini sudah dikunci oleh panitia. Nilai tidak bisa diubah lagi.']);
        }
        abort_unless(! Judging::problems($j->event_id, $cid), 403);

        $crit = Judging::leaves($j->event_id, $cid);
        $reg = (int) $request->input('registration_id');
        $part = collect(Judging::participants($j->event_id, $cid))->firstWhere('id', $reg);
        abort_unless($part, 404);
        if (strtoupper(trim((string) $request->input('confirm_code'))) !== strtoupper((string) $part['code_tail'])) {
            throw ValidationException::withMessages(['scores' => 'Kode konfirmasi tidak cocok dengan peserta '.$part['code'].'. Nilai tidak dikirim.']);
        }

        $in = (array) $request->input('scores', []);
        foreach ($crit as $c) {
            $v = $in[$c->id] ?? null;
            $ok = is_numeric($v);
            if ($ok) {
                $ok = false;
                foreach (Judging::choices((float) $c->max_score) as $ch) {
                    if (abs($ch - (float) $v) < 0.01) {
                        $ok = true;
                    }
                }
            }
            if (! $ok) {
                throw ValidationException::withMessages(['scores' => "Pilih salah satu nilai untuk {$c->name}."]);
            }
        }
        DB::transaction(function () use ($crit, $j, $reg, $in) {
            DB::table('judging_scores')->where('judge_id', $j->id)->where('registration_id', $reg)->whereNotIn('criterion_id', $crit->pluck('id')->all())->delete();
            foreach ($crit as $c) {
                DB::table('judging_scores')->updateOrInsert(
                    ['judge_id' => $j->id, 'registration_id' => $reg, 'criterion_id' => $c->id],
                    ['event_id' => $j->event_id, 'score' => (float) $in[$c->id], 'created_at' => now(), 'updated_at' => now()],
                );
            }
        });

        return redirect('/juri/'.$token)->with('success', 'Nilai '.$part['code'].' terkirim.');
    }
}
