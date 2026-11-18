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

    private function guard(Request $request, Event $event): void
    {
        $inst = $request->attributes->get('institution');
        abort_unless($inst && $event->institution_id === $inst->id, 404);
        abort_unless($event->registration_method === 'ticket' && $event->status === Event::PUBLISHED, 404);
    }

    private function validated(Request $request, Event $event, ?TicketType $type = null): array
    {
        $end = $event->ends_at->toDateString();
        $data = $request->validate([
            'name' => ['required', 'string', 'max:60'],
            'price' => ['required', 'integer', 'min:0', 'max:100000000'],
            'quota' => ['required', 'integer', 'min:1', 'max:1000000'],
            'valid_days' => ['required', 'integer', 'min:1', 'max:365'],
            'custom_sale' => ['required', 'boolean'],
            'valid_from' => ['required_if:custom_sale,true', 'nullable', 'date'],
            'valid_until' => ['required_if:custom_sale,true', 'nullable', 'date', 'after_or_equal:valid_from', "before_or_equal:{$end}"],
            'require_holder_details' => ['required', 'boolean'],
            'max_per_order' => ['required', 'integer', 'min:1', 'max:10'],
            'support_enabled' => ['required', 'boolean'],
            'support_options' => ['nullable', 'array', 'max:50'],
            'support_options.*' => ['nullable', 'string', 'max:60'],
        ], [
            'name.required' => 'Isi nama jenis tiket.',
            'price.required' => 'Isi harga tiket (0 untuk gratis).',
            'price.integer' => 'Harga harus berupa angka.',
            'quota.required' => 'Isi kuota tiket.',
            'quota.min' => 'Kuota minimal 1.',
            'valid_days.required' => 'Isi masa berlaku tiket.',
            'valid_days.min' => 'Masa berlaku minimal 1 hari.',
            'valid_from.required_if' => 'Isi tanggal mulai jual.',
            'valid_until.required_if' => 'Isi tanggal akhir jual.',
            'valid_until.after_or_equal' => 'Tanggal akhir jual tidak boleh sebelum tanggal mulai.',
            'valid_until.before_or_equal' => 'Penjualan tidak boleh melewati akhir event ('.$end.').',
            'max_per_order.max' => 'Maksimal 10 tiket per pesanan.',
        ]);

        $data['name'] = trim($data['name']);

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

    public function toggle(Request $request, Event $event): RedirectResponse
    {
        $this->guard($request, $event);
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
