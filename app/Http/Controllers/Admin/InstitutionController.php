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
    public function index(Request $request): Response
    {
        $status = $request->query('status', 'pending');
        $q = trim((string) $request->query('q', ''));

        $items = Institution::with('user:id,name,email')
            ->when(
                in_array($status, ['pending', 'approved', 'rejected'], true),
                fn ($query) => $query->where('status', $status)
            )
            ->when($q !== '', function ($query) use ($q) {
                $query->where(function ($w) use ($q) {
                    $w->where('name', 'like', "%{$q}%")
                        ->orWhere('email', 'like', "%{$q}%")
                        ->orWhere('phone', 'like', "%{$q}%")
                        ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$q}%"));
                });
            })
            ->latest()
            ->paginate(8)
            ->withQueryString()
            ->through(fn (Institution $i) => [
                'id' => $i->id,
                'name' => $i->name,
                'email' => $i->email,
                'phone' => $i->phone,
                'status' => $i->status,
                'rejection_reason' => $i->rejection_reason,
                'created_at' => $i->created_at?->toISOString(),
                'owner' => $i->user?->only('name', 'email'),
            ]);

        return Inertia::render('admin/lembaga', [
            'items' => $items,
            'filters' => ['status' => $status, 'q' => $q],
            'counts' => [
                'all' => Institution::count(),
                'pending' => Institution::where('status', 'pending')->count(),
                'approved' => Institution::where('status', 'approved')->count(),
                'rejected' => Institution::where('status', 'rejected')->count(),
            ],
        ]);
    }

    public function update(Request $request, Institution $institution): RedirectResponse
    {
        $data = $request->validate([
            'status' => ['required', 'in:approved,rejected,pending'],
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $institution->update([
            'status' => $data['status'],
            'rejection_reason' => $data['status'] === 'rejected' ? ($data['reason'] ?? null) : null,
            'reviewed_at' => now(),
        ]);

        return back();
    }
}
