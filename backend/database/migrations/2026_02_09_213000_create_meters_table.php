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
        Schema::create('meters', function (Blueprint $table) {
            $table->id();
            $table->string('vendor_id')->index();
            $table->string('landlord_id')->nullable()->index();
            $table->string('meter_number')->unique();
            $table->string('type'); // water, electricity, etc.
            $table->decimal('initial_reading', 15, 2)->default(0);
            $table->decimal('price_per_unit', 15, 2)->default(0);
            $table->string('status')->default('active'); // active, inactive, maintenance
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('meters');
    }
};
