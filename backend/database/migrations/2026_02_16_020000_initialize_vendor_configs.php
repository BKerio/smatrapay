<?php

namespace App\Database\Migrations;

use Illuminate\Database\Migrations\Migration;
use App\Models\Vendor;

/**
 * Initialize vendor SMS and Mpesa configurations for existing vendors.
 * Since we're using MongoDB, this migration doesn't create schema but ensures
 * all existing vendors have empty config arrays initialized.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     * Initialize empty config arrays for all existing vendors.
     */
    public function up(): void
    {
        // Get all vendors
        $vendors = Vendor::all();

        foreach ($vendors as $vendor) {
            $updateData = [];
            
            // Initialize sms_config if not set or null
            if (!isset($vendor->sms_config) || $vendor->sms_config === null || !is_array($vendor->sms_config)) {
                $updateData['sms_config'] = [];
            }
            
            // Initialize mpesa_config if not set or null
            if (!isset($vendor->mpesa_config) || $vendor->mpesa_config === null || !is_array($vendor->mpesa_config)) {
                $updateData['mpesa_config'] = [];
            }
            
            if (!empty($updateData)) {
                $vendor->update($updateData);
            }
        }
    }

    /**
     * Reverse the migrations.
     * This is a no-op for MongoDB since we're just initializing empty arrays.
     */
    public function down(): void
    {
        // No need to reverse - we're just initializing empty configs
        // Vendors can keep their configs even if migration is rolled back
    }
};
