<?php

namespace App\Http\Controllers\Panel;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\TicketType;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TicketSettingsController extends Controller
{
    /** Tiket yang sudah terpakai: lunas, atau menunggu pembayaran yang belum kedaluwarsa (sama dengan logika pembelian). */
    public static function sold(int $typeId): int
    {
        return (int) DB::table('ticket_orders')->where('ticket_type_id', $typeId)
            ->where('status', '!=', 'batal')
            ->where(fn ($q) => $q->where('status', '!=', 'menunggu')->orWhere('expires_at', '>', now()))
            ->sum('quantity');
    }

    private function guard(Request $request, Event $event, bool $salesOnly = false): void
    {
        $inst = $request->attributes->get('institution');
        abort_unless($inst && $event->institution_id === $inst->id, 404);
        $methods = ['ticket', 'transfer_manual'];
        abort_unless(in_array($event->registration_method, $methods, true) && $event->status === Event::PUBLISHED, 404);
    }

    private function validated(Request $request, Event $event, ?TicketType $type = null): array
    {
        $end = $event->ends_at->toDateString();
        $start = $event->starts_at->toDateString();
        $data = $request->validate([
            'name' => ['required', 'string', 'max:60'],
            'audience' => ['sometimes', 'in:peserta,umum'],
            'price' => ['required', 'integer', 'min:0', 'max:100000000'],
            'quota' => ['required', 'integer', 'min:1', 'max:1000000'],
            'valid_days' => ['required', 'integer', 'min:1', 'max:365'],
            'valid_date' => ['nullable', 'date_format:Y-m-d', "after_or_equal:{$start}", "before_or_equal:{$end}"],
            'custom_sale' => ['required', 'boolean'],
            'valid_from' => ['required_if:custom_sale,true', 'nullable', 'date'],
            'valid_until' => ['required_if:custom_sale,true', 'nullable', 'date', 'after_or_equal:valid_from', "before_or_equal:{$end}"],
            'require_holder_details' => ['required', 'boolean'],
            'max_per_order' => ['sometimes', 'integer', 'min:1', 'max:10'],
            'support_enabled' => ['required', 'boolean'],
            'support_options' => ['nullable', 'array', 'max:50'],
            'support_options.*' => ['nullable', 'string', 'max:60'],
        ], [
            'name.required' => 'Isi nama jenis tiket.',
            'audience.in' => 'Pilih tiket untuk peserta atau untuk umum.',
            'price.required' => 'Isi harga tiket (0 untuk gratis).',
            'price.integer' => 'Harga harus berupa angka.',
            'quota.required' => 'Isi kuota tiket.',
            'quota.min' => 'Kuota minimal 1.',
            'valid_days.required' => 'Isi masa berlaku tiket.',
            'valid_days.min' => 'Masa berlaku minimal 1 hari.',
            'valid_date.date_format' => 'Format hari berlaku tidak valid.',
            'valid_date.after_or_equal' => 'Hari berlaku tidak boleh sebelum event dimulai.',
            'valid_date.before_or_equal' => 'Hari berlaku tidak boleh setelah event berakhir.',
            'valid_from.required_if' => 'Isi tanggal mulai jual.',
            'valid_until.required_if' => 'Isi tanggal akhir jual.',
            'valid_until.after_or_equal' => 'Tanggal akhir jual tidak boleh sebelum tanggal mulai.',
            'valid_until.before_or_equal' => 'Penjualan tidak boleh melewati akhir event ('.$end.').',
            'max_per_order.max' => 'Maksimal 10 tiket per pesanan.',
        ]);

        $data['name'] = trim($data['name']);
        $data['audience'] = $event->registration_method !== 'ticket'
            ? 'umum'
            : ($data['audience'] ?? ($type->audience ?? 'peserta'));

        // Hari berlaku (satu hari kegiatan) hanya untuk tiket pengunjung. Peserta selalu selama kegiatan.
        $vd = ($data['audience'] === 'umum' && ! empty($data['valid_date'])) ? substr((string) $data['valid_date'], 0, 10) : null;
        unset($data['valid_date']);
        if ($vd) {
            $data['valid_days'] = 1; // satu aturan saja: tiket sehari
            if ($data['custom_sale'] && substr((string) $data['valid_until'], 0, 10) > $vd) {
                throw \Illuminate\Validation\ValidationException::withMessages(['valid_until' => 'Akhir penjualan tidak boleh melewati hari berlaku tiket.']);
            }
        }
        $data['valid_dates'] = $vd ? json_encode([$vd]) : null;

        // Tiket pendaftaran peserta dikunci sistem: 1 tiket per pesanan.
        $data['max_per_order'] = ($event->registration_method === 'ticket' && $data['audience'] === 'peserta')
            ? 1
            : (int) ($data['max_per_order'] ?? 10);

        $opts = collect($data['support_options'] ?? [])->map(fn ($o) => trim((string) $o))->filter()
            ->unique(fn ($o) => mb_strtolower($o))->values()->all();
        if ($data['support_enabled'] && count($opts) < 2) {
            throw \Illuminate\Validation\ValidationException::withMessages(['support_options' => 'Isi minimal 2 pilihan dukungan, satu per baris.']);
        }
        $data['support_options'] = $data['support_enabled'] ? json_encode($opts, JSON_UNESCAPED_UNICODE) : null;
        $dupe = TicketType::where('event_id', $event->id)
            ->whereRaw('lower(name) = ?', [mb_strtolower($data['name'])])
            ->when($type, fn ($q) => $q->where('id', '!=', $type->id))
            ->exists();
        if ($dupe) {
            throw \Illuminate\Validation\ValidationException::withMessages(['name' => 'Nama jenis tiket sudah dipakai di event ini.']);
        }

        if (! $data['custom_sale']) {
            $data['valid_from'] = ($type && ! $type->custom_sale) ? $type->valid_from->toDateString() : now()->toDateString();
            $data['valid_until'] = $end;
        }

        return $data;
    }

    /** Transaksi tiket event ini (dan sub-event bila rangkaian), JSON untuk tab Transaksi. */
    public function transaksi(Request $request, Event $event)
    {
        $inst = $request->attributes->get('institution');
        abort_unless($inst && $event->institution_id === $inst->id, 404);

        $ids = array_merge([$event->id], DB::table('events')->where('parent_id', $event->id)->pluck('id')->all());
        $tz = config('app.agenda_timezone', 'Asia/Jakarta');

        $status = (string) $request->query('status', 'all');
        if (! in_array($status, ['all', 'lunas', 'menunggu', 'menunggu_verifikasi', 'batal'], true)) {
            $status = 'all';
        }
        $q = trim((string) $request->query('q', ''));
        $date = fn (string $k) => preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) $request->query($k)) ? (string) $request->query($k) : null;
        $from = $date('from');
        $to = $date('to');
        $per = in_array((int) $request->query('per_page'), [10, 15, 25, 50], true) ? (int) $request->query('per_page') : 15;

        $scope = fn () => DB::table('ticket_orders as o')
            ->join('ticket_types as t', 't.id', '=', 'o.ticket_type_id')
            ->join('events as e', 'e.id', '=', 'o.event_id')
            ->whereIn('o.event_id', $ids);

        $by = $scope()
            ->selectRaw('o.status as st, count(*) as n, sum(o.quantity) as qty, sum(o.subtotal) as subtotal_sum, sum(o.fee) as fee_sum')
            ->groupBy('o.status')->get()->keyBy('st');
        $cnt = fn (string $k) => (int) ($by[$k]->n ?? 0);
        $lunas = $by['lunas'] ?? null;

        $page = $scope()
            ->when($status !== 'all', fn ($w) => $w->where('o.status', $status))
            ->when($q !== '', fn ($w) => $w->where(function ($s) use ($q) {
                $s->where('o.code', 'like', "%{$q}%")
                    ->orWhere('o.buyer_name', 'like', "%{$q}%")
                    ->orWhere('o.buyer_email', 'like', "%{$q}%")
                    ->orWhere('o.group_code', 'like', "%{$q}%");
            }))
            ->when($from, fn ($w) => $w->whereDate('o.created_at', '>=', $from))
            ->when($to, fn ($w) => $w->whereDate('o.created_at', '<=', $to))
            ->orderByDesc('o.id')
            ->paginate($per, [
                'o.id', 'o.code', 'o.group_code', 'o.buyer_name', 'o.buyer_email', 'o.quantity', 'o.subtotal', 'o.fee', 'o.total',
                'o.status', 'o.payment_method', 'o.midtrans_payment_type', 'o.payment_proof', 'o.reject_reason', 'o.visit_date',
                'o.created_at', 'o.paid_at', 't.name as type_name', 'e.title as event_title',
            ]);

        $fmt = fn ($v) => $v ? \Carbon\Carbon::parse($v)->setTimezone($tz)->toIso8601String() : null;

        return response()->json([
            'stats' => [
                'orders' => (int) ($lunas->n ?? 0),
                'tickets' => (int) ($lunas->qty ?? 0),
                'revenue' => (int) ($lunas->subtotal_sum ?? 0),
                'fee' => (int) ($lunas->fee_sum ?? 0),
                'paid' => (int) (($lunas->subtotal_sum ?? 0) + ($lunas->fee_sum ?? 0)),
            ],
            'counts' => [
                'all' => (int) $by->sum('n'),
                'lunas' => $cnt('lunas'),
                'menunggu' => $cnt('menunggu'),
                'menunggu_verifikasi' => $cnt('menunggu_verifikasi'),
                'batal' => $cnt('batal'),
            ],
            'orders' => [
                'data' => collect($page->items())->map(fn ($o) => [
                    'id' => (int) $o->id,
                    'code' => $o->code,
                    'group_code' => $o->group_code,
                    'buyer_name' => $o->buyer_name,
                    'buyer_email' => $o->buyer_email,
                    'quantity' => (int) $o->quantity,
                    'subtotal' => (int) $o->subtotal,
                    'fee' => (int) $o->fee,
                    'total' => (int) $o->total,
                    'status' => $o->status,
                    'payment_method' => $o->payment_method,
                    'payment_type' => $o->midtrans_payment_type,
                    'has_proof' => ! empty($o->payment_proof),
                    'reject_reason' => $o->reject_reason,
                    'visit_date' => $o->visit_date,
                    'created_at' => $fmt($o->created_at),
                    'paid_at' => $fmt($o->paid_at),
                    'type_name' => $o->type_name,
                    'event_title' => $o->event_title,
                ])->values()->all(),
                'page' => $page->currentPage(),
                'last_page' => $page->lastPage(),
                'total' => $page->total(),
            ],
        ]);
    }
    public function toggle(Request $request, Event $event): RedirectResponse
    {
        $this->guard($request, $event, true);
        $data = $request->validate(['open' => ['required', 'boolean']]);

        if ($data['open'] && ! TicketType::where('event_id', $event->id)->exists()) {
            return back()->with('error', 'Tambahkan minimal satu jenis tiket dulu.');
        }

        DB::table('events')->where('id', $event->id)->update(['ticket_sales_open' => $data['open'] ? 1 : 0]);

        return back()->with('success', $data['open'] ? 'Penjualan tiket dibuka.' : 'Penjualan tiket ditutup.');
    }

    public function store(Request $request, Event $event): RedirectResponse
    {
        $this->guard($request, $event);
        $data = $this->validated($request, $event);

        TicketType::create($data + ['event_id' => $event->id]);

        return back()->with('success', 'Jenis tiket ditambahkan.');
    }

    public function update(Request $request, Event $event, TicketType $type): RedirectResponse
    {
        $this->guard($request, $event);
        abort_unless($type->event_id === $event->id, 404);
        $data = $this->validated($request, $event, $type);

        $hasOrders = DB::table('ticket_orders')->where('ticket_type_id', $type->id)->where('status', '!=', 'batal')->exists();
        if ($hasOrders && (int) $data['price'] !== (int) $type->price) {
            return back()->withErrors(['price' => 'Harga tidak bisa diubah karena sudah ada pesanan untuk jenis ini.']);
        }
        if ($hasOrders && $event->registration_method === 'ticket' && $data['audience'] !== ($type->audience ?? 'peserta')) {
            return back()->withErrors(['audience' => 'Tidak bisa diubah karena sudah ada pesanan untuk jenis ini.']);
        }
        $oldVd = is_array($type->valid_dates ?? null) ? $type->valid_dates : (json_decode((string) ($type->valid_dates ?? ''), true) ?: []);
        $newVd = json_decode((string) ($data['valid_dates'] ?? ''), true) ?: [];
        if ($hasOrders && $oldVd !== $newVd) {
            return back()->withErrors(['valid_date' => 'Hari berlaku tidak bisa diubah karena sudah ada pesanan untuk jenis ini.']);
        }
        $sold = self::sold($type->id);
        if ((int) $data['quota'] < $sold) {
            return back()->withErrors(['quota' => "Kuota tidak boleh di bawah tiket yang sudah terpakai ({$sold})."]);
        }

        $type->update($data);

        return back()->with('success', 'Jenis tiket diperbarui.');
    }

    public function destroy(Request $request, Event $event, TicketType $type): RedirectResponse
    {
        $this->guard($request, $event);
        abort_unless($type->event_id === $event->id, 404);

        if (DB::table('ticket_orders')->where('ticket_type_id', $type->id)->exists()) {
            return back()->with('error', 'Jenis tiket yang sudah punya pesanan tidak bisa dihapus.');
        }
        if (TicketType::where('event_id', $event->id)->count() <= 1) {
            return back()->with('error', 'Event harus punya minimal satu jenis tiket.');
        }

        $type->delete();

        return back()->with('success', 'Jenis tiket dihapus.');
    }
}
