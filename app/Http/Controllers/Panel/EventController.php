<?php

namespace App\Http\Controllers\Panel;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Package;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class EventController extends Controller
{
    public const CATEGORIES = ['seminar' => 'Seminar', 'festival' => 'Festival', 'perlombaan' => 'Perlombaan'];

    public function index(Request $request): Response
    {
        $institution = $request->attributes->get('institution');

        $events = Event::where('institution_id', $institution->id)
            ->latest()
            ->get()
            ->map(fn (Event $e) => [
                'id' => $e->id,
                'title' => $e->title,
                'category' => self::CATEGORIES[$e->category] ?? $e->category,
                'location' => $e->location,
                'starts_at' => $e->starts_at->toDateString(),
                'ends_at' => $e->ends_at->toDateString(),
                'status' => $e->status,
                'rejection_reason' => $e->rejection_reason,
                'poster_url' => $e->posterUrl(),
                'package' => $e->package_snapshot['name'] ?? '-',
            ]);

        return Inertia::render('panel/events/index', [
            'institution' => $institution->only('id', 'name'),
            'events' => $events,
        ]);
    }

    public function create(Request $request): Response
    {
        $labels = config('features.features');

        $packages = Package::where('is_active', true)
            ->orderBy('sort_order')
            ->get()
            ->map(fn (Package $p) => [
                'id' => $p->id,
                'name' => $p->name,
                'price_label' => $p->priceLabel(),
                'description' => $p->description,
                'features' => collect($p->features)->map(fn ($k) => $labels[$k]['label'] ?? $k)->values(),
            ]);

        return Inertia::render('panel/events/create', [
            'institution' => $request->attributes->get('institution')->only('id', 'name'),
            'packages' => $packages,
            'categories' => self::CATEGORIES,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $institution = $request->attributes->get('institution');

        $data = $request->validate([
            'title' => ['required', 'string', 'max:150'],
            'category' => ['required', Rule::in(array_keys(self::CATEGORIES))],
            'location' => ['required', 'string', 'max:150'],
            'starts_at' => ['required', 'date', 'after_or_equal:today'],
            'ends_at' => ['required', 'date', 'after_or_equal:starts_at'],
            'description' => ['nullable', 'string', 'max:2000'],
            'package_id' => ['required', Rule::exists('packages', 'id')->where('is_active', true)],
            'poster' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ], [
            'title.required' => 'Nama event wajib diisi.',
            'category.required' => 'Pilih kategori event.',
            'location.required' => 'Lokasi wajib diisi.',
            'starts_at.required' => 'Tanggal mulai wajib diisi.',
            'starts_at.after_or_equal' => 'Tanggal mulai tidak boleh di masa lalu.',
            'ends_at.required' => 'Tanggal selesai wajib diisi.',
            'ends_at.after_or_equal' => 'Tanggal selesai tidak boleh sebelum tanggal mulai.',
            'package_id.required' => 'Pilih paket event.',
            'package_id.exists' => 'Paket tidak tersedia.',
            'poster.image' => 'Poster harus berupa gambar.',
            'poster.max' => 'Ukuran poster maksimal 4 MB.',
        ]);

        $package = Package::findOrFail($data['package_id']);

        Event::create([
            'institution_id' => $institution->id,
            'package_id' => $package->id,
            'title' => $data['title'],
            'slug' => $this->uniqueSlug($data['title']),
            'category' => $data['category'],
            'description' => $data['description'] ?? null,
            'location' => $data['location'],
            'starts_at' => $data['starts_at'],
            'ends_at' => $data['ends_at'],
            'poster_path' => $request->file('poster')?->store('posters', 'public'),
            'status' => Event::PENDING,
            'package_snapshot' => $package->snapshot(),
        ]);

        return redirect()->route('panel.event');
    }

    private function uniqueSlug(string $title): string
    {
        $base = Str::slug($title) ?: 'event';
        $slug = $base;
        $i = 2;

        while (Event::where('slug', $slug)->exists()) {
            $slug = $base.'-'.$i++;
        }

        return $slug;
    }
}
