<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\VendingSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class VendingController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $settings = VendingSetting::all();
        return response()->json([
            'status' => 200,
            'settings' => $settings
        ]);
    }

    /**
     * Bulk update vending settings.
     */
    public function bulkUpdate(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'settings' => 'required|array',
            'settings.*.key' => 'required|string|exists:vending_settings,key',
            'settings.*.value' => 'nullable',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 422,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        foreach ($request->settings as $setting) {
            VendingSetting::where('key', $setting['key'])->update([
                'value' => $setting['value']
            ]);
        }

        return response()->json([
            'status' => 200,
            'message' => 'Vending settings updated successfully'
        ]);
    }

    /**
     * Get settings by category (placeholder if category is added later)
     */
    public function getByCategory($category)
    {
        // Currently we only have one category 'vending'
        $settings = VendingSetting::all();
        return response()->json([
            'status' => 200,
            'configs' => $settings // Keep 'configs' key for frontend compatibility if needed or use 'settings'
        ]);
    }
}
