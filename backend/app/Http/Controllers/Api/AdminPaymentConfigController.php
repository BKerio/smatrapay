<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Landlord;
use App\Models\MpesaConfig;
use App\Models\Vendor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;

class AdminPaymentConfigController extends Controller
{
    private function ensureAdmin(Request $request): void
    {
        $user = $request->user();
        if (!$user || !in_array($user->role, ['admin', 'system_admin'], true)) {
            abort(403, 'Administrator access required.');
        }
    }

    /**
     * List vendors and landlords for admin payment configuration.
     */
    public function entities(Request $request)
    {
        $this->ensureAdmin($request);

        $vendors = Vendor::with(['user', 'mpesaConfig'])
            ->orderBy('business_name')
            ->get()
            ->map(function (Vendor $vendor) {
                return [
                    'id' => (string) $vendor->id,
                    'type' => 'vendor',
                    'name' => $vendor->business_name,
                    'subtitle' => $vendor->user?->email,
                    'vendor_type' => $vendor->vendor_type,
                    'status' => $vendor->status,
                    'has_mpesa_config' => (bool) $vendor->mpesaConfig,
                    'mpesa_env' => $vendor->mpesaConfig?->env,
                    'mpesa_shortcode' => $vendor->mpesaConfig?->shortcode,
                ];
            });

        $landlords = Landlord::with(['user', 'mpesaConfig'])
            ->orderBy('full_name')
            ->get()
            ->map(function (Landlord $landlord) {
                return [
                    'id' => (string) $landlord->id,
                    'type' => 'landlord',
                    'name' => $landlord->full_name,
                    'subtitle' => $landlord->user?->email,
                    'status' => $landlord->status,
                    'payment_account' => $landlord->payment_account,
                    'phone' => $landlord->phone,
                    'has_mpesa_config' => (bool) $landlord->mpesaConfig,
                    'mpesa_env' => $landlord->mpesaConfig?->env,
                    'mpesa_shortcode' => $landlord->mpesaConfig?->shortcode,
                ];
            });

        return response()->json([
            'status' => 200,
            'vendors' => $vendors,
            'landlords' => $landlords,
        ]);
    }

    /**
     * Get a vendor's M-Pesa API configuration (masked secrets).
     */
    public function showVendor(Request $request, string $vendor)
    {
        $this->ensureAdmin($request);

        $vendorModel = Vendor::with(['user', 'mpesaConfig'])->findOrFail($vendor);
        $configArray = $this->maskMpesaSecrets($vendorModel->mpesaConfig?->toArray() ?? []);

        return response()->json([
            'status' => 200,
            'vendor' => [
                'id' => (string) $vendorModel->id,
                'business_name' => $vendorModel->business_name,
                'email' => $vendorModel->user?->email,
                'vendor_type' => $vendorModel->vendor_type,
                'status' => $vendorModel->status,
            ],
            'mpesa_config' => $configArray,
        ]);
    }

    /**
     * Update a vendor's M-Pesa API configuration (admin only).
     */
    public function updateVendor(Request $request, string $vendor)
    {
        $this->ensureAdmin($request);

        $vendorModel = Vendor::findOrFail($vendor);
        $configData = $this->prepareMpesaConfigData($request);

        $this->saveMpesaConfig($vendorModel->mpesaConfig, $configData, 'vendor_id', (string) $vendorModel->id);
        $vendorModel->update(['mpesa_config' => null]);

        return response()->json([
            'status' => 200,
            'message' => 'Vendor M-Pesa configuration updated successfully',
        ]);
    }

    /**
     * Get landlord M-Pesa API configuration (masked secrets).
     */
    public function showLandlord(Request $request, string $landlord)
    {
        $this->ensureAdmin($request);

        $landlordModel = Landlord::with(['user', 'mpesaConfig'])->findOrFail($landlord);
        $configArray = $this->maskMpesaSecrets($landlordModel->mpesaConfig?->toArray() ?? []);

        return response()->json([
            'status' => 200,
            'landlord' => [
                'id' => (string) $landlordModel->id,
                'full_name' => $landlordModel->full_name,
                'email' => $landlordModel->user?->email,
                'phone' => $landlordModel->phone,
                'payment_account' => $landlordModel->payment_account,
                'status' => $landlordModel->status,
            ],
            'mpesa_config' => $configArray,
        ]);
    }

    /**
     * Update landlord M-Pesa API configuration (admin only).
     */
    public function updateLandlord(Request $request, string $landlord)
    {
        $this->ensureAdmin($request);

        $landlordModel = Landlord::findOrFail($landlord);
        $configData = $this->prepareMpesaConfigData($request);

        $this->saveMpesaConfig($landlordModel->mpesaConfig, $configData, 'landlord_id', (string) $landlordModel->id);

        return response()->json([
            'status' => 200,
            'message' => 'Landlord M-Pesa configuration updated successfully',
        ]);
    }

    private function maskMpesaSecrets(array $configArray): array
    {
        foreach (['consumer_key', 'consumer_secret', 'passkey'] as $key) {
            if (!empty($configArray[$key])) {
                $configArray[$key] = 'is_set';
            }
        }

        return $configArray;
    }

    private function prepareMpesaConfigData(Request $request): array
    {
        $request->validate([
            'consumer_key' => 'sometimes|nullable|string|max:500',
            'consumer_secret' => 'sometimes|nullable|string|max:500',
            'passkey' => 'sometimes|nullable|string|max:500',
            'shortcode' => 'sometimes|nullable|string|max:255',
            'till_no' => 'sometimes|nullable|string|max:255',
            'env' => 'sometimes|nullable|string|in:sandbox,live',
            'transaction_type' => 'sometimes|nullable|string|in:CustomerPayBillOnline,CustomerBuyGoodsOnline',
        ]);

        $configData = array_filter($request->only([
            'consumer_key', 'consumer_secret', 'passkey', 'shortcode',
            'till_no', 'env', 'transaction_type',
        ]), fn ($value) => $value !== null && $value !== '' && $value !== 'is_set');

        foreach (['consumer_key', 'consumer_secret', 'passkey'] as $key) {
            if (isset($configData[$key]) && $configData[$key] !== 'is_set') {
                $configData[$key] = Crypt::encryptString($configData[$key]);
            }
        }

        return $configData;
    }

    private function saveMpesaConfig(?MpesaConfig $config, array $configData, string $ownerField, string $ownerId): void
    {
        if ($config) {
            if (!empty($configData)) {
                $config->update($configData);
            }
            return;
        }

        if (!empty($configData)) {
            $configData[$ownerField] = $ownerId;
            MpesaConfig::create($configData);
        }
    }
}
