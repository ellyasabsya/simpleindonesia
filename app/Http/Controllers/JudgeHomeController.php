<?php

namespace App\Http\Controllers;

use App\Support\Judging;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class JudgeHomeController extends Controller
{
    public function index(Request $request)
    {
        $uid = $request->user()->id;

        $all = DB::table('judges')->where('user_id', $uid)->where('active', 1)->orderByDesc('id')->get();
        $assigned = $all->where('category_id', '!=', -1);
        $waiting = $all->where('category_id', -1)->pluck('event_id')->unique()->values();

        $ids = $all->pluck('event_id')->unique()->values();
        $events = DB::table('events')->whereIn('id', $ids)->get(['id', 'title', 'parent_id'])->keyBy('id');
        $parents = DB::table('events')->whereIn('id', $events->pluck('parent_id')->filter()->unique())->pluck('title', 'id');

        $rows = $assigned->map(function ($j) use ($events, $parents) {
            $e = $events->get($j->event_id);
            $eid = (int) $j->event_id;
            $cid = (int) $j->category_id;
            $cat = collect(Judging::categories($eid))->firstWhere('id', $cid)['name'] ?? null;

            // Progres: peserta dianggap selesai kalau semua kriteria sudah diberi nilai oleh juri ini.
            $critIds = Judging::leaves($eid, $cid)->pluck('id')->map(fn ($i) => (int) $i)->all();
            $partIds = collect(Judging::participants($eid, $cid))->pluck('id')->map(fn ($i) => (int) $i)->all();
            $filled = $critIds
                ? DB::table('judging_scores')->where('judge_id', $j->id)->whereIn('criterion_id', $critIds)
                    ->selectRaw('registration_id, COUNT(DISTINCT criterion_id) as n')->groupBy('registration_id')
                    ->pluck('n', 'registration_id')
                : collect();
            $done = 0;
            foreach ($partIds as $pid) {
                if ((int) ($filled[$pid] ?? 0) >= count($critIds)) {
                    $done++;
                }
            }
            $total = count($partIds);
            $started = $partIds && $critIds && collect($partIds)->contains(fn ($pid) => (int) ($filled[$pid] ?? 0) > 0);
            $status = ! $total || ! $critIds ? 'kosong' : ($done >= $total ? 'selesai' : ($started ? 'berjalan' : 'belum'));

            $s = Judging::settings($eid, $cid);

            return [
                'id' => (int) $j->id,
                'event' => $e?->title ?? '(event dihapus)',
                'parent' => $e && $e->parent_id ? ($parents[$e->parent_id] ?? null) : null,
                'category' => $cat,
                'token' => $j->token,
                'total' => $total,
                'done' => $done,
                'status' => $status,
                'locked' => ! empty($s->saved_at) || ! empty($s->finalized_at),
            ];
        })->sortBy(fn ($r) => $r['status'] === 'selesai' ? 1 : 0)->values()->all();

        $pending = $waiting->map(fn ($id) => $events->get($id)?->title)->filter()->values()->all();

        return Inertia::render('saya/juri', ['rows' => $rows, 'pending' => $pending]);
    }
}
