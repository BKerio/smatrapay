<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LandlordTenant extends Model
{
    protected $table = 'landlord_tenants';

    protected $fillable = [
        'landlord_id',
        'property_id',
        'name',
        'phone',
        'email',
        'node_type',
        'node_id',
        'status',
    ];
}
