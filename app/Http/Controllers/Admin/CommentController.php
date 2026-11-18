<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\EventComment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CommentController extends Controller
{
    private const PER_PAGE = 10;

    public function index(Request $request): Response
    {
        $status = $request->query('status') === 'all' ? 'all' : 'reported';

        $comments = EventComment::query()
            ->with(['user:id,name,email', 'event:id,title,slug'])
            ->when($status === 'reported',
                fn ($q) => $q->whereNotNull('reported_at')->orderByDesc('reported_at'),
                fn ($q) => $q->latest())
            ->orderByDesc('id')
            ->paginate(self::PER_PAGE)
            ->withQueryString()
            ->through(fn (EventComment $c) => [
                'id' => $c->id,
                'body' => $c->body,
                'author' => $c->user?->name ?? 'Pengguna dihapus',
                'author_email' => $c->user?->email,
                'event_title' => $c->event?->title ?? '-',
                'event_key' => $c->event ? ($c->event->slug ?: (string) $c->event->id) : null,
                'created_at' => $c->created_at?->toISOString(),
                'reported_at' => $c->reported_at?->toISOString(),
            ]);

        return Inertia::render('admin/komentar', [
            'comments' => $comments,
            'filters' => ['status' => $status],
            'counts' => [
                'reported' => EventComment::whereNotNull('reported_at')->count(),
                'all' => EventComment::count(),
            ],
        ]);
    }

    public function dismiss(EventComment $comment): RedirectResponse
    {
        $comment->update(['reported_at' => null]);

        return back()->with('success', 'Laporan diabaikan. Komentar tetap tampil.');
    }

    public function destroy(EventComment $comment): RedirectResponse
    {
        $comment->delete();

        return back()->with('success', 'Komentar dihapus.');
    }
}
