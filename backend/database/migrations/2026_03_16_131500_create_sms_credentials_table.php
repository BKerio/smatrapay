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
        Schema::create('sms_credentials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vendor_id')->nullable()->constrained()->nullOnDelete(); // null for system-wide
            $table->string('provider'); // e.g., 'TiaraConnect', 'AfricasTalking'
            $table->string('api_key')->nullable();
            $table->string('api_secret')->nullable(); // Optional, for some providers
            $table->string('partner_id')->nullable(); // For Tiara/etc
            $table->string('shortcode')->nullable(); // Sender ID / Shortcode
            $table->string('endpoint_url')->nullable(); // Custom API endpoint if needed
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sms_credentials');
    }
};
