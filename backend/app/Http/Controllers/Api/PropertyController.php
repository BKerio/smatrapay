<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Property;
use App\Models\Landlord;
use Illuminate\Http\Request;

class PropertyController extends Controller
{
    /**
     * Return all properties belonging to the authenticated landlord.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        if (!$user || $user->role !== 'landlord') {
            return response()->json(['status' => 403, 'message' => 'Landlord access only.'], 403);
        }

        $landlord = Landlord::where('user_id', $user->id)->first();

        if (!$landlord) {
            return response()->json(['status' => 404, 'message' => 'Landlord profile not found.'], 404);
        }

        $query = Property::where('landlord_id', $landlord->id);

        if ($request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('location', 'like', "%{$search}%")
                  ->orWhere('property_type', 'like', "%{$search}%");
            });
        }

        $properties = $query->orderBy('created_at', 'desc')->get();

        return response()->json(['status' => 200, 'properties' => $properties]);
    }

    /**
     * Store a new property for the authenticated landlord.
     */
    public function store(Request $request)
    {
        $user = $request->user();

        if (!$user || $user->role !== 'landlord') {
            return response()->json(['status' => 403, 'message' => 'Landlord access only.'], 403);
        }

        $landlord = Landlord::where('user_id', $user->id)->first();

        if (!$landlord) {
            return response()->json(['status' => 404, 'message' => 'Landlord profile not found.'], 404);
        }

        $validated = $request->validate([
            'name'          => 'required|string|max:255',
            'property_type' => 'required|string|in:Apartment,Zone',
            'no_of_units'   => 'required|integer|min:1',
            'location'      => 'required|string|max:500',
            'latitude'      => 'nullable|numeric|between:-90,90',
            'longitude'     => 'nullable|numeric|between:-180,180',
            'map_url'       => 'nullable|string|max:1000',
        ]);

        try {
            $property = Property::create([
                'landlord_id'   => $landlord->id,
                'owner'         => $landlord->full_name,
                'name'          => $validated['name'],
                'property_type' => $validated['property_type'],
                'no_of_units'   => $validated['no_of_units'],
                'location'      => $validated['location'],
                'latitude'      => $validated['latitude'] ?? null,
                'longitude'     => $validated['longitude'] ?? null,
                'map_url'       => $validated['map_url'] ?? null,
                'status'        => 'active',
            ]);

            return response()->json([
                'status'   => 201,
                'message'  => 'Property added successfully',
                'property' => $property,
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'status'  => 500,
                'message' => 'Failed to add property',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update an existing property (only the owning landlord can update).
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();

        if (!$user || $user->role !== 'landlord') {
            return response()->json(['status' => 403, 'message' => 'Landlord access only.'], 403);
        }

        $landlord = Landlord::where('user_id', $user->id)->first();
        $property = Property::findOrFail($id);

        if ((string) $property->landlord_id !== (string) $landlord?->id) {
            return response()->json(['status' => 403, 'message' => 'You do not own this property.'], 403);
        }

        $validated = $request->validate([
            'name'          => 'sometimes|nullable|string|max:255',
            'property_type' => 'sometimes|nullable|string|in:Apartment,Zone',
            'no_of_units'   => 'sometimes|nullable|integer|min:1',
            'location'      => 'sometimes|nullable|string|max:500',
            'latitude'      => 'nullable|numeric|between:-90,90',
            'longitude'     => 'nullable|numeric|between:-180,180',
            'map_url'       => 'nullable|string|max:1000',
            'status'        => 'sometimes|nullable|string|in:active,inactive',
        ]);

        try {
            $property->update(array_filter($validated, fn($v) => $v !== null));

            return response()->json([
                'status'   => 200,
                'message'  => 'Property updated successfully',
                'property' => $property->fresh(),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status'  => 500,
                'message' => 'Failed to update property',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete a property (only the owning landlord can delete).
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();

        if (!$user || $user->role !== 'landlord') {
            return response()->json(['status' => 403, 'message' => 'Landlord access only.'], 403);
        }

        $landlord = Landlord::where('user_id', $user->id)->first();
        $property = Property::findOrFail($id);

        if ((string) $property->landlord_id !== (string) $landlord?->id) {
            return response()->json(['status' => 403, 'message' => 'You do not own this property.'], 403);
        }

        try {
            $property->delete();
            return response()->json(['status' => 200, 'message' => 'Property deleted successfully']);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 500,
                'message' => 'Failed to delete property',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Show a single property (admin or owner).
     */
    public function show($id)
    {
        $property = Property::findOrFail($id);
        return response()->json(['status' => 200, 'property' => $property]);
    }
}
