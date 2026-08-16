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
        // Counties Table (Seeder calls it 'location')
        if (!Schema::hasTable('location')) {
            Schema::create('location', function (Blueprint $table) {
                $table->unsignedBigInteger('id')->primary();
                $table->string('description');
                $table->integer('status')->default(1);
                $table->timestamps();
            });
        }

        // Constituencies Table
        if (!Schema::hasTable('constituencies')) {
            Schema::create('constituencies', function (Blueprint $table) {
                $table->unsignedBigInteger('id')->primary();
                $table->unsignedBigInteger('location_id')->index(); // County Reference
                $table->string('description');
                $table->integer('status')->default(1);
                $table->timestamps();
            });
        }

        // Wards Table (Seeder calls it 'location_area')
        if (!Schema::hasTable('location_area')) {
            Schema::create('location_area', function (Blueprint $table) {
                $table->unsignedBigInteger('id')->primary();
                $table->unsignedBigInteger('location_id')->index(); // County Reference
                $table->unsignedBigInteger('constituency_id')->index();
                $table->string('description');
                $table->integer('status')->default(1);
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('location_area');
        Schema::dropIfExists('constituencies');
        Schema::dropIfExists('location');
    }
};
