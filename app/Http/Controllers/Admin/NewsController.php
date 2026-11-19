<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\News;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class NewsController extends Controller
{
    public function index(Request $request): Response
    {
        $q = trim((string) $request->query('q', ''));
        $status = (string) $request->query('status', '');

        $news = News::query()
            ->when($q !== '', fn ($x) => $x->where('title', 'like', '%'.$q.'%'))
            ->when(in_array($status, [News::DRAFT, News::PUBLISHED], true), fn ($x) => $x->where('status', $status))
            ->orderByDesc('created_at')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (News $n) => [
                'id' => $n->id,
                'title' => $n->title,
                'slug' => $n->slug,
                'status' => $n->status,
                'cover_url' => $n->coverUrl(),
                'date' => ($n->published_at ?? $n->created_at)?->locale('id')->translatedFormat('j M Y'),
            ]);

        return Inertia::render('admin/berita', [
            'news' => $news,
            'filters' => ['q' => $q, 'status' => $status],
            'counts' => [
                'all' => News::count(),
                'published' => News::where('status', News::PUBLISHED)->count(),
                'draft' => News::where('status', News::DRAFT)->count(),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/berita-form', ['news' => null]);
    }

    public function edit(News $news): Response
    {
        return Inertia::render('admin/berita-form', [
            'news' => [
                'id' => $news->id,
                'title' => $news->title,
                'summary' => $news->summary,
                'body' => $news->body,
                'status' => $news->status,
                'cover_url' => $news->coverUrl(),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);

        $news = new News(Arr::only($data, ['title', 'summary', 'body', 'status']));
        $news->slug = $this->uniqueSlug($data['title']);
        $news->user_id = $request->user()->id;
        if ($request->hasFile('cover')) {
            $news->cover_path = $request->file('cover')->store('news', 'public');
        }
        if ($data['status'] === News::PUBLISHED) {
            $news->published_at = now();
        }
        $news->save();

        return redirect('/admin/berita')->with('success', 'Berita berhasil ditambahkan.');
    }

    public function update(Request $request, News $news): RedirectResponse
    {
        $data = $this->validated($request);

        $news->fill(Arr::only($data, ['title', 'summary', 'body', 'status']));

        if ($request->hasFile('cover')) {
            $this->deleteCover($news);
            $news->cover_path = $request->file('cover')->store('news', 'public');
        } elseif ($request->boolean('remove_cover')) {
            $this->deleteCover($news);
            $news->cover_path = null;
        }

        if ($data['status'] === News::PUBLISHED) {
            $news->published_at ??= now();
        } else {
            $news->published_at = null;
        }
        $news->save();

        return redirect('/admin/berita')->with('success', 'Berita berhasil diperbarui.');
    }

    public function destroy(News $news): RedirectResponse
    {
        $this->deleteCover($news);
        $news->delete();

        return back()->with('success', 'Berita berhasil dihapus.');
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:200'],
            'summary' => ['nullable', 'string', 'max:300'],
            'body' => ['required', 'string', 'max:100000'],
            'status' => ['required', 'in:draft,published'],
            'cover' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'remove_cover' => ['nullable', 'boolean'],
        ], [
            'title.required' => 'Judul wajib diisi.',
            'title.max' => 'Judul maksimal 200 karakter.',
            'summary.max' => 'Ringkasan maksimal 300 karakter.',
            'body.required' => 'Isi berita wajib diisi.',
            'cover.image' => 'Sampul harus berupa gambar.',
            'cover.mimes' => 'Sampul harus berformat JPG, PNG, atau WebP.',
            'cover.max' => 'Ukuran sampul maksimal 2 MB.',
        ]);
    }

    private function deleteCover(News $news): void
    {
        if ($news->cover_path) {
            Storage::disk('public')->delete($news->cover_path);
        }
    }

    private function uniqueSlug(string $title): string
    {
        $base = Str::limit(Str::slug($title), 80, '') ?: 'berita';
        $slug = $base;
        $i = 2;
        while (News::where('slug', $slug)->exists()) {
            $slug = $base.'-'.$i++;
        }

        return $slug;
    }
}
