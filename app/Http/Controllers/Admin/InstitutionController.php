<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Institution;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InstitutionController extends Controller
{
    private const PER_PAGE = 10;

    public function index(Request $request): Response
    {
        $status = $request->query('status');
        $status = in_array($status, ['all', 'pending', 'approved'], true) ? $status : 'pending';
        $search = trim((string) $request->query('search', ''));

        $institutions = Institution::query()
            ->with('user:id,name,email')
            ->search($search)
            ->when($status === 'pending', fn ($q) => $q->where('status', Institution::PENDING))
            ->when($status === 'approved', fn ($q) => $q->where('status', Institution::APPROVED))
            ->latest()
            ->latest('id')
            ->paginate(self::PER_PAGE)
            ->withQueryString()
            ->through(fn (Institution $i) => [
                'id' => $i->id,
                'name' => $i->name,
                'email' => $i->email,
                'phone' => $i->phone,
                'status' => $i->status,
                'member_name' => $i->user?->name,
                'member_email' => $i->user?->email,
                'created_at' => $i->created_at?->toISOString(),
            ]);

        $pending = Institution::where('status', Institution::PENDING)->count();
        $approved = Institution::where('status', Institution::APPROVED)->count();

        return Inertia::render('admin/lembaga', [
            'institutions' => $institutions,
            'filters' => ['search' => $search, 'status' => $status],
            'counts' => ['pending' => $pending, 'approved' => $approved, 'all' => Institution::count()],
        ]);
    }

    public function approve(Institution $institution): RedirectResponse
    {
        $institution->update(['status' => Institution::APPROVED]);

        \App\Support\UserNotifier::send($institution->user, 'Lembaga disetujui', 'Lembaga kamu sudah diverifikasi admin. Panel lembaga kini bisa dibuka.', '/panel');
        \Illuminate\Support\Facades\Cache::forget('user_has_panel:'.$institution->user_id);

        return back()->with('success', 'Lembaga disetujui.');
    }

    public function revoke(Institution $institution): RedirectResponse
    {
        $institution->update(['status' => Institution::PENDING]);

        return back()->with('success', 'Verifikasi lembaga dicabut. Statusnya kembali menunggu.');
    }
}
