<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Vendor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CustomerController extends Controller
{
    /**
     * Display a listing of customers.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $query = Customer::with(['vendor', 'meter']);

        // Vendors only see their own customers
        if ($user->role === 'vendor') {
            $vendor = Vendor::where('user_id', $user->id)->first();
            if (!$vendor) {
                return response()->json(['data' => []]);
            }
            $query->where('vendor_id', $vendor->id);
        }

        // Admin can filter by vendor
        if ($request->has('vendor_id') && ($user->role === 'admin' || $user->role === 'system_admin')) {
            $query->where('vendor_id', $request->vendor_id);
        }

        // Search by name, phone or email
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                  ->orWhere('phone', 'like', '%' . $search . '%')
                  ->orWhere('email', 'like', '%' . $search . '%');
            });
        }

        return response()->json($query->paginate($request->get('per_page', 10)));
    }

    /**
     * Store a newly created customer.
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string',
            'email' => 'nullable|email',
            'address' => 'nullable|string',
            'meter_id' => 'required|exists:meters,_id',
            'county_id' => 'required|numeric',
            'constituency_id' => 'required|numeric',
            'ward_id' => 'required|numeric',
            'status' => 'string|in:active,inactive',
        ]);

        if ($user->role === 'vendor') {
            $vendor = Vendor::where('user_id', $user->id)->first();
            if (!$vendor) {
                return response()->json(['message' => 'Vendor profile not found'], 404);
            }
            $validated['vendor_id'] = $vendor->id;
        } else {
            // Admin must provide vendor_id
            $request->validate(['vendor_id' => 'required|exists:vendors,_id']);
            $validated['vendor_id'] = $request->vendor_id;
        }

        $customer = Customer::create($validated);

        return response()->json([
            'message' => 'Customer created successfully',
            'customer' => $customer->load(['vendor', 'meter'])
        ], 201);
    }

    /**
     * Display the specified customer.
     */
    public function show(string $id)
    {
        $user = Auth::user();
        $customer = Customer::with(['vendor', 'meter'])->findOrFail($id);

        if ($user->role === 'vendor') {
            $vendor = Vendor::where('user_id', $user->id)->first();
            if (!$vendor || $customer->vendor_id !== $vendor->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        return response()->json($customer);
    }

    /**
     * Update the specified customer.
     */
    public function update(Request $request, string $id)
    {
        $user = Auth::user();
        $customer = Customer::findOrFail($id);

        if ($user->role === 'vendor') {
            $vendor = Vendor::where('user_id', $user->id)->first();
            if (!$vendor || $customer->vendor_id !== $vendor->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'phone' => 'sometimes|string',
            'email' => 'sometimes|nullable|email',
            'address' => 'sometimes|nullable|string',
            'meter_id' => 'sometimes|exists:meters,_id',
            'county_id' => 'sometimes|numeric',
            'constituency_id' => 'sometimes|numeric',
            'ward_id' => 'sometimes|numeric',
            'status' => 'sometimes|string|in:active,inactive',
        ]);

        $customer->update($validated);

        return response()->json([
            'message' => 'Customer updated successfully',
            'customer' => $customer->load(['vendor', 'meter'])
        ]);
    }

    /**
     * Remove the specified customer.
     */
    public function destroy(string $id)
    {
        $user = Auth::user();
        $customer = Customer::findOrFail($id);

        if ($user->role === 'vendor') {
            $vendor = Vendor::where('user_id', $user->id)->first();
            if (!$vendor || $customer->vendor_id !== $vendor->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        $customer->delete();

        return response()->json(['message' => 'Customer deleted successfully']);
    }
}
