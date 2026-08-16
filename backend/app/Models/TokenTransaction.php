<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class TokenTransaction extends Model
{
    use HasFactory;

    protected $table = 'token_transactions';

    protected $fillable = [
        'meter_id',
        'vendor_id',
        'landlord_id',
        'owner_type',
        'owner_id',
        'actor_user_id',
        'customer_id', // Optional, if linked to a specific customer's purchase
        'payment_id',  // Links directly to the Payment record (checkout_request_id owner)
        'amount',
        'units',
        'tokens', // Array of generated token strings
        'token_type',
        'vend_mode',
        'control_index',
        'control_value',
        'transaction_id',
        'transaction_time',
        'send_sms',
        'sms_sent',
        'phone',
        'prism_message_id', // Useful for debugging or matching requests with Prism
        'status', // e.g., 'success', 'failed'
        'description', // E.g., '100 kWh Credit' or Error details
    ];

    protected $casts = [
        'amount' => 'float',
        'units' => 'float',
        'tokens' => 'array',
        'send_sms' => 'boolean',
        'sms_sent' => 'boolean',
        'transaction_time' => 'datetime',
    ];

    public function meter()
    {
        return $this->belongsTo(Meter::class);
    }

    public function vendor()
    {
        return $this->belongsTo(Vendor::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }
}
