<?php

namespace App\Support;

use App\Models\Certificate;
use App\Models\User;
use App\Notifications\CertificateIssued;
use Illuminate\Support\Facades\Storage;

/**
 * Kirim notifikasi sertifikat terbit, tepat satu kali per sertifikat.
 * Klaim atomik lewat kolom notified_at: dua worker atau retry tidak bisa mengirim dua kali.
 */
class CertificateNotifier
{
    /** @return bool true bila notifikasi dikirim sekarang */
    public static function send(Certificate $cert): bool
    {
        $cert->refresh();

        // Hanya setelah data dan PDF benar-benar tersimpan.
        if ($cert->status !== Certificate::ISSUED || ! $cert->pdf_path
            || ! Storage::disk(CertificateIssuer::DISK)->exists($cert->pdf_path)) {
            return false;
        }
        if ($cert->notified_at) {
            return false;
        }

        $userId = $cert->user_id;
        if (! $userId && $cert->recipient_email) {
            $userId = User::where('email', $cert->recipient_email)->value('id');
            if ($userId) {
                Certificate::whereKey($cert->id)->whereNull('user_id')->update(['user_id' => $userId]);
            }
        }
        $user = $userId ? User::find($userId) : null;
        if (! $user) {
            return false; // penerima belum punya akun: tidak ada yang diberi notifikasi
        }

        // Klaim: hanya satu proses yang berhasil mengubah notified_at dari null.
        $claimed = Certificate::whereKey($cert->id)->whereNull('notified_at')->update(['notified_at' => now()]);
        if ($claimed !== 1) {
            return false;
        }

        try {
            $user->notify(new CertificateIssued($cert));
        } catch (\Throwable $e) {
            Certificate::whereKey($cert->id)->update(['notified_at' => null]); // lepas klaim agar retry bisa mengirim
            throw $e;
        }

        $cert->record('notified', null, ['user_id' => $user->id]);

        return true;
    }
}
