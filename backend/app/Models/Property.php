<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Property extends Model
{
    protected $table = 'properties';

    protected $fillable = [
        'landlord_id',
        'owner',           // full_name of landlord (denormalized for display)
        'name',            // Property name
        'property_type',   // Apartment | Zone
        'no_of_units',     // integer
        'location',        // text address
        'latitude',        // for map pin
        'longitude',       // for map pin
        'map_url',         // optional Google Maps share URL
        'status',          // active | inactive
    ];

    protected $casts = [
        'no_of_units' => 'integer',
        'latitude'    => 'float',
        'longitude'   => 'float',
    ];

    /**
     * The landlord that owns this property.
     */
    public function landlord()
    {
        return $this->belongsTo(Landlord::class);
    }
}
