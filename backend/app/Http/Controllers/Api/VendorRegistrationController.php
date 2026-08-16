<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class VendorRegistrationController extends Controller
{
    /**
     * Register a new vendor (Public)
     */
    public function register(Request $request)
    {
        $request->validate([
            'vendor_type' => ['required', Rule::in(['Individual', 'Company'])],
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'username' => 'required|string|max:255|unique:users,username',
            'phone' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
            'business_name' => 'required_if:vendor_type,Company|string|max:255',
            'address' => 'required|string',
            'bank_name' => 'required|string',
            'account_id' => 'required|string',
            'paybill' => 'nullable|string',
        ]);

        try {
            // 1. Create User
            $user = User::create([
                'name' => $request->name,
                'username' => $request->username,
                'email' => $request->email,
                'phone' => $request->phone,
                'password' => Hash::make($request->password),
                'role' => 'vendor',
                'status' => 'pending', // User status
            ]);

            // 2. Create Vendor Profile
            $vendor = Vendor::create([
                'user_id' => $user->id,
                'business_name' => $request->vendor_type === 'Company' ? $request->business_name : $request->name,
                'address' => $request->address,
                'account_id' => $request->account_id,
                'paybill' => $request->paybill,
                'vendor_type' => $request->vendor_type,
                'bank_name' => $request->bank_name,
                'status' => 'pending', // Vendor status
            ]);

            return response()->json([
                'message' => 'Registration successful. Your account is pending admin approval.',
                'status' => 200
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Registration failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * List pending registrations (Admin)
     */
    public function pending()
    {
        $pendingVendors = Vendor::with('user')
            ->where('status', 'pending')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'data' => $pendingVendors
        ]);
    }

    /**
     * Approve a vendor (Admin)
     */
    public function approve($id)
    {
        $vendor = Vendor::findOrFail($id);
        $vendor->update(['status' => 'active']);

        if ($vendor->user) {
            $vendor->user->update(['status' => 'active']);
            // Here you could send an email/SMS notification
        }

        return response()->json([
            'message' => 'Vendor approved successfully.'
        ]);
    }

    /**
     * Reject a vendor (Admin)
     */
    public function reject($id)
    {
        $vendor = Vendor::findOrFail($id);
        
        // You can either delete or mark as rejected
        // For now, let's mark as rejected or suspended
        $vendor->update(['status' => 'rejected']);
        if ($vendor->user) {
            $vendor->user->update(['status' => 'suspended']);
        }

        return response()->json([
            'message' => 'Vendor registration rejected.'
        ]);
    }
}
