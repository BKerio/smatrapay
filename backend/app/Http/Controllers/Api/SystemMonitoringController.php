<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Meter;
use App\Models\Vendor;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SystemMonitoringController extends Controller
{
    /**
     * Get overall system stats for vending control.
     */
    public function getSystemStats(Request $request)
    {
        if (Auth::user()->role !== 'admin' && Auth::user()->role !== 'system_admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $totalVendors = Vendor::count();
        $totalMeters = Meter::count();
        $activeMeters = Meter::where('status', 'active')->count();
        $totalCustomers = Customer::count();

        // Placeholder for token sales / revenue stats
        $totalTokensIssued = 0; // Will be implemented with a Token model
        $totalRevenue = 0;

        return response()->json([
            'vendors' => $totalVendors,
            'meters' => [
                'total' => $totalMeters,
                'active' => $activeMeters,
                'inactive' => $totalMeters - $activeMeters
            ],
            'customers' => $totalCustomers,
            'vending' => [
                'tokens_issued' => $totalTokensIssued,
                'revenue' => $totalRevenue,
                'health' => 'Operational'
            ]
        ]);
    }

    /**
     * Get stats for a specific vendor (Oversight).
     */
    public function getVendorOversight(string $vendorId)
    {
        if (Auth::user()->role !== 'admin' && Auth::user()->role !== 'system_admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $vendor = Vendor::findOrFail($vendorId);
        $meters = Meter::where('vendor_id', $vendorId)->get();
        $customers = Customer::where('vendor_id', $vendorId)->get();

        return response()->json([
            'vendor' => $vendor,
            'meters_count' => $meters->count(),
            'customers_count' => $customers->count(),
            'meters' => $meters,
            'customers' => $customers,
        ]);
    }
}
