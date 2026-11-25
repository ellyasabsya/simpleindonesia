<?php

namespace App\Http\Middleware;

use App\Models\Event;
use App\Models\EventComment;
use App\Models\Institution;
use App\Models\InstitutionMember;
use App\Models\Withdrawal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    private ?array $adminCountsMemo = null;

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /** Hitungan "pending" admin: 1x hitung per 30 detik, bukan tiap halaman. */
    private function adminCounts(): array
    {
        return $this->adminCountsMemo ??= Cache::remember('admin_pending_counts', 30, fn () => [
            'comments' => EventComment::whereNotNull('reported_at')->count(),
            'lembaga' => Institution::where('status', Institution::PENDING)->count(),
            'review' => Event::whereNull('parent_id')->where('status', 'pending')
                ->where(fn ($w) => $w->whereNull('payment_status')->orWhere('payment_status', '!=', 'menunggu_verifikasi'))->count(),
            'penarikan' => Withdrawal::where('status', 'menunggu')->count(),
            'paket' => Event::whereNull('parent_id')->where('payment_status', 'menunggu_verifikasi')->count(),
            'tiket' => DB::table('ticket_orders')->where('status', 'menunggu_verifikasi')->count(),
        ]);
    }

    public function share(Request $request): array
    {
        $user = $request->user();
        $isAdmin = $user?->isAdmin() ?? false;

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'flash' => fn () => [
                'success' => $request->session()->get('success'),
                'order_code' => $request->session()->get('order_code'),
                'pay_online' => (bool) $request->session()->get('pay_online'),
                'error' => $request->session()->get('error'),
            ],
            'auth' => [
                'user' => $user ? $user->only('id', 'name', 'email', 'role') : null,
            ],
            'userHasPanel' => function () use ($user) {
                if (! $user) {
                    return false;
                }

                return Cache::remember('user_has_panel:'.$user->id, 120, fn () => Institution::where('user_id', $user->id)->where('status', Institution::APPROVED)->exists()
                    || InstitutionMember::where('user_id', $user->id)->where('status', 'aktif')
                        ->whereIn('institution_id', Institution::where('status', Institution::APPROVED)->select('id'))->exists());
            },
            'notifications' => fn () => $isAdmin
                ? [
                    'unread_count' => $user->unreadNotifications()->count(),
                    'items' => $user->notifications()->latest()->limit(8)->get()->map(fn ($n) => [
                        'id' => $n->id,
                        'title' => $n->data['title'] ?? '',
                        'message' => $n->data['message'] ?? '',
                        'url' => $n->data['url'] ?? null,
                        'read' => $n->read_at !== null,
                        'created_at' => $n->created_at?->toISOString(),
                    ])->all(),
                ]
                : ($user
                    ? $user->notifications()->latest()->limit(10)->get()->map(fn ($n) => [
                        'id' => $n->id,
                        'text' => $n->data['text'] ?? trim(($n->data['title'] ?? '').' — '.($n->data['message'] ?? ''), ' —'),
                        'url' => $n->data['url'] ?? null,
                        'read' => $n->read_at !== null,
                        'at' => $n->created_at?->toIso8601String(),
                    ])->all()
                    : []),
            'pending_comments' => fn () => $isAdmin ? $this->adminCounts()['comments'] : 0,
            'pending_lembaga' => fn () => $isAdmin ? $this->adminCounts()['lembaga'] : 0,
            'pending_review' => fn () => $isAdmin ? $this->adminCounts()['review'] : 0,
            'pending_penarikan' => fn () => $isAdmin ? $this->adminCounts()['penarikan'] : 0,
            'pending_paket' => fn () => $isAdmin ? $this->adminCounts()['paket'] : 0,
            'pending_tiket' => fn () => $isAdmin ? $this->adminCounts()['tiket'] : 0,
        ];
    }
}
