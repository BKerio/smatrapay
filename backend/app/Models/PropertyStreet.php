<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PropertyStreet extends Model
{
    protected $table = 'property_streets';

    protected $fillable = ['landlord_id', 'property_id', 'route_id', 'name', 'status'];

    public function route()
    {
        return $this->belongsTo(PropertyRoute::class, 'route_id', 'id');
    }
}
