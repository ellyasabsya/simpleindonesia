<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Sistem Sertifikat Digital (Tahap 2). Semua file PDF/tanda tangan disimpan di disk privat.
 * Tabel lama event_certificate_* (prototipe) sengaja belum disentuh; dihapus di Tahap 3 saat controller lama diganti.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Penandatangan per event (nama, jabatan, gambar tanda tangan).
        Schema::create('certificate_signers', function (Blueprint $t) {
            $t->id();
            $t->foreignId('event_id')->constrained('events')->cascadeOnDelete();
            $t->string('name', 120);
            $t->string('position', 120)->nullable();
            $t->string('signature_path')->nullable();
            $t->timestamps();
        });

        // Template pribadi penyelenggara. Template bawaan SIMPLE didefinisikan di kode, bukan di tabel ini.
        // event_id kosong = bisa dipakai di semua event milik lembaga.
        Schema::create('certificate_templates', function (Blueprint $t) {
            $t->id();
            $t->foreignId('institution_id')->constrained('institutions')->cascadeOnDelete();
            $t->foreignId('event_id')->nullable()->constrained('events')->nullOnDelete();
            $t->string('name', 120);
            $t->string('base_key', 40)->nullable();                    // template bawaan asal salinan
            $t->string('orientation', 10)->default('landscape');       // landscape | portrait
            $t->string('background_path')->nullable();
            $t->string('logo_path')->nullable();
            $t->json('design');                                        // judul, subjudul, font, warna, posisi kolom
            $t->string('number_format', 80)->default('{urut}/SERT/{tahun}');
            $t->foreignId('signer_id')->nullable()->constrained('certificate_signers')->nullOnDelete();
            $t->unsignedBigInteger('created_by')->nullable();
            $t->timestamps();
            $t->index(['institution_id', 'event_id']);
        });

        // Penerima non-otomatis: pemateri, moderator, panitia, penghargaan khusus (tidak ada tabel sumbernya di SIMPLE).
        Schema::create('certificate_recipients', function (Blueprint $t) {
            $t->id();
            $t->foreignId('event_id')->constrained('events')->cascadeOnDelete();
            $t->string('category', 20);
            $t->string('name', 150);
            $t->string('email')->nullable();
            $t->unsignedBigInteger('user_id')->nullable()->index();
            $t->string('award_title', 150)->nullable();                // untuk penghargaan khusus
            $t->timestamps();
            $t->index(['event_id', 'category']);
        });

        // Satu proses penerbitan (individual atau massal) = satu batch.
        Schema::create('certificate_batches', function (Blueprint $t) {
            $t->id();
            $t->foreignId('event_id')->constrained('events')->cascadeOnDelete();
            $t->foreignId('template_id')->nullable()->constrained('certificate_templates')->nullOnDelete();
            $t->string('category', 20);
            $t->string('status', 12)->default('queued');               // queued | running | done | failed
            $t->unsignedInteger('total')->default(0);
            $t->unsignedInteger('done')->default(0);
            $t->unsignedInteger('failed')->default(0);
            $t->unsignedBigInteger('created_by')->nullable();
            $t->dateTime('started_at')->nullable();
            $t->dateTime('finished_at')->nullable();
            $t->timestamps();
            $t->index(['event_id', 'status']);
        });

        // Nomor urut per event per kategori; dikunci dalam transaksi agar nomor tidak ganda.
        Schema::create('certificate_sequences', function (Blueprint $t) {
            $t->id();
            $t->foreignId('event_id')->constrained('events')->cascadeOnDelete();
            $t->string('category', 20);
            $t->unsignedInteger('last_seq')->default(0);
            $t->timestamps();
            $t->unique(['event_id', 'category']);
        });

        // Sertifikat yang diterbitkan. Data penerima disimpan sebagai snapshot dan tidak diubah diam-diam.
        Schema::create('certificates', function (Blueprint $t) {
            $t->id();
            $t->foreignId('event_id')->constrained('events')->cascadeOnDelete();
            $t->foreignId('institution_id')->constrained('institutions')->cascadeOnDelete();
            $t->foreignId('batch_id')->nullable()->constrained('certificate_batches')->nullOnDelete();
            $t->foreignId('template_id')->nullable()->constrained('certificate_templates')->nullOnDelete();

            $t->string('category', 20);                                // peserta|pemateri|moderator|panitia|juri|juara_1|juara_2|juara_3|khusus
            $t->string('award_title', 150)->nullable();

            // Identitas sumber penerima. recipient_key unik per sumber, mis. "ticket:REG-001", "reg:REG-002", "judge:7", "manual:12".
            $t->string('recipient_key', 80);
            $t->unsignedSmallInteger('revision')->default(1);          // naik saat terbit ulang setelah pencabutan
            $t->unsignedBigInteger('user_id')->nullable()->index();    // akun pemilik; kosong bila penerima belum punya akun
            $t->string('recipient_name', 150);
            $t->string('recipient_email')->nullable();

            // Snapshot saat terbit.
            $t->string('event_title');
            $t->string('organizer_name');
            $t->string('event_date_text', 80)->nullable();
            $t->json('design_snapshot')->nullable();

            $t->string('certificate_number', 80)->unique();
            $t->string('verify_token', 64)->unique();
            $t->string('pdf_path')->nullable();                        // disk privat
            $t->string('pdf_hash', 64)->nullable();                    // sha256 isi PDF

            $t->string('status', 10)->default('pending');              // pending | issued | revoked | failed
            $t->dateTime('issued_at')->nullable();
            $t->dateTime('notified_at')->nullable();
            $t->dateTime('revoked_at')->nullable();
            $t->string('revoked_reason', 255)->nullable();
            $t->unsignedBigInteger('revoked_by')->nullable();
            $t->unsignedBigInteger('replaced_by')->nullable();
            $t->timestamps();

            // Idempotensi: retry job tidak membuat sertifikat ganda untuk penerima yang sama.
            $t->unique(['event_id', 'category', 'recipient_key', 'revision'], 'certificates_recipient_unique');
            $t->index(['event_id', 'status']);
            $t->index(['user_id', 'status']);
        });

        // Riwayat penerbitan, notifikasi, pencabutan, kegagalan.
        Schema::create('certificate_events', function (Blueprint $t) {
            $t->id();
            $t->foreignId('event_id')->constrained('events')->cascadeOnDelete();
            $t->foreignId('certificate_id')->nullable()->constrained('certificates')->nullOnDelete();
            $t->foreignId('batch_id')->nullable()->constrained('certificate_batches')->nullOnDelete();
            $t->unsignedBigInteger('actor_id')->nullable();
            $t->string('action', 20);                                  // issued | notified | revoked | reissued | failed
            $t->json('meta')->nullable();
            $t->timestamp('created_at')->useCurrent();
            $t->index(['event_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('certificate_events');
        Schema::dropIfExists('certificates');
        Schema::dropIfExists('certificate_sequences');
        Schema::dropIfExists('certificate_batches');
        Schema::dropIfExists('certificate_recipients');
        Schema::dropIfExists('certificate_templates');
        Schema::dropIfExists('certificate_signers');
    }
};
