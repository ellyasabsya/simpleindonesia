<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\EventComment;
use App\Models\News;
use App\Models\NewsComment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Inertia\Inertia;
use Inertia\Response;

class CommentController extends Controller
{
    private const PER_PAGE = 10;

    public function index(Request $request): Response
    {
        $status = $request->query('status') === 'all' ? 'all' : 'reported';
        $reportedOnly = $status === 'reported';

        $events = EventComment::query()
            ->with(['user:id,name,email', 'event:id,title,slug'])
            ->when($reportedOnly, fn ($q) => $q->whereNotNull('reported_at'))
            ->get()
            ->map(fn (EventComment $c) => [
                'id' => $c->id,
                'type' => 'event',
                'source' => 'Event',
                'body' => $c->body,
                'author' => $c->user?->name ?? 'Pengguna dihapus',
                'author_email' => $c->user?->email,
                'event_title' => $c->event?->title ?? '-',
                'event_key' => $c->event ? ($c->event->slug ?: (string) $c->event->id) : null,
                'url' => $c->event ? '/events/'.($c->event->slug ?: $c->event->id) : null,
                'dismiss_url' => route('admin.komentar.dismiss', $c->id, false),
                'delete_url' => route('admin.komentar.destroy', $c->id, false),
                'created_at' => $c->created_at?->toISOString(),
                'reported_at' => $c->reported_at?->toISOString(),
            ]);

        $newsComments = NewsComment::query()
            ->with('user:id,name,email')
            ->when($reportedOnly, fn ($q) => $q->whereNotNull('reported_at'))
            ->get();
        $newsMap = News::whereIn('id', $newsComments->pluck('news_id')->unique())
            ->get(['id', 'title', 'slug'])->keyBy('id');

        $berita = $newsComments->map(function (NewsComment $c) use ($newsMap) {
            $n = $newsMap->get($c->news_id);

            return [
                'id' => $c->id,
                'type' => 'berita',
                'source' => 'Berita',
                'body' => $c->body,
                'author' => $c->user?->name ?? 'Pengguna dihapus',
                'author_email' => $c->user?->email,
                'event_title' => $n?->title ?? '-',
                'event_key' => $n?->slug,
                'url' => $n ? '/berita/'.$n->slug : null,
                'dismiss_url' => route('admin.komentar.berita.dismiss', $c->id, false),
                'delete_url' => route('admin.komentar.berita.destroy', $c->id, false),
                'created_at' => $c->created_at?->toISOString(),
                'reported_at' => $c->reported_at?->toISOString(),
            ];
        });

        $key = $reportedOnly ? 'reported_at' : 'created_at';
        $rows = $events->concat($berita)->sortByDesc($key)->values();

        $page = LengthAwarePaginator::resolveCurrentPage();
        $comments = new LengthAwarePaginator(
            $rows->forPage($page, self::PER_PAGE)->values(),
            $rows->count(),
            self::PER_PAGE,
            $page,
            ['path' => $request->url(), 'query' => $request->query()],
        );

        return Inertia::render('admin/komentar', [
            'comments' => $comments,
            'filters' => ['status' => $status],
            'counts' => [
                'reported' => EventComment::whereNotNull('reported_at')->count()
                    + NewsComment::whereNotNull('reported_at')->count(),
                'all' => EventComment::count() + NewsComment::count(),
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

    public function dismissNews(NewsComment $newsComment): RedirectResponse
    {
        $newsComment->forceFill(['reported_at' => null])->save();

        return back()->with('success', 'Laporan diabaikan. Komentar tetap tampil.');
    }

    public function destroyNews(NewsComment $newsComment): RedirectResponse
    {
        $newsComment->delete();

        return back()->with('success', 'Komentar dihapus.');
    }
}
