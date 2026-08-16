<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PropertyZone extends Model
{
    protected $table = 'property_zones';

    protected $fillable = ['landlord_id', 'property_id', 'name', 'status'];

    public function property()
    {
        return $this->belongsTo(Property::class);
    }

    public function routes()
    {
        return $this->hasMany(PropertyRoute::class, 'zone_id', 'id');
    }
}
