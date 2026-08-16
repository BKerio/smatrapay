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
        // Update users table
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'username')) {
                $table->string('username')->unique();
            }
            if (!Schema::hasColumn('users', 'phone')) {
                $table->string('phone')->nullable();
            }
            if (!Schema::hasColumn('users', 'role')) {
                $table->string('role')->default('customer');
            }
            if (!Schema::hasColumn('users', 'status')) {
                $table->string('status')->default('active');
            }
        });

        // Update vendors table
        Schema::table('vendors', function (Blueprint $table) {
            if (!Schema::hasColumn('vendors', 'vendor_type')) {
                $table->string('vendor_type')->default('Individual');
            }
            if (!Schema::hasColumn('vendors', 'bank_name')) {
                $table->string('bank_name')->nullable();
            }
            if (!Schema::hasColumn('vendors', 'sms_config')) {
                $table->json('sms_config')->nullable();
            }
            if (!Schema::hasColumn('vendors', 'mpesa_config')) {
                $table->json('mpesa_config')->nullable();
            }
            if (!Schema::hasColumn('vendors', 'dashboard_settings')) {
                $table->json('dashboard_settings')->nullable();
            }
            if (!Schema::hasColumn('vendors', 'logo_url')) {
                $table->string('logo_url')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['username', 'phone', 'role', 'status']);
        });

        Schema::table('vendors', function (Blueprint $table) {
            $table->dropColumn(['vendor_type', 'bank_name', 'sms_config', 'mpesa_config', 'dashboard_settings', 'logo_url']);
        });
    }
};
