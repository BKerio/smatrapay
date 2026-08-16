<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Extends mpesa_configs so landlords can have Daraja payment API
 * credentials (same shape as vendor configs), keyed by landlord_id.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('mpesa_configs')) {
            Schema::create('mpesa_configs', function (Blueprint $table) {
                $table->id();
                $table->string('vendor_id')->nullable()->index();
                $table->string('landlord_id')->nullable()->index();
                $table->string('consumer_key')->nullable();
                $table->string('consumer_secret')->nullable();
                $table->string('passkey')->nullable();
                $table->string('shortcode')->nullable();
                $table->string('till_no')->nullable();
                $table->string('env')->nullable(); // sandbox | live
                $table->string('callback_url')->nullable();
                $table->string('transaction_type')->nullable(); // CustomerPayBillOnline | CustomerBuyGoodsOnline
                $table->timestamps();
            });

            return;
        }

        Schema::table('mpesa_configs', function (Blueprint $table) {
            $table->string('landlord_id')->nullable()->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('mpesa_configs')) {
            return;
        }

        // Only drop landlord_id — do not destroy vendor configs.
        Schema::table('mpesa_configs', function (Blueprint $table) {
            $table->dropColumn('landlord_id');
        });
    }
};
