<?php

namespace App\Http\Controllers\Panel;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\InstitutionMember;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class PanelController extends Controller
{
    private const PER_PAGE = 8;

    private function institution(Request $request): array
    {
        return $request->attributes->get('institution')->only('id', 'name');
    }

    public function dashboard(Request $request): Response
    {
        $i = $request->attributes->get('institution');
        $i->loadMissing('user:id,name,email,avatar');

        $status = $request->query('status');
        $status = in_array($status, [Event::PUBLISHED, Event::PENDING, Event::REJECTED], true) ? $status : null;

        $page = Event::where('institution_id', $i->id)
            ->whereNull('parent_id')
            ->when($status, fn ($q) => $q->where('status', $status))
            ->latest()
            ->paginate(self::PER_PAGE)
            ->withQueryString();

        $by = Event::where('institution_id', $i->id)
            ->whereNull('parent_id')
            ->selectRaw('status, count(*) as n')->groupBy('status')->pluck('n', 'status');

        $next = Event::where('institution_id', $i->id)
            ->where('status', Event::PUBLISHED)
            ->whereDate('ends_at', '>=', today())
            ->orderBy('starts_at')
            ->first(['id', 'title', 'starts_at']);

        $posterCol = collect(['poster_path', 'poster', 'banner_path', 'banner', 'image_path', 'image', 'cover_path', 'cover'])
            ->first(fn ($c) => Schema::hasColumn('events', $c));
        $posterUrl = function ($v) {
            if (! $v) {
                return null;
            }

            return preg_match('#^(https?:)?//|^/#', $v) ? $v : Storage::disk('public')->url($v);
        };

        $members = InstitutionMember::with('user:id,name,email,avatar')
            ->where('institution_id', $i->id)->get()
            ->map(fn ($m) => [
                'id' => $m->id,
                'name' => $m->user?->name,
                'email' => $m->user?->email,
                'avatar' => $m->user?->avatar,
                'role' => $m->role,
                'permissions' => MemberController::permissionsFor($m),
                'status' => $m->getAttributes()['status'] ?? 'aktif',
            ]);

        $kids = Event::whereIn('parent_id', $page->getCollection()->pluck('id'))
            ->orderBy('sub_order')->orderBy('id')->get()->groupBy('parent_id');

        return Inertia::render('panel/dashboard', [
            'institution' => [
                'id' => $i->id,
                'name' => $i->name,
                'email' => $i->email,
                'phone' => $i->phone,
                'status' => $i->status,
                'logo_url' => $i->logo_path ? '/storage/' . ltrim($i->logo_path, '/') : null,
            ],
            'isOwner' => $request->user()->id === $i->user_id,
            'owner' => ['name' => $i->user?->name, 'email' => $i->user?->email, 'avatar' => $i->user?->avatar],
            'members' => $members,
            'counts' => [
                'total' => (int) $by->sum(),
                'published' => (int) ($by[Event::PUBLISHED] ?? 0),
                'pending' => (int) ($by[Event::PENDING] ?? 0),
                'rejected' => (int) ($by[Event::REJECTED] ?? 0),
            ],
            'balance' => ! ($request->attributes->get('is_owner') || array_intersect(['finance', 'withdraw'], (array) $request->attributes->get('panel_perms', [])))
                ? ['available' => 0, 'processing' => 0, 'withdrawn' => 0]
                : (function () use ($i) {
                $r = \App\Support\Revenue::report($i->id)['summary'];

                return ['available' => $r['available'], 'processing' => $r['processing'] + $r['pending'], 'withdrawn' => $r['transferred']];
            })(),
            'upcoming' => $next ? ['title' => $next->title, 'starts_at' => $next->starts_at->toDateString()] : null,
            'filter' => $status,
            'pagination' => [
                'current' => $page->currentPage(),
                'last' => $page->lastPage(),
                'total' => $page->total(),
                'per_page' => $page->perPage(),
            ],
            'events' => $page->getCollection()->map(fn (Event $e) => [
                'id' => $e->id,
                'title' => $e->title,
                'category' => EventController::CATEGORIES[$e->category] ?? $e->category,
                'package' => $e->package_snapshot['name'] ?? '-',
                'starts_at' => $e->starts_at->toDateString(),
                'ends_at' => $e->ends_at->toDateString(),
                'status' => $e->status,
                'poster_url' => $posterCol ? $posterUrl($e->{$posterCol}) : null,
                'subs' => $kids->get($e->id, collect())->map(fn (Event $c) => [
                    'id' => $c->id,
                    'title' => $c->title,
                    'category' => EventController::CATEGORIES[$c->category] ?? $c->category,
                    'starts_at' => $c->starts_at->toDateString(),
                    'ends_at' => $c->ends_at->toDateString(),
                    'status' => $c->status,
                    'poster_url' => $posterCol ? $posterUrl($c->{$posterCol}) : null,
                ])->values()->all(),
            ])->values(),
        ]);
    }

    public function placeholder(Request $request, string $title): Response
    {
        return Inertia::render('panel/placeholder', [
            'institution' => $this->institution($request),
            'title' => $title,
        ]);
    }
}
