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
            $cat = collect(Judging::categories((int) $j->event_id))->firstWhere('id', (int) $j->category_id)['name'] ?? null;

            return [
                'id' => (int) $j->id,
                'event' => $e?->title ?? '(event dihapus)',
                'parent' => $e && $e->parent_id ? ($parents[$e->parent_id] ?? null) : null,
                'category' => $cat,
                'token' => $j->token,
            ];
        })->values()->all();

        $pending = $waiting->map(fn ($id) => $events->get($id)?->title)->filter()->values()->all();

        return Inertia::render('saya/juri', ['rows' => $rows, 'pending' => $pending]);
    }
}
