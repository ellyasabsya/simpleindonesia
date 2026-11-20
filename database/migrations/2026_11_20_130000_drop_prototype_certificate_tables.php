<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('event_certificate_deliveries');
        Schema::dropIfExists('event_certificate_numbers');
        Schema::dropIfExists('event_certificate_settings');
    }

    public function down(): void
    {
        // Prototipe lama tidak dipulihkan; sistem baru memakai tabel certificate_*.
    }
};
