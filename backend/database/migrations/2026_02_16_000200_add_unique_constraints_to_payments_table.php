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
        Schema::table('payments', function (Blueprint $table) {
            $table->unique('checkout_request_id', 'payments_checkout_request_id_unique');
            $table->unique('mpesa_receipt_number', 'payments_mpesa_receipt_number_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropUnique('payments_checkout_request_id_unique');
            $table->dropUnique('payments_mpesa_receipt_number_unique');
        });
    }
};

