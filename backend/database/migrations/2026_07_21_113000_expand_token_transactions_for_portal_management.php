<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('token_transactions', function (Blueprint $table) {
            $table->string('landlord_id')->nullable()->index();
            $table->string('owner_type')->nullable()->index();
            $table->string('owner_id')->nullable()->index();
            $table->string('actor_user_id')->nullable()->index();
            $table->decimal('units', 12, 3)->nullable();
            $table->string('token_type')->nullable()->index();
            $table->string('vend_mode')->nullable();
            $table->integer('control_index')->nullable();
            $table->integer('control_value')->nullable();
            $table->string('transaction_id')->nullable()->index();
            $table->timestamp('transaction_time')->nullable();
            $table->boolean('send_sms')->default(false);
            $table->boolean('sms_sent')->default(false);
            $table->string('phone')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('token_transactions', function (Blueprint $table) {
            $table->dropColumn([
                'landlord_id',
                'owner_type',
                'owner_id',
                'actor_user_id',
                'units',
                'token_type',
                'vend_mode',
                'control_index',
                'control_value',
                'transaction_id',
                'transaction_time',
                'send_sms',
                'sms_sent',
                'phone',
            ]);
        });
    }
};
