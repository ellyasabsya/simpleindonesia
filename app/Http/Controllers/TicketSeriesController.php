<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Panel\TicketSettingsController;
use App\Models\Event;
use App\Models\TicketType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Pembelian tiket gabungan untuk event rangkaian (induk + kegiatan).
 * Satu form, satu pembayaran, satu group_code. Di bawahnya tetap ada satu pesanan
 * per kegiatan supaya penerbitan tiket dan scan di pintu per kegiatan tidak berubah.
 */
class TicketSeriesController extends Controller
{
    /** Kegiatan anak yang tiketnya sedang dijual. */
    private function openChildren(Event $parent)
    {
        return $parent->children()
            ->where('status', Event::PUBLISHED)
            ->where('registration_method', 'ticket')
            ->where('ticket_sales_open', true)
            ->whereHas('ticketTypes')
            ->with('ticketTypes')
            ->orderBy('sub_order')->orderBy('id')
            ->get();
    }

    private function guard(Event $parent)
    {
        abort_unless($parent->status === Event::PUBLISHED && ! $parent->parent_id, 404);
        $children = $this->openChildren($parent);
        abort_if($children->isEmpty(), 404);

        return $children;
    }

    private function methods(): array
    {
        $m = [];
        if (\App\Models\Setting::manualOn() && \App\Models\Setting::bank()['bank_account_number'] !== '') {
            $m[] = 'transfer_manual';
        }

        return $m;
    }

    private function id($date, string $fmt = 'l, j F Y'): string
    {
        return $date->copy()->locale('id')->translatedFormat($fmt);
    }

    /** Daftar kartu di /tickets: satu rangkaian = satu kartu. */
    public function cards(): JsonResponse
    {
        $events = Event::where('status', Event::PUBLISHED)
            ->where('registration_method', 'ticket')
            ->where('ticket_sales_open', true)
            ->whereHas('ticketTypes')
            ->with('ticketTypes')
            ->orderBy('starts_at')
            ->get();

        $parents = Event::where('status', Event::PUBLISHED)
            ->whereIn('id', $events->pluck('parent_id')->filter()->unique())
            ->get()->keyBy('id');

        $labels = \App\Http\Controllers\Panel\EventController::CATEGORIES;
        $cards = collect();

        foreach ($events->filter(fn ($e) => ! $e->parent_id || ! $parents->has($e->parent_id)) as $e) {
            $cheapest = $e->ticketTypes->sortBy('price')->first();
            $cards->push([
                'sort' => $e->starts_at->timestamp,
                'id' => $e->id,
                'series' => false,
                'href' => '/events/'.$e->id.'/beli',
                'title' => $e->title,
                'poster' => $e->posterUrl(),
                'starts_at' => $e->starts_at->translatedFormat('j M Y'),
                'ends_at' => $e->ends_at->translatedFormat('j M Y'),
                'location' => $e->location ?? '-',
                'category' => $labels[$e->category] ?? null,
                'ticket_name' => $cheapest->name,
                'price' => (int) $cheapest->price,
                'valid_until' => $cheapest->valid_until->translatedFormat('j M Y'),
                'available' => $e->ticketTypes->sum('quota') > 0
                    && $e->ticketTypes->max('valid_until')->endOfDay()->isFuture(),
            ]);
        }

        foreach ($events->filter(fn ($e) => $e->parent_id && $parents->has($e->parent_id))->groupBy('parent_id') as $pid => $kids) {
            $p = $parents[$pid];
            $types = $kids->flatMap->ticketTypes;
            $cheapest = $types->sortBy('price')->first();
            $cards->push([
                'sort' => $kids->min(fn ($k) => $k->starts_at->timestamp),
                'id' => $p->id,
                'series' => true,
                'href' => '/tickets?beli='.$p->id,
                'title' => $p->title,
                'poster' => $p->posterUrl() ?: $kids->first()->posterUrl(),
                'starts_at' => $kids->min('starts_at')->translatedFormat('j M Y'),
                'ends_at' => $kids->max('ends_at')->translatedFormat('j M Y'),
                'location' => $p->location ?? $kids->first()->location ?? '-',
                'category' => $labels[$p->category] ?? null,
                'ticket_name' => $kids->count().' kegiatan',
                'price' => (int) $cheapest->price,
                'valid_until' => $types->max('valid_until')->translatedFormat('j M Y'),
                'available' => $types->sum('quota') > 0 && $types->max('valid_until')->endOfDay()->isFuture(),
            ]);
        }

        return response()->json($cards->sortBy('sort')->map(fn ($c) => collect($c)->except('sort'))->values());
    }

    /** Data untuk jendela beli rangkaian. */
    public function data(Event $event): JsonResponse
    {
        $children = $this->guard($event);
        $today = now()->toDateString();

        $activities = $children->map(function (Event $c) use ($today) {
            $types = $c->ticketTypes
                ->filter(fn ($t) => $t->valid_from->toDateString() <= $today && $t->valid_until->toDateString() >= $today)
                ->map(fn ($t) => [
                    'id' => $t->id,
                    'name' => $t->name,
                    'price' => (int) $t->price,
                    'remaining' => max(0, $t->quota - TicketSettingsController::sold($t->id)),
                    'valid_from' => $this->id($c->starts_at),
                    'valid_until' => $this->id($c->starts_at->copy()->addDays(max(1, (int) $t->valid_days) - 1)),
                    'require_holder_details' => (bool) $t->require_holder_details,
                    'support_enabled' => (bool) $t->support_enabled,
                    'max_per_order' => (int) $t->max_per_order,
                ])->values();

            return [
                'event_id' => $c->id,
                'title' => $c->title,
                'date' => $this->id($c->starts_at),
                'location' => $c->location,
                'ticket_types' => $types,
            ];
        })->filter(fn ($a) => $a['ticket_types']->isNotEmpty())->values();

        return response()->json([
            'event' => [
                'id' => $event->id,
                'title' => $event->title,
                'location' => $event->location,
                'date' => $this->id($event->starts_at),
            ],
            'activities' => $activities,
            'fee_percent' => \App\Models\Setting::serviceFeePercent(),
            'payment' => ['methods' => $this->methods(), 'bank' => \App\Models\Setting::bank()],
        ]);
    }

    public function store(Request $request, Event $event): RedirectResponse
    {
        $children = $this->guard($event);
        $childIds = $children->pluck('id')->all();

        $request->validate([
            'items' => ['required', 'array', 'min:1', 'max:30'],
            'items.*.event_id' => ['required', 'integer', Rule::in($childIds)],
            'items.*.ticket_type_id' => ['required', 'integer'],
        ], [
            'items.required' => 'Pilih minimal satu kegiatan.',
            'items.min' => 'Pilih minimal satu kegiatan.',
            'items.*.event_id.in' => 'Kegiatan tidak tersedia.',
        ]);

        $items = collect($request->input('items'))->values();
        if ($items->pluck('event_id')->unique()->count() !== $items->count()) {
            throw ValidationException::withMessages(['items' => 'Satu kegiatan hanya boleh dipilih sekali.']);
        }

        $types = TicketType::whereIn('id', $items->pluck('ticket_type_id'))->get()->keyBy('id');
        foreach ($items as $it) {
            $t = $types->get((int) $it['ticket_type_id']);
            if (! $t || (int) $t->event_id !== (int) $it['event_id']) {
                throw ValidationException::withMessages(['items' => 'Jenis tiket tidak tersedia.']);
            }
            if ($t->support_enabled) {
                throw ValidationException::withMessages(['items' => 'Tiket dukungan tidak bisa dibeli bersama kegiatan lain. Beli lewat halaman kegiatannya.']);
            }
        }

        $free = $types->every(fn ($t) => (int) $t->price === 0);
        $req = $types->contains(fn ($t) => (bool) $t->require_holder_details);

        $data = $request->validate([
            'holder_emails' => [$req ? 'required' : 'nullable', 'array', 'max:10'],
            'holder_emails.*' => [$req ? 'required' : 'nullable', 'email', 'max:120'],
            'holder_phones' => [$req ? 'required' : 'nullable', 'array', 'max:10'],
            'holder_phones.*' => [$req ? 'required' : 'nullable', 'string', 'max:30'],
            'quantity' => ['required', 'integer', 'min:1', 'max:10'],
            'buyer_name' => ['required', 'string', 'max:100'],
            'buyer_email' => ['required', 'email', 'max:120'],
            'buyer_phone' => ['required', 'string', 'max:30'],
            'holders' => ['required', 'array', 'min:1', 'max:10'],
            'holders.*' => ['required', 'string', 'max:100'],
            'payment_method' => $free ? ['nullable'] : ['required', Rule::in($this->methods())],
            'payment_proof' => $free ? ['nullable'] : ['required', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:5120'],
        ], [
            'required' => ':attribute wajib diisi.',
            'email' => 'Format email tidak valid.',
            'payment_method.in' => 'Metode pembayaran tidak tersedia.',
            'payment_proof.mimes' => 'Bukti transfer harus JPG, PNG, WebP, atau PDF.',
            'payment_proof.max' => 'Ukuran bukti transfer maksimal 5 MB.',
        ], [
            'buyer_name' => 'Nama', 'buyer_email' => 'Email', 'buyer_phone' => 'No. telepon',
            'holders.*' => 'Nama pemegang tiket', 'payment_proof' => 'Bukti transfer',
            'payment_method' => 'Metode pembayaran', 'holder_emails.*' => 'Email pemegang tiket',
            'holder_phones.*' => 'Telepon pemegang tiket',
        ]);

        $fail = fn (string $k, string $m) => throw ValidationException::withMessages([$k => $m]);
        $qty = (int) $data['quantity'];
        if (count($data['holders']) !== $qty) {
            $fail('holders', 'Jumlah pemegang tiket harus sama dengan jumlah tiket.');
        }
        if ($req && (count($data['holder_emails'] ?? []) !== $qty || count($data['holder_phones'] ?? []) !== $qty)) {
            $fail('holders', 'Lengkapi email dan telepon setiap pemegang tiket.');
        }

        [$group, $orders] = DB::transaction(function () use ($items, $data, $request, $free, $req, $qty, $fail) {
            $locked = [];
            foreach ($items as $it) {
                $type = TicketType::lockForUpdate()->find((int) $it['ticket_type_id']);
                if (! $type || $type->valid_until->copy()->endOfDay()->isPast() || $type->valid_from->copy()->startOfDay()->isFuture()) {
                    $fail('items', 'Ada jenis tiket yang tidak tersedia.');
                }
                if ($qty > $type->max_per_order) {
                    $fail('quantity', "Maksimal {$type->max_per_order} tiket per pesanan untuk salah satu kegiatan.");
                }
                if ($qty > $type->quota - TicketSettingsController::sold($type->id)) {
                    $fail('quantity', 'Sisa tiket salah satu kegiatan tidak cukup.');
                }
                $locked[] = $type;
            }

            $proof = $free ? null : \App\Support\ImageUploader::store($data['payment_proof'], 'payment-proofs/tiket', 'payment_proof', 1600, 'local');
            $feePercent = \App\Models\Setting::serviceFeePercent();
            $group = 'GRP-'.strtoupper(Str::random(8));
            $orders = [];

            foreach ($locked as $type) {
                $subtotal = (int) $type->price * $qty;
                $fee = (int) round($subtotal * $feePercent / 100);
                $orders[] = DB::table('ticket_orders')->insertGetId([
                    'event_id' => $type->event_id,
                    'ticket_type_id' => $type->id,
                    'code' => 'TKT-'.strtoupper(Str::random(8)),
                    'group_code' => $group,
                    'user_id' => $request->user()?->id,
                    'buyer_name' => trim($data['buyer_name']),
                    'buyer_email' => $data['buyer_email'],
                    'buyer_phone' => trim($data['buyer_phone']),
                    'quantity' => $qty,
                    'subtotal' => $subtotal,
                    'fee_percent' => $feePercent,
                    'fee' => $fee,
                    'total' => $subtotal + $fee,
                    'holders' => json_encode(array_values($data['holders']), JSON_UNESCAPED_UNICODE),
                    'status' => $free ? 'lunas' : 'menunggu_verifikasi',
                    'paid_at' => $free ? now() : null,
                    'payment_method' => $free ? 'gratis' : $data['payment_method'],
                    'payment_proof' => $proof,
                    'support_choice' => null,
                    'holder_details' => ($req && $type->require_holder_details)
                        ? json_encode(array_map(fn ($e, $p) => ['email' => $e, 'phone' => $p], array_values($data['holder_emails']), array_values($data['holder_phones'])), JSON_UNESCAPED_UNICODE)
                        : null,
                    'expires_at' => null,
                    'created_at' => now(), 'updated_at' => now(),
                ]);
            }

            return [$group, $orders];
        });

        if ($free) {
            foreach ($orders as $orderId) {
                try {
                    \App\Support\TicketIssuer::issue($orderId);
                } catch (\Throwable $e) {
                    report($e);
                }
            }
        } else {
            \App\Support\AdminNotifier::send(
                'Pesanan tiket rangkaian menunggu verifikasi',
                "Pesanan {$group} atas nama {$data['buyer_name']} ({$items->count()} kegiatan) menunggu verifikasi pembayaran.",
                '/admin/pesanan-tiket'
            );
        }

        return redirect('/tickets')->with('order_code', $group);
    }
}
