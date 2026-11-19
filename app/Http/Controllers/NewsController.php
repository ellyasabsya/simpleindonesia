<?php

namespace App\Http\Controllers;

use App\Models\News;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class NewsController extends Controller
{
    public function index(): Response
    {
        $news = News::published()
            ->orderByDesc('published_at')
            ->paginate(9)
            ->through(fn (News $n) => $n->card());

        return Inertia::render('berita/index', ['news' => $news]);
    }

    public function show(Request $request, News $news): Response
    {
        abort_unless($news->status === News::PUBLISHED, 404);

        $viewerId = $request->user()?->id;

        return Inertia::render('berita/show', [
            'news' => $news->card() + [
                'html' => Str::markdown($news->body, [
                    'html_input' => 'strip',
                    'allow_unsafe_links' => false,
                ]),
            ],
            'comments' => $news->comments()->with('user:id,name')->get()->map(fn ($c) => [
                'id' => $c->id,
                'user_id' => $c->user_id,
                'name' => $c->user?->name ?? 'Pengguna',
                'body' => $c->body,
                'date' => $c->created_at?->locale('id')->diffForHumans(),
            ]),
            'viewer' => $viewerId ? ['id' => $viewerId] : null,
        ]);
    }
}
