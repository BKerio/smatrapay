<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Meter extends Model
{
    use HasFactory;

    protected $table = 'meters';

    protected $fillable = [
        'vendor_id',
        'landlord_id',
        'meter_number',
        'type',
        'initial_reading',
        'price_per_unit',
        'status',
        'sgc',
        'krn',
        'ti',
        'ea',
        'ken',
    ];

    public function vendor()
    {
        return $this->belongsTo(Vendor::class);
    }

    public function landlord()
    {
        return $this->belongsTo(Landlord::class);
    }

    public function customers()
    {
        return $this->hasMany(Customer::class);
    }
}
