<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            if (! Schema::hasColumn('events', 'parent_id')) {
                $table->unsignedBigInteger('parent_id')->nullable()->index();
            }
            if (! Schema::hasColumn('events', 'sub_order')) {
                $table->unsignedInteger('sub_order')->default(0);
            }
        });
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            if (Schema::hasColumn('events', 'parent_id')) {
                $table->dropIndex(['parent_id']);
                $table->dropColumn('parent_id');
            }
            if (Schema::hasColumn('events', 'sub_order')) {
                $table->dropColumn('sub_order');
            }
        });
    }
};
