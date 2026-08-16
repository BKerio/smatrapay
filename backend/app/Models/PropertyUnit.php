<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PropertyUnit extends Model
{
    protected $table = 'property_units';

    protected $fillable = [
        'landlord_id',
        'property_id',
        'parent_type',
        'parent_id',
        'name',
        'unit_number',
        'meter_id',
        'status',
    ];

    public function meter()
    {
        return $this->belongsTo(Meter::class, 'meter_id', 'id');
    }
}
