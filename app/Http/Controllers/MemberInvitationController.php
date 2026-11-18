<?php

namespace App\Http\Controllers;

use App\Models\Institution;
use App\Models\InstitutionMember;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class MemberInvitationController extends Controller
{
    private function pending(Request $request, InstitutionMember $member): Institution
    {
        abort_unless($member->user_id === $request->user()->id, 403);
        abort_unless(($member->getAttributes()['status'] ?? 'aktif') === 'menunggu', 404);

        return Institution::findOrFail($member->institution_id);
    }

    private function tellOwner(Institution $institution, string $title, string $message): void
    {
        try {
            $institution->user?->notify(new \App\Notifications\AdminAlert($title, $message, '/panel'));
        } catch (\Throwable $e) {
            report($e);
        }
    }

    public function accept(Request $request, InstitutionMember $member): RedirectResponse
    {
        $institution = $this->pending($request, $member);
        $member->forceFill(['status' => 'aktif'])->save();
        $this->tellOwner($institution, 'Undangan diterima', "{$request->user()->name} menerima undangan bergabung ke {$institution->name}.");

        return back()->with('success', "Anda bergabung ke {$institution->name}.");
    }

    public function decline(Request $request, InstitutionMember $member): RedirectResponse
    {
        $institution = $this->pending($request, $member);
        $member->delete();
        $this->tellOwner($institution, 'Undangan ditolak', "{$request->user()->name} menolak undangan bergabung ke {$institution->name}.");

        return back()->with('success', 'Undangan ditolak.');
    }
}
