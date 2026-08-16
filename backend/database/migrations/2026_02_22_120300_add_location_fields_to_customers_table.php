<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->unsignedBigInteger('county_id')->nullable();
            $table->unsignedBigInteger('constituency_id')->nullable();
            $table->unsignedBigInteger('ward_id')->nullable();

            // Indexes for faster filtering
            $table->index('county_id');
            $table->index('constituency_id');
            $table->index('ward_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn(['county_id', 'constituency_id', 'ward_id']);
        });
    }
};
