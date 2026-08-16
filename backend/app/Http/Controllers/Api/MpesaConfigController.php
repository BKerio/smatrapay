<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MpesaConfig;
use App\Models\Vendor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;

class MpesaConfigController extends Controller
{
    /**
     * Get the vendor's MPESA configuration.
     */
    public function show(Request $request)
    {
        $user = $request->user();
        $vendor = Vendor::where('user_id', $user->id)->firstOrFail();
        $config = $vendor->mpesaConfig;

        if (!$config) {
            return response()->json([
                'status' => 200,
                'mpesa_config' => [],
            ]);
        }

        $configArray = $config->toArray();
        foreach (['consumer_key', 'consumer_secret', 'passkey'] as $k) {
            if (isset($configArray[$k])) {
                $configArray[$k] = 'is_set';
            }
        }

        return response()->json([
            'status' => 200,
            'mpesa_config' => $configArray,
        ]);
    }

    /**
     * Update the vendor's MPESA configuration — disabled; admin manages credentials.
     */
    public function update(Request $request)
    {
        return response()->json([
            'status' => 403,
            'message' => 'M-Pesa API credentials are managed by TokenPap administrators.',
        ], 403);
    }
}
