<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LocationController extends Controller
{
    /**
     * Get all counties.
     */
    public function getCounties()
    {
        $counties = DB::table('location')
            ->where('status', 1)
            ->get(['id', 'description']);
        return response()->json($counties);
    }

    /**
     * Get constituencies for a specific county.
     */
    public function getConstituencies(Request $request)
    {
        $request->validate(['county_id' => 'required']);
        
        $countyId = (int) $request->county_id;
        
        $constituencies = DB::table('constituencies')
            ->where('location_id', $countyId)
            ->where('status', 1)
            ->get(['id', 'description']);
            
        return response()->json($constituencies);
    }

    /**
     * Get wards for a specific constituency.
     */
    public function getWards(Request $request)
    {
        $request->validate(['constituency_id' => 'required']);
        
        $constituencyId = (int) $request->constituency_id;
        
        $wards = DB::table('location_area')
            ->where('constituency_id', $constituencyId)
            ->where('status', 1)
            ->get(['id', 'description']);
            
        return response()->json($wards);
    }
}
