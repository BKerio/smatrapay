<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SmsConfig extends Model
{
    protected $table = 'sms_configs';

    protected $fillable = [
        'vendor_id',
        'provider',
        'api_url',
        'api_key',
        'partner_id',
        'shortcode',
        'enabled',
    ];

    protected $casts = [
        'enabled' => 'boolean',
    ];

    /**
     * Get the vendor that owns the config.
     */
    public function vendor()
    {
        return $this->belongsTo(Vendor::class);
    }
}
