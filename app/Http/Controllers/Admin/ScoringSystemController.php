<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ScoringSystemController extends Controller
{
    public function index(): Response
    {
        $hooks = DB::table('scoring_system_hooks')->orderBy('sort')->orderBy('id')->get()->groupBy('system_key');

        $systems = DB::table('scoring_systems')->orderBy('id')->get()->map(function ($r) use ($hooks) {
            return [
                'key' => $r->system_key,
                'name' => $r->name,
                'description' => (string) $r->description,
                'tag' => (string) $r->tag,
                'version' => (int) $r->version,
                'used' => DB::table('judging_systems')->where('category_id', 0)->where('system', $r->system_key)->count(),
                'hooks' => ($hooks[$r->system_key] ?? collect())->map(fn ($h) => [
                    'key' => $h->hook_key,
                    'label' => $h->label,
                    'description' => (string) $h->description,
                    'enabled' => (bool) $h->is_enabled,
                ])->values(),
            ];
        })->values();

        return Inertia::render('admin/sistem-penilaian', ['systems' => $systems]);
    }

    public function toggleHook(string $system, string $hook): RedirectResponse
    {
        $row = DB::table('scoring_system_hooks')->where('system_key', $system)->where('hook_key', $hook)->first();
        abort_unless($row, 404);
        $on = ! $row->is_enabled;
        DB::table('scoring_system_hooks')->where('id', $row->id)->update(['is_enabled' => $on, 'updated_at' => now()]);

        return back()->with('success', $row->label.($on ? ' diaktifkan.' : ' dimatikan.'));
    }
}
