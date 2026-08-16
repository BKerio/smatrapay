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
        Schema::table('meters', function (Blueprint $table) {
            $table->integer('sgc')->nullable()->comment('Supply Group Code');
            $table->integer('krn')->nullable()->comment('Key Revision Number');
            $table->integer('ti')->nullable()->comment('Tariff Index');
            $table->integer('ea')->nullable()->comment('Encryption Algorithm');
            $table->integer('ken')->nullable()->comment('Key Expiry Number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('meters', function (Blueprint $table) {
            $table->dropColumn(['sgc', 'krn', 'ti', 'ea', 'ken']);
        });
    }
};
