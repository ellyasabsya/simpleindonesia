<?php

namespace App\Http\Controllers;

use App\Models\Package;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function __invoke(\Illuminate\Http\Request $request): Response|\Illuminate\Http\RedirectResponse
    {
        if ($request->query('lihat') === 'pengguna') {
            session(['admin_view_user' => true]);
        }
        if ($request->user()?->isAdmin() && ! session('admin_view_user')) {
            return redirect('/admin');
        }

        return Inertia::render('welcome', [
            'latestNews' => \App\Models\News::latestForHome(),
            'packages' => $this->cards(),
            'events' => $this->latestEvents(4),
            'votings' => $this->latestVotings(4),
            'heroEvents' => $this->carouselEvents(6),
        ]);
    }

    public function cards(): \Illuminate\Support\Collection
    {
        $labels = config('features.features');
        $packages = Package::where('is_active', true)->orderBy('sort_order')->orderBy('id')->get();
        $rp = fn (int $n) => 'Rp'.number_format($n, 0, ',', '.');
        $createUrl = route('panel.ajukan');
        $taglines = ['iklan' => 'Tayangkan event Anda', 'starter' => 'Program kecil', 'professional' => 'Untuk series kegiatan', 'ticketing' => 'Jual tiket tanpa biaya di muka', 'ticketing-voting' => 'Tiket dan voting dalam satu paket'];

        $cards = $packages->map(function (Package $p) use ($packages, $labels, $rp, $createUrl, $taglines) {
            // paket "induk": paket lain yang semua fiturnya sudah ada di paket ini
            $parent = $packages
                ->filter(fn ($q) => $p->payment_type !== 'revenue_share'
                    && $q->payment_type !== 'revenue_share'
                    && $q->id !== $p->id
                    && count($q->features) < count($p->features)
                    && ! array_diff($q->features, $p->features))
                ->sortByDesc(fn ($q) => count($q->features) * 10 + ($q->slug === 'starter' ? 1 : 0))
                ->first();

            $own = array_values(array_diff($p->features, $parent?->features ?? []));

            $price = match ($p->payment_type) {
                'upfront' => ['main' => $rp((int) $p->price), 'note' => 'bayar di muka'],
                'revenue_share' => ['main' => rtrim(rtrim(number_format((float) $p->share_percent, 1), '0'), '.').'%', 'note' => 'bagi hasil'],
                default => ['main' => 'Gratis', 'note' => ''],
            };

            $hasJudging = in_array('penilaian_juri', $p->features, true);
            $judging = $p->assessment_addon_price !== null ? 'Add-on '.$rp($p->assessment_addon_price) : 'Tidak tersedia';

            $specs = [
                ['Jenis', $p->event_type === 'series' ? 'Series' : 'Single-event'],
                ['Sub-event termasuk', (string) $p->included_sub_events],
                ['Sub-event tambahan', $p->extra_sub_event_price !== null ? $rp($p->extra_sub_event_price).' / kegiatan' : 'Tidak tersedia'],
                ...($hasJudging ? [] : [['Penilaian juri', $judging]]),
                ['Sertifikat otomatis', in_array('sertifikat', $p->features, true) ? 'Termasuk' : ($p->certificate_addon_price !== null ? 'Add-on '.$rp($p->certificate_addon_price) : 'Tidak tersedia')],
                ['Kategori peserta', $p->max_participant_categories ? (string) $p->max_participant_categories : 'Bebas'],
            ];

            return [
                'id' => $p->id,
                'name' => $p->name,
                'slug' => $p->slug,
                'tagline' => $taglines[$p->slug] ?? null,
                'price' => $price,
                'specs' => $specs,
                'extends' => $parent?->name,
                'features' => array_map(fn ($k) => $labels[$k]['label'] ?? $k, $own),
                'featured' => $p->slug === 'professional',
                'join_url' => $createUrl.'?paket='.$p->slug,
            ];
        })->values();

        return $cards;
    }

    /** Event utama yang sudah disetujui admin (bukan sub-event). */
    protected function publishedMain()
    {
        return \App\Models\Event::main()
            ->where('status', \App\Models\Event::PUBLISHED)
            ->with(['institution', 'children']);
    }

    /** Event terbaru hasil inputan, untuk kartu di beranda. */
    public function latestEvents(int $limit = 4): \Illuminate\Support\Collection
    {
        return $this->publishedMain()
            ->latest('id')
            ->limit($limit)
            ->get()
            ->map(fn (\App\Models\Event $e) => $this->card($e))
            ->values();
    }

    /** Voting yang dibuka, memakai bentuk kartu yang sama dengan event. */
    public function latestVotings(int $limit = 4): \Illuminate\Support\Collection
    {
        $settings = \Illuminate\Support\Facades\DB::table('voting_settings')->where('enabled', 1)->get()->keyBy('event_id');
        if ($settings->isEmpty()) {
            return collect();
        }

        $today = now(config('app.agenda_timezone', 'Asia/Jakarta'))->startOfDay()->shiftTimezone(config('app.timezone'));

        return \App\Models\Event::where('status', \App\Models\Event::PUBLISHED)
            ->whereIn('id', $settings->keys())
            ->with(['institution', 'children'])
            ->latest('id')
            ->limit($limit)
            ->get()
            ->map(function (\App\Models\Event $e) use ($settings, $today) {
                $s = $settings[$e->id];
                $c = $this->card($e);
                $start = $s->vote_start ? \Illuminate\Support\Carbon::parse($s->vote_start)->startOfDay() : null;
                $end = $s->vote_end ? \Illuminate\Support\Carbon::parse($s->vote_end)->endOfDay() : ($e->ends_at ? \Illuminate\Support\Carbon::parse($e->ends_at)->endOfDay() : null);

                if ($end && $end->lt($today)) {
                    $status = ['key' => 'selesai', 'label' => 'Ditutup'];
                } elseif ($start && $start->gt($today)) {
                    $status = ['key' => 'segera', 'label' => $today->diffInDays($start).' hari lagi'];
                } else {
                    $status = ['key' => 'berlangsung', 'label' => 'Voting dibuka'];
                }

                return array_merge($c, [
                    'category_key' => 'voting',
                    'category' => 'VOTING',
                    'is_series' => false,
                    'sub_count' => 0,
                    'starts_at' => $start?->toDateString() ?? $c['starts_at'],
                    'ends_at' => $end?->toDateString() ?? $c['ends_at'],
                    'status' => $status,
                    'href' => '/voting/'.$e->id,
                ]);
            })
            ->values();
    }

    /** Carousel hero: yang akan mulai dulu, lalu berlangsung, lalu selesai. */
    public function carouselEvents(int $limit = 6): \Illuminate\Support\Collection
    {
        $rank = ['segera' => 0, 'berlangsung' => 1, 'selesai' => 2];

        return $this->publishedMain()
            ->latest('id')
            ->limit(40)
            ->get()
            ->map(fn (\App\Models\Event $e) => $this->card($e))
            ->sortBy(function (array $c) use ($rank) {
                $r = $rank[$c['status']['key']];
                $start = strtotime($c['starts_at'] ?? '1970-01-01');
                $end = strtotime($c['ends_at'] ?? '1970-01-01');

                return [$r, $r === 2 ? -$end : $start];
            })
            ->take($limit)
            ->values();
    }

    /** Data satu kartu event (dipakai beranda, carousel, dan halaman Semua Event). */
    public function card(\App\Models\Event $e): array
    {
        $today = now(config('app.agenda_timezone', 'Asia/Jakarta'))->startOfDay()->shiftTimezone(config('app.timezone'));
        $labelsConst = '\App\Http\Controllers\Panel\EventController::CATEGORIES';
        $labels = defined($labelsConst) ? constant($labelsConst) : [];

        $start = $e->starts_at ? \Illuminate\Support\Carbon::parse($e->starts_at)->startOfDay() : null;
        $end = $e->ends_at ? \Illuminate\Support\Carbon::parse($e->ends_at)->endOfDay() : null;

        if ($end && $end->lt($today)) {
            $status = ['key' => 'selesai', 'label' => 'Selesai'];
        } elseif ($start && $start->gt($today)) {
            $status = ['key' => 'segera', 'label' => $today->diffInDays($start).' hari lagi'];
        } else {
            $status = ['key' => 'berlangsung', 'label' => 'Berlangsung'];
        }

        $child = $e->children->first();
        $category = $e->category ?: $child?->category;

        return [
            'id' => $e->id,
            'slug' => $e->slug,
            'title' => $e->title,
            'poster' => $e->posterUrl(),
            'category_key' => $category ?: null,
            'category' => $category ? mb_strtoupper((string) ($labels[$category] ?? $category)) : ($e->children->count() ? 'RANGKAIAN' : null),
            'location' => $e->location ?: $child?->location,
            'organizer' => $e->institution?->name,
            'starts_at' => $start?->toDateString(),
            'ends_at' => $end?->toDateString(),
            'status' => $status,
            'is_series' => $e->children->count() > 0,
            'sub_count' => $e->children->count(),
        ];
    }
}
