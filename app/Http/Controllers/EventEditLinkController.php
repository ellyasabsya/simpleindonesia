<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Admin\EventController as AdminEventController;
use App\Http\Controllers\Panel\EventController as PanelEventController;
use App\Models\EventEditLink;
use App\Models\User;
use App\Notifications\AdminAlert;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;
use Inertia\Response;

class EventEditLinkController extends Controller
{
    private function find(string $token): ?EventEditLink
    {
        return EventEditLink::where('token_hash', hash('sha256', $token))->first();
    }

    public function show(string $token): Response
    {
        $link = $this->find($token);
        $event = $link?->event;

        if (! $link || ! $event || $event->parent_id !== null || $link->status() !== 'aktif') {
            return Inertia::render('panitia/link-tidak-aktif', [
                'reason' => $link ? $link->status() : 'tidak_ditemukan',
            ]);
        }

        $link->forceFill(['last_opened_at' => now()])->save();

        $admin = app(AdminEventController::class);
        $event->load('institution:id,name');

        return Inertia::render('panitia/edit-event', [
            'token' => $token,
            'event' => $admin->detail($event),
            'subs' => $event->children()->get()->map(fn ($c) => $admin->detail($c))->values()->all(),
            'series' => $event->children()->exists(),
            'categories' => PanelEventController::CATEGORIES,
            'institution' => $event->institution?->name,
            'expires_at' => $link->expires_at->copy()->setTimezone(config('app.agenda_timezone', 'Asia/Jakarta'))->format('d M Y H:i'),
        ]);
    }

    public function update(Request $request, string $token): RedirectResponse
    {
        $link = $this->find($token);
        if (! $link || $link->status() !== 'aktif') {
            return redirect("/edit-event/{$token}");
        }

        $event = $link->event;
        abort_if($event === null || $event->parent_id !== null, 404);

        // Link ditandai terpakai di dalam transaksi yang sama dengan penyimpanan:
        // validasi gagal atau error apa pun tidak menghanguskan link.
        $title = app(AdminEventController::class)->perform($request, $event, function () use ($link) {
            $n = EventEditLink::whereKey($link->id)
                ->whereNull('edited_at')->whereNull('revoked_at')->where('expires_at', '>', now())
                ->update(['edited_at' => now()]);
            abort_if($n === 0, 403, 'Link sudah dipakai atau tidak aktif.');
        });

        try {
            Notification::send(
                User::where('role', 'admin')->get(),
                new AdminAlert('Panitia mengubah event', 'Panitia mengubah event "'.$title.'" lewat link edit.', '/admin/events/'.$event->id.'/edit'),
            );
        } catch (\Throwable $e) {
            report($e);
        }

        return redirect("/edit-event/{$token}");
    }
}
