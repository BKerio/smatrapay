<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContactEnquiry;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ContactEnquiryController extends Controller
{
    /**
     * Display a listing of enquiries (Admin only protected by middleware).
     */
    public function index()
    {
        $enquiries = ContactEnquiry::orderBy('created_at', 'desc')->get();
        return response()->json($enquiries);
    }

    /**
     * Store a newly created enquiry in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'firstName' => 'required|string|max:255',
            'lastName' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'required|string|max:20',
            'city' => 'required|string|max:255',
            'premisesType' => 'required|string',
            'residenceType' => 'required|string',
            'meterType' => 'required|array',
            'mainMeterType' => 'required|string',
            'message' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $enquiry = ContactEnquiry::create([
            'first_name' => $request->firstName,
            'last_name' => $request->lastName,
            'email' => $request->email,
            'phone' => $request->phone,
            'city' => $request->city,
            'premises_type' => $request->premisesType,
            'residence_type' => $request->residenceType,
            'meter_type' => $request->meterType,
            'main_meter_type' => $request->mainMeterType,
            'message' => $request->message,
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Enquiry submitted successfully',
            'enquiry' => $enquiry
        ], 201);
    }

    /**
     * Display the specified enquiry.
     */
    public function show(ContactEnquiry $enquiry)
    {
        return response()->json($enquiry);
    }

    /**
     * Update the status of an enquiry.
     */
    public function update(Request $request, ContactEnquiry $enquiry)
    {
        $request->validate([
            'status' => 'required|in:pending,reviewed,archived'
        ]);

        $enquiry->update(['status' => $request->status]);

        return response()->json([
            'message' => 'Enquiry status updated',
            'enquiry' => $enquiry
        ]);
    }

    /**
     * Remove the specified enquiry.
     */
    public function destroy(ContactEnquiry $enquiry)
    {
        $enquiry->delete();
        return response()->json(['message' => 'Enquiry deleted']);
    }
}
