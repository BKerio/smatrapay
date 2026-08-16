<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Landlord extends Model
{
    protected $table = 'landlords';

    protected $fillable = [
        'user_id',
        'full_name',
        'phone',
        'payment_account', // M-Pesa number, bank account, or paybill
        'status',          // active, suspended
    ];

    /**
     * Get the user account associated with this landlord.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function meters()
    {
        return $this->hasMany(Meter::class);
    }

    public function mpesaConfig()
    {
        return $this->hasOne(MpesaConfig::class, 'landlord_id', 'id');
    }
}
