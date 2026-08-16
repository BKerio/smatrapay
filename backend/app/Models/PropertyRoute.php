<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PropertyRoute extends Model
{
    protected $table = 'property_routes';

    protected $fillable = ['landlord_id', 'property_id', 'zone_id', 'name', 'status'];

    public function zone()
    {
        return $this->belongsTo(PropertyZone::class, 'zone_id', 'id');
    }

    public function streets()
    {
        return $this->hasMany(PropertyStreet::class, 'route_id', 'id');
    }
}
