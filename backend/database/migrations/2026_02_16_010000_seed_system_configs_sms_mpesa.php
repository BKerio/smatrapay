<?php

use Illuminate\Database\Migrations\Migration;
use App\Models\SystemConfig;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // --- SMS CONFIGS ---
        SystemConfig::setValue(
            'sms_provider',
            'fornax',
            'string',
            'sms',
            'SMS Provider name (advanta, fornax, twilio, etc.)'
        );

        SystemConfig::setValue(
            'sms_api_url',
            'https://bulksms.fornax-technologies.com/api/services/sendsms/',
            'string',
            'sms',
            'SMS API endpoint URL'
        );

        SystemConfig::setValue(
            'sms_api_key',
            'CHANGE_ME_SMS_API_KEY',
            'string',
            'sms',
            'SMS API Key',
            true // encrypted
        );

        SystemConfig::setValue(
            'sms_partner_id',
            '4889',
            'string',
            'sms',
            'SMS Partner ID'
        );

        SystemConfig::setValue(
            'sms_shortcode',
            'P.C.E.A_SGM',
            'string',
            'sms',
            'SMS Shortcode/Sender ID'
        );

        SystemConfig::setValue(
            'sms_enabled',
            'true',
            'boolean',
            'sms',
            'Enable or disable SMS service'
        );

        // --- MPESA CONFIGS ---
        SystemConfig::setValue(
            'mpesa_consumer_key',
            'CHANGE_ME_CONSUMER_KEY',
            'string',
            'mpesa',
            'M-Pesa Consumer Key',
            true
        );

        SystemConfig::setValue(
            'mpesa_consumer_secret',
            'CHANGE_ME_CONSUMER_SECRET',
            'string',
            'mpesa',
            'M-Pesa Consumer Secret',
            true
        );

        SystemConfig::setValue(
            'mpesa_passkey',
            'CHANGE_ME_PASSKEY',
            'string',
            'mpesa',
            'M-Pesa Passkey (for STK Push)',
            true
        );

        SystemConfig::setValue(
            'mpesa_shortcode',
            '174379',
            'string',
            'mpesa',
            'M-Pesa Business Shortcode (Paybill/Store)'
        );

        SystemConfig::setValue(
            'mpesa_till_no',
            '174379',
            'string',
            'mpesa',
            'M-Pesa Till Number (if applicable)'
        );

        SystemConfig::setValue(
            'mpesa_env',
            'sandbox',
            'string',
            'mpesa',
            'M-Pesa Environment (sandbox or live)'
        );

        SystemConfig::setValue(
            'mpesa_callback_url',
            'https://example.com/api/mpesa/callback',
            'string',
            'mpesa',
            'M-Pesa Callback URL'
        );

        SystemConfig::setValue(
            'mpesa_transaction_type',
            'CustomerBuyGoodsOnline',
            'string',
            'mpesa',
            'M-Pesa Transaction Type (CustomerPayBillOnline or CustomerBuyGoodsOnline)'
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $keys = [
            // SMS
            'sms_provider',
            'sms_api_url',
            'sms_api_key',
            'sms_partner_id',
            'sms_shortcode',
            'sms_enabled',
            // Mpesa
            'mpesa_consumer_key',
            'mpesa_consumer_secret',
            'mpesa_passkey',
            'mpesa_shortcode',
            'mpesa_till_no',
            'mpesa_env',
            'mpesa_callback_url',
            'mpesa_transaction_type',
        ];

        SystemConfig::whereIn('key', $keys)->delete();
    }
};

