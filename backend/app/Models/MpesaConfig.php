<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MpesaConfig extends Model
{
    protected $table = 'mpesa_configs';

    protected $fillable = [
        'vendor_id',
        'landlord_id',
        'consumer_key',
        'consumer_secret',
        'passkey',
        'shortcode',
        'till_no',
        'env',
        'callback_url',
        'transaction_type',
    ];

    /**
     * Get the vendor that owns the config.
     */
    public function vendor()
    {
        return $this->belongsTo(Vendor::class);
    }

    public function landlord()
    {
        return $this->belongsTo(Landlord::class);
    }
}
