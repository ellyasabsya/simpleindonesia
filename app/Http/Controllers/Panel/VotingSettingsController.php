<?php

namespace App\Http\Controllers\Panel;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class VotingSettingsController extends Controller
{
    private function guard(Request $request, Event $event): void
    {
        $inst = $request->attributes->get('institution');
        abort_unless($inst && $event->institution_id === $inst->id, 404);
    }

    private function owned(string $table, int $eventId, int $id): void
    {
        abort_unless(DB::table($table)->where('id', $id)->where('event_id', $eventId)->exists(), 404);
    }

    private function settings(int $eventId): object
    {
        if (DB::table('voting_settings')->insertOrIgnore(['event_id' => $eventId, 'sound_min_votes' => 30, 'created_at' => now(), 'updated_at' => now()]) > 0) {
            $ppv = (int) (DB::table('voting_settings')->where('event_id', $eventId)->value('price_per_vote') ?: 1000);
            foreach ([['🔥', 'Api', 10], ['🐻', 'Beruang', 20], ['🚀', 'Roket', 50], ['🦁', 'Singa', 100]] as [$emoji, $name, $votes]) {
                DB::table('voting_gifts')->insert([
                    'event_id' => $eventId, 'emoji' => $emoji, 'name' => $name, 'votes' => $votes,
                    'price' => $votes * $ppv, 'active' => 1, 'auto_price' => 1,
                    'created_at' => now(), 'updated_at' => now(),
                ]);
            }
        }

        return DB::table('voting_settings')->where('event_id', $eventId)->first();
    }

    public function index(Request $request, Event $event)
    {
        $this->guard($request, $event);
        $s = $this->settings($event->id);

        $props = [
            'eventId' => $event->id,
            'eventEnd' => \Illuminate\Support\Carbon::parse($event->ends_at)->format('Y-m-d').'T23:59',
            'settings' => [
                'enabled' => (bool) $s->enabled,
                'price_per_vote' => (int) $s->price_per_vote,
                'min_votes' => (int) $s->min_votes,
                'message_enabled' => (bool) $s->message_enabled,
                'message_max' => (int) $s->message_max,
                'sound_min_votes' => (int) $s->sound_min_votes,
                'show_sender' => (bool) $s->show_sender,
                'show_ranking' => (bool) $s->show_ranking,
                'show_votes' => (bool) $s->show_votes,
                'vote_start' => $s->vote_start ? substr((string) $s->vote_start, 0, 10) : null,
                'vote_end' => $s->vote_end ? substr((string) $s->vote_end, 0, 10) : null,
            ],
            'categories' => DB::table('voting_categories')->where('event_id', $event->id)->orderBy('sort')->orderBy('id')->get(['id', 'name', 'opens_at', 'closes_at'])
                ->map(fn ($r) => ['id' => (int) $r->id, 'name' => $r->name, 'opens_at' => $this->dtLocal($r->opens_at), 'closes_at' => $this->dtLocal($r->closes_at)])->all(),
            'participants' => DB::table('voting_participants')->where('event_id', $event->id)->orderBy('sort')->orderBy('id')->get(['id', 'category_id', 'name', 'description', 'active', 'photo', 'upload_token'])
                ->map(fn ($r) => ['id' => (int) $r->id, 'category_id' => $r->category_id ? (int) $r->category_id : null, 'name' => $r->name, 'description' => $r->description, 'active' => (bool) $r->active, 'photo' => $r->photo ? '/storage/'.$r->photo : null, 'upload_url' => url('/foto-peserta/'.$r->upload_token)])->all(),
            'gifts' => DB::table('voting_gifts')->where('event_id', $event->id)->orderBy('votes')->orderBy('id')->get(['id', 'emoji', 'name', 'votes', 'price', 'active'])
                ->map(fn ($r) => ['id' => (int) $r->id, 'emoji' => $r->emoji, 'name' => $r->name, 'votes' => (int) $r->votes, 'price' => (int) $r->price, 'active' => (bool) $r->active])->all(),
        ];

        $dash = app(\App\Http\Controllers\Panel\EventDashboardController::class);

        return \Closure::bind(fn () => $this->render('panel/events/voting', $event, $props), $dash, \App\Http\Controllers\Panel\EventDashboardController::class)();
    }

    private function dtLocal($v): ?string
    {
        return $v ? str_replace(' ', 'T', substr((string) $v, 0, 16)) : null;
    }

    /** Peserta aktif harus punya kategori, dan kategori yang berisi peserta harus punya jadwal lengkap. */
    private function scheduleReady(int $eventId): bool
    {
        $parts = DB::table('voting_participants')->where('event_id', $eventId)->where('active', 1)->get(['category_id']);
        if ($parts->isEmpty() || $parts->contains(fn ($p) => ! $p->category_id)) {
            return false;
        }
        $used = $parts->pluck('category_id')->unique()->all();

        return DB::table('voting_categories')->where('event_id', $eventId)->whereIn('id', $used)
            ->where(fn ($q) => $q->whereNull('opens_at')->orWhereNull('closes_at'))->doesntExist();
    }

    /** Voting aktif otomatis kalau peserta dan jadwal kategori sudah lengkap. */
    private function syncEnabled(int $eventId): void
    {
        $this->settings($eventId);
        $ready = DB::table('voting_participants')->where('event_id', $eventId)->where('active', 1)->count() >= 2 && $this->scheduleReady($eventId);
        DB::table('voting_settings')->where('event_id', $eventId)->update(['enabled' => $ready ? 1 : 0, 'updated_at' => now()]);
    }

    public function toggle(Request $request, Event $event): RedirectResponse
    {
        $this->guard($request, $event);
        $data = $request->validate(['open' => ['required', 'boolean']]);
        $this->settings($event->id);

        if ($data['open'] && DB::table('voting_participants')->where('event_id', $event->id)->where('active', 1)->count() < 2) {
            return back()->with('error', 'Tambahkan minimal 2 peserta aktif dulu.');
        }
        $noPhoto = DB::table('voting_participants')->where('event_id', $event->id)->where('active', 1)->whereNull('photo')->count();
        if ($data['open'] && $noPhoto > 0) {
            return back()->with('error', "{$noPhoto} peserta aktif belum punya foto. Lengkapi dulu sebelum voting dibuka.");
        }

        if ($data['open'] && ! $this->scheduleReady($event->id)) {
            return back()->with('error', 'Semua peserta aktif harus punya kategori, dan semua kategori berisi peserta harus punya jadwal buka dan tutup.');
        }

        DB::table('voting_settings')->where('event_id', $event->id)->update(['enabled' => $data['open'] ? 1 : 0, 'updated_at' => now()]);

        return back()->with('success', $data['open'] ? 'Voting dibuka.' : 'Voting ditutup.');
    }

    public function settingsUpdate(Request $request, Event $event): RedirectResponse
    {
        $this->guard($request, $event);
        $data = $request->validate([
            'price_per_vote' => ['required', 'integer', 'min:1', 'max:10000000'],
            'min_votes' => ['required', 'integer', 'min:1', 'max:1000'],
            'message_enabled' => ['required', 'boolean'],
            'message_max' => ['required', 'integer', 'min:1', 'max:200'],
            'sound_min_votes' => ['required', 'integer', 'min:0', 'max:100000'],
            'show_sender' => ['required', 'boolean'],
            'show_ranking' => ['required', 'boolean'],
            'show_votes' => ['required', 'boolean'],
        ], [
            'price_per_vote.min' => 'Harga per vote minimal Rp1.',
            'message_max.max' => 'Batas karakter pesan maksimal 200.',
            'message_max.min' => 'Batas karakter pesan minimal 1.',
        ]);
        $this->settings($event->id);
        DB::table('voting_settings')->where('event_id', $event->id)->update($data + ['updated_at' => now()]);
        $ppv = (int) DB::table('voting_settings')->where('event_id', $event->id)->value('price_per_vote');
        if ($ppv > 0) {
            DB::table('voting_gifts')->where('event_id', $event->id)->where('auto_price', 1)
                ->update(['price' => DB::raw('votes * '.$ppv), 'updated_at' => now()]);
        }

        return back()->with('success', 'Pengaturan voting disimpan.');
    }

    /* ---------- Kategori ---------- */

    public function storeCategory(Request $request, Event $event): RedirectResponse
    {
        $this->guard($request, $event);
        $data = $request->validate(['name' => ['required', 'string', 'max:60']], ['name.required' => 'Isi nama kategori.']);
        $name = trim($data['name']);

        if (DB::table('voting_categories')->where('event_id', $event->id)->whereRaw('lower(name) = ?', [mb_strtolower($name)])->exists()) {
            return back()->withErrors(['name' => 'Kategori itu sudah ada.']);
        }
        if (DB::table('voting_categories')->where('event_id', $event->id)->count() >= 20) {
            return back()->withErrors(['name' => 'Maksimal 20 kategori.']);
        }
        $sort = (int) DB::table('voting_categories')->where('event_id', $event->id)->max('sort') + 1;
        DB::table('voting_categories')->insert(['event_id' => $event->id, 'name' => $name, 'sort' => $sort, 'created_at' => now(), 'updated_at' => now()]);

        $this->syncEnabled($event->id);

        return back()->with('success', 'Kategori ditambahkan.');
    }

    public function updateCategory(Request $request, Event $event, int $item): RedirectResponse
    {
        $this->guard($request, $event);
        $this->owned('voting_categories', $event->id, $item);
        $data = $request->validate([
            'opens_at' => ['nullable', 'date'],
            'closes_at' => ['nullable', 'date'],
        ], ['opens_at.date' => 'Format jam buka tidak valid.', 'closes_at.date' => 'Format jam tutup tidak valid.']);

        $o = ! empty($data['opens_at']) ? \Illuminate\Support\Carbon::parse($data['opens_at']) : null;
        $c = ! empty($data['closes_at']) ? \Illuminate\Support\Carbon::parse($data['closes_at']) : null;
        if ($o && $c && $c->lte($o)) {
            throw ValidationException::withMessages(['closes_at' => 'Jam tutup harus setelah jam buka.']);
        }
        DB::table('voting_categories')->where('id', $item)->update([
            'opens_at' => $o?->format('Y-m-d H:i:s'), 'closes_at' => $c?->format('Y-m-d H:i:s'), 'updated_at' => now(),
        ]);

        $this->syncEnabled($event->id);

        return back()->with('success', 'Jadwal kategori disimpan.');
    }

    public function updateSchedules(Request $request, Event $event): RedirectResponse
    {
        $this->guard($request, $event);
        $data = $request->validate([
            'items' => ['required', 'array', 'max:50'],
            'items.*.id' => ['required', 'integer'],
            'items.*.opens_at' => ['nullable', 'date'],
            'items.*.closes_at' => ['nullable', 'date'],
        ]);
        $ids = DB::table('voting_categories')->where('event_id', $event->id)->pluck('id')->map(fn ($v) => (int) $v)->all();

        $maxStr = \Illuminate\Support\Carbon::parse($event->ends_at)->format('Y-m-d').' 23:59:59';
        $over = fn ($d) => $d && $d->format('Y-m-d H:i:s') > $maxStr;
        $rows = [];
        foreach ($data['items'] as $i => $it) {
            abort_unless(in_array((int) $it['id'], $ids, true), 404);
            $o = ! empty($it['opens_at']) ? \Illuminate\Support\Carbon::parse($it['opens_at']) : null;
            $c = ! empty($it['closes_at']) ? \Illuminate\Support\Carbon::parse($it['closes_at']) : null;
            if ($o && $c && $c->lte($o)) {
                throw ValidationException::withMessages(['items' => 'Jam tutup harus setelah jam buka (baris ke-'.($i + 1).').']);
            }
            if ($over($o) || $over($c)) {
                throw ValidationException::withMessages(['items' => 'Jam buka dan tutup tidak boleh melewati akhir event ('.\Illuminate\Support\Carbon::parse($event->ends_at)->locale('id')->translatedFormat('j F Y').'), baris ke-'.($i + 1).'.']);
            }
            $rows[(int) $it['id']] = ['opens_at' => $o?->format('Y-m-d H:i:s'), 'closes_at' => $c?->format('Y-m-d H:i:s'), 'updated_at' => now()];
        }

        DB::transaction(function () use ($rows) {
            foreach ($rows as $id => $row) {
                DB::table('voting_categories')->where('id', $id)->update($row);
            }
        });
        $this->syncEnabled($event->id);

        return back()->with('success', 'Jadwal kategori disimpan.');
    }

    public function destroyCategory(Request $request, Event $event, int $item): RedirectResponse
    {
        $this->guard($request, $event);
        $this->owned('voting_categories', $event->id, $item);
        DB::table('voting_participants')->where('event_id', $event->id)->where('category_id', $item)->update(['category_id' => null]);
        DB::table('voting_categories')->where('id', $item)->delete();

        $this->syncEnabled($event->id);

        return back()->with('success', 'Kategori dihapus. Pesertanya pindah ke Tanpa kategori.');
    }

    /* ---------- Peserta ---------- */

    private function participantData(Request $request, Event $event): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'description' => ['nullable', 'string', 'max:160'],
            'category_id' => ['nullable', 'integer'],
            'active' => ['required', 'boolean'],
            'photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:3072'],
            'remove_photo' => ['nullable', 'boolean'],
        ], ['name.required' => 'Isi nama peserta.', 'photo.image' => 'File harus berupa gambar.', 'photo.mimes' => 'Foto harus JPG, PNG, atau WebP.', 'photo.max' => 'Ukuran foto maksimal 3 MB.']);
        unset($data['photo'], $data['remove_photo']);

        if (! empty($data['category_id']) && ! DB::table('voting_categories')->where('id', $data['category_id'])->where('event_id', $event->id)->exists()) {
            throw ValidationException::withMessages(['category_id' => 'Kategori tidak valid.']);
        }
        $data['name'] = trim($data['name']);
        $data['description'] = isset($data['description']) ? trim($data['description']) ?: null : null;

        return $data;
    }

    public function storeParticipant(Request $request, Event $event): RedirectResponse
    {
        $this->guard($request, $event);
        $data = $this->participantData($request, $event);
        if (DB::table('voting_participants')->where('event_id', $event->id)->count() >= 200) {
            return back()->with('error', 'Maksimal 200 peserta.');
        }
        $sort = (int) DB::table('voting_participants')->where('event_id', $event->id)->max('sort') + 1;
        $photo = $request->file('photo') ? \App\Support\ImageUploader::store($request->file('photo'), "voting/{$event->id}", 'photo', 600) : null;
        DB::table('voting_participants')->insert($data + ['event_id' => $event->id, 'sort' => $sort, 'photo' => $photo, 'upload_token' => \Illuminate\Support\Str::random(32), 'created_at' => now(), 'updated_at' => now()]);

        $this->syncEnabled($event->id);

        return back()->with('success', 'Peserta ditambahkan.');
    }

    public function updateParticipant(Request $request, Event $event, int $item): RedirectResponse
    {
        $this->guard($request, $event);
        $this->owned('voting_participants', $event->id, $item);
        $data = $this->participantData($request, $event);
        $old = DB::table('voting_participants')->where('id', $item)->value('photo');
        if ($request->file('photo')) {
            $data['photo'] = \App\Support\ImageUploader::store($request->file('photo'), "voting/{$event->id}", 'photo', 600);
            if ($old) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($old);
            }
        } elseif ($request->boolean('remove_photo') && $old) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($old);
            $data['photo'] = null;
        }
        DB::table('voting_participants')->where('id', $item)->update($data + ['updated_at' => now()]);

        $this->syncEnabled($event->id);

        return back()->with('success', 'Peserta diperbarui.');
    }

    public function destroyParticipant(Request $request, Event $event, int $item): RedirectResponse
    {
        $this->guard($request, $event);
        $this->owned('voting_participants', $event->id, $item);
        $old = DB::table('voting_participants')->where('id', $item)->value('photo');
        if ($old) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($old);
        }
        DB::table('voting_participants')->where('id', $item)->delete();

        $this->syncEnabled($event->id);

        return back()->with('success', 'Peserta dihapus.');
    }

    public function resetLink(Request $request, Event $event, int $item): RedirectResponse
    {
        $this->guard($request, $event);
        $this->owned('voting_participants', $event->id, $item);
        DB::table('voting_participants')->where('id', $item)->update(['upload_token' => \Illuminate\Support\Str::random(32), 'updated_at' => now()]);

        return back()->with('success', 'Link baru dibuat. Link lama tidak berlaku lagi.');
    }

    /* ---------- Gift ---------- */

    private function giftData(Request $request): array
    {
        $data = $request->validate([
            'emoji' => ['required', 'string', 'max:8'],
            'name' => ['required', 'string', 'max:40'],
            'votes' => ['required', 'integer', 'min:1', 'max:100000'],
            'price' => ['required', 'integer', 'min:0', 'max:100000000'],
            'active' => ['required', 'boolean'],
        ], [
            'emoji.required' => 'Pilih emoji gift.',
            'name.required' => 'Isi nama gift.',
            'votes.required' => 'Isi jumlah vote.',
            'votes.min' => 'Jumlah vote minimal 1.',
            'price.required' => 'Isi harga gift.',
        ]);
        $data['name'] = trim($data['name']);

        return $data;
    }

    public function storeGift(Request $request, Event $event): RedirectResponse
    {
        $this->guard($request, $event);
        $data = $this->giftData($request);
        if (DB::table('voting_gifts')->where('event_id', $event->id)->count() >= 12) {
            return back()->with('error', 'Maksimal 12 gift.');
        }
        DB::table('voting_gifts')->insert($data + ['event_id' => $event->id, 'created_at' => now(), 'updated_at' => now()]);

        return back()->with('success', 'Gift ditambahkan.');
    }

    public function updateGift(Request $request, Event $event, int $item): RedirectResponse
    {
        $this->guard($request, $event);
        $this->owned('voting_gifts', $event->id, $item);
        $gd = $this->giftData($request);
        $old = DB::table('voting_gifts')->where('id', $item)->first();
        if ($old && isset($gd['price']) && (int) $gd['price'] !== (int) $old->price) {
            $gd['auto_price'] = 0;
        }
        DB::table('voting_gifts')->where('id', $item)->update($gd + ['updated_at' => now()]);

        return back()->with('success', 'Gift diperbarui.');
    }

    public function toggleGift(Request $request, Event $event, int $item): RedirectResponse
    {
        $this->guard($request, $event);
        $this->owned('voting_gifts', $event->id, $item);
        DB::table('voting_gifts')->where('id', $item)->update(['active' => DB::raw('1 - active'), 'updated_at' => now()]);

        return back();
    }

    public function destroyGift(Request $request, Event $event, int $item): RedirectResponse
    {
        $this->guard($request, $event);
        $this->owned('voting_gifts', $event->id, $item);
        DB::table('voting_gifts')->where('id', $item)->delete();

        return back()->with('success', 'Gift dihapus.');
    }
}
