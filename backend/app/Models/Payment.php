<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $table = 'payments';

    protected $fillable = [
        'merchant_request_id',
        'checkout_request_id',
        'account_reference',
        'phone',
        'amount',
        'mpesa_receipt_number',
        'result_code',
        'result_desc',
        'status',
    ];
}
