<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            // Event utama pada rangkaian tidak punya kategori dan lokasi
            $table->string('category')->nullable()->change();
            $table->string('location', 150)->nullable()->change();

            $table->unsignedInteger('participant_quota')->nullable()->after('location');
            $table->string('registration_method', 20)->nullable()->after('participant_quota');
            $table->string('contact_name', 100)->nullable()->after('registration_method');
            $table->string('contact_phone', 30)->nullable()->after('contact_name');
            $table->string('contact_email', 120)->nullable()->after('contact_phone');
            $table->string('contact_position', 80)->nullable()->after('contact_email');
        });

        Schema::create('event_participant_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained()->cascadeOnDelete();
            $table->string('name', 60);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('event_participant_categories');
        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn([
                'participant_quota', 'registration_method',
                'contact_name', 'contact_phone', 'contact_email', 'contact_position',
            ]);
        });
    }
};
