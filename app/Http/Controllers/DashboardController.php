<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Institution;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        if ($request->query('source') === 'pwa') {
            session()->forget('admin_view_user');
        }

        if ($user->isAdmin() && ! session('admin_view_user')) {
            return redirect('/admin');
        }

        $institutions = Institution::where('user_id', $user->id)->latest()->get();
        $approved = $institutions->firstWhere('status', Institution::APPROVED);
        $current = $approved ?? $institutions->first();

        $events = Event::whereIn('institution_id', $institutions->pluck('id'))->with('institution:id,name');

        $byStatus = (clone $events)->toBase()->selectRaw('status, COUNT(*) as n')->groupBy('status')->pluck('n', 'status');
        $total = (int) $byStatus->sum();
        $published = (int) ($byStatus[Event::PUBLISHED] ?? 0);
        $pending = (int) ($byStatus[Event::PENDING] ?? 0);
        $rejected = (int) ($byStatus[Event::REJECTED] ?? 0);

        $nearest = (clone $events)
            ->where('status', Event::PUBLISHED)
            ->whereDate('ends_at', '>=', now(config('app.agenda_timezone', 'Asia/Jakarta'))->toDateString())
            ->orderBy('starts_at')
            ->first();

        $recent = (clone $events)->latest()->limit(5)->get()->map(fn (Event $e) => [
            'id' => $e->id,
            'title' => $e->title,
            'institution' => $e->institution?->name,
            'starts_at' => $e->starts_at->toDateString(),
            'status' => $e->status,
        ]);

        $tz = config('app.agenda_timezone', 'Asia/Jakarta');
        $toneOf = ['disetujui' => 'ok', 'menunggu' => 'wait', 'ditolak' => 'bad', 'batal' => 'bad'];
        $statusMap = [
            'menunggu' => ['Menunggu verifikasi', 'wait'],
            'terdaftar' => ['Terdaftar', 'ok'],
            'ditolak' => ['Ditolak', 'bad'],
        ];
        $history = \Illuminate\Support\Facades\DB::table('event_registrations as r')
            ->join('events as e', 'e.id', '=', 'r.event_id')
            ->where('r.user_id', $user->id)
            ->orderByDesc('r.id')
            ->limit(100)
            ->get(['r.id', 'r.status', 'r.created_at', 'r.event_id', 'e.title', 'e.location', 'e.starts_at'])
            ->map(function ($r) use ($tz, $toneOf) {
                $st = \App\Support\StatusPeserta::transfer($r->status);
                [$label, $tone] = [$st['status_label'], $toneOf[$st['status_code']] ?? 'wait'];

                return [
                    'id' => 'reg-'.$r->id,
                    'role' => 'peserta',
                    'title' => $r->title,
                    'subtitle' => implode(' · ', array_filter([
                        $r->starts_at ? \Illuminate\Support\Carbon::parse($r->starts_at)->format('d M Y') : null,
                        $r->location,
                    ])),
                    'date' => \Illuminate\Support\Carbon::parse($r->created_at)->setTimezone($tz)->toDateString(),
                    'status' => $label,
                    'tone' => $tone,
                    'href' => '/events/'.$r->event_id.'/daftar',
                ];
            })->values()->all();

        // Tiket yang dibeli sebagai peserta: satu entri per event, lewati event yang sudah ada dari pendaftaran formulir.
        $regEventIds = \Illuminate\Support\Facades\DB::table('event_registrations')->where('user_id', $user->id)->pluck('event_id')->all();
        $ticketRows = \Illuminate\Support\Facades\DB::table('ticket_orders as o')
            ->join('events as e', 'e.id', '=', 'o.event_id')
            ->where(function ($q) use ($user) {
                $q->where('o.user_id', $user->id);
                if ($user->email_verified_at) {
                    $q->orWhereRaw('LOWER(TRIM(o.buyer_email)) = ?', [mb_strtolower(trim($user->email))]);
                }
            })
            ->whereNotIn('o.event_id', $regEventIds)
            ->orderByDesc('o.id')
            ->get(['o.id', 'o.status', 'o.rejected_at', 'o.expires_at', 'o.created_at', 'o.event_id', 'e.title', 'e.location', 'e.starts_at'])
            ->sortBy(fn ($o) => $o->status === 'lunas' ? 0 : 1)
            ->unique('event_id');
        foreach ($ticketRows as $o) {
            $st = \App\Support\StatusPeserta::tiket($o->status, $o->rejected_at, $o->expires_at);
            $history[] = [
                'id' => 'tkt-'.$o->id,
                'role' => 'peserta',
                'title' => $o->title,
                'subtitle' => implode(' · ', array_filter([
                    $o->starts_at ? \Illuminate\Support\Carbon::parse($o->starts_at)->format('d M Y') : null,
                    $o->location,
                ])),
                'date' => \Illuminate\Support\Carbon::parse($o->created_at)->setTimezone($tz)->toDateString(),
                'status' => $st['status_label'],
                'tone' => $toneOf[$st['status_code']] ?? 'wait',
                'href' => '/tiket',
            ];
        }

        // Riwayat peran penyelenggara: satu entri per event induk milik lembaga akun ini.
        $orgLabel = [
            Event::PUBLISHED => ['Tayang', 'ok'],
            Event::PENDING => ['Menunggu verifikasi', 'wait'],
            Event::REJECTED => ['Ditolak', 'bad'],
        ];
        foreach ((clone $events)->whereNull('parent_id')->latest()->limit(100)->get() as $e) {
            [$label, $tone] = $orgLabel[$e->status] ?? [ucfirst((string) $e->status), 'wait'];
            $history[] = [
                'id' => 'org-'.$e->id,
                'role' => 'penyelenggara',
                'title' => $e->title,
                'subtitle' => implode(' · ', array_filter([
                    $e->starts_at?->format('d M Y'),
                    $e->location,
                    $e->institution?->name,
                ])),
                'date' => $e->created_at?->setTimezone($tz)->toDateString() ?? $e->starts_at->toDateString(),
                'status' => $label,
                'tone' => $tone,
                'href' => '/panel',
            ];
        }

        // Riwayat peran juri: satu entri per event yang sudah ditugaskan ke kategori.
        $judged = \Illuminate\Support\Facades\DB::table('judges as j')
            ->join('events as e', 'e.id', '=', 'j.event_id')
            ->where('j.user_id', $user->id)->where('j.active', 1)->where('j.category_id', '!=', -1)
            ->groupBy('j.event_id', 'e.title', 'e.location', 'e.starts_at')
            ->selectRaw('j.event_id, e.title, e.location, e.starts_at, COUNT(*) as n, MIN(j.created_at) as since')
            ->orderByDesc('since')->get();
        foreach ($judged as $j) {
            $history[] = [
                'id' => 'juri-'.$j->event_id,
                'role' => 'juri',
                'title' => $j->title,
                'subtitle' => implode(' · ', array_filter([
                    $j->starts_at ? \Illuminate\Support\Carbon::parse($j->starts_at)->format('d M Y') : null,
                    $j->location,
                    $j->n.' kategori',
                ])),
                'date' => \Illuminate\Support\Carbon::parse($j->since)->setTimezone($tz)->toDateString(),
                'status' => 'Juri aktif',
                'tone' => 'ok',
                'href' => '/juri-saya',
            ];
        }

        return Inertia::render('dashboard', [
            'hasPanel' => (bool) $approved || \App\Models\InstitutionMember::where('user_id', $user->id)->where('status', 'aktif')->whereIn('institution_id', Institution::where('status', Institution::APPROVED)->select('id'))->exists(),
            'institution' => $current?->only('id', 'name', 'status'),
            'institutionCount' => $institutions->count(),
            'summary' => [
                'total' => $total,
                'published' => $published,
                'pending' => $pending,
                'rejected' => $rejected,
                'publishRate' => $total ? (int) round($published / $total * 100) : 0,
            ],
            'nearest' => $nearest ? [
                'title' => $nearest->title,
                'starts_at' => $nearest->starts_at->toDateString(),
            ] : null,
            'recent' => $recent,
            'history' => $history,
            'isJudge' => \Illuminate\Support\Facades\DB::table('judges')->where('user_id', $user->id)->where('active', 1)->exists(),
            'judgeTasks' => \Illuminate\Support\Facades\DB::table('judges')->where('user_id', $user->id)->where('active', 1)->where('category_id', '!=', -1)->count(),
            'invitations' => collect(\App\Support\JudgeInvites::forUser($user->id))->concat(\App\Models\InstitutionMember::where('user_id', $user->id)
                ->where('status', 'menunggu')
                ->latest('id')->get()
                ->map(function ($m) {
                    $inst = Institution::find($m->institution_id);
                    $roles = ['admin' => 'Admin', 'manajer' => 'Manajer event', 'keuangan' => 'Keuangan', 'staf' => 'Staf lapangan'];

                    return [
                        'id' => 'lembaga-'.$m->id,
                        'member_id' => $m->id,
                        'kind' => 'lembaga',
                        'from' => $inst?->name ?? 'Lembaga',
                        'title' => 'Diundang sebagai '.($roles[$m->role] ?? $m->role),
                        'date' => $m->created_at?->toDateString(),
                    ];
                })->values()->all())->values()->all(),
            'steps' => [
                ['label' => 'Akun dibuat', 'done' => true],
                ['label' => 'Daftarkan lembaga', 'done' => $institutions->isNotEmpty(), 'href' => '/lembaga/daftar'],
                ['label' => 'Lembaga terverifikasi', 'done' => (bool) $approved],
                ['label' => 'Ajukan event pertama', 'done' => $total > 0, 'href' => '/panel/ajukan'],
                ['label' => 'Event tayang', 'done' => $published > 0],
            ],
        ]);
    }
}
