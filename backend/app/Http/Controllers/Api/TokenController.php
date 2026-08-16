<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Landlord;
use App\Models\Meter;
use App\Models\Property;
use App\Models\PropertyRoute;
use App\Models\PropertyStreet;
use App\Models\PropertyUnit;
use App\Models\PropertyZone;
use App\Models\TokenTransaction;
use App\Models\Vendor;
use App\Services\PaymentSmsService;
use App\Services\PrismTokenService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class TokenController extends Controller
{
    private PrismTokenService $prismService;
    private PaymentSmsService $paymentSmsService;

    public function __construct(PrismTokenService $prismService, PaymentSmsService $paymentSmsService)
    {
        $this->prismService = $prismService;
        $this->paymentSmsService = $paymentSmsService;
    }

    /**
     * Look up a meter with owner, customer, and location details.
     */
    public function meterLookup(Request $request)
    {
        $request->validate([
            'q' => 'required|string|min:2',
        ]);

        $query = trim((string) $request->query('q'));
        $user = $request->user();

        $meterQuery = Meter::with(['vendor', 'landlord', 'customers'])
            ->where('meter_number', 'like', '%' . $query . '%');

        $this->applyRoleScope($meterQuery, $user);

        $meters = $meterQuery->limit(10)->get();

        if ($meters->isEmpty()) {
            $customerMeterIds = Customer::where(function ($q) use ($query) {
                $q->where('phone', 'like', '%' . $query . '%')
                    ->orWhere('name', 'like', '%' . $query . '%');
            })->pluck('meter_id')->filter()->unique()->values()->all();

            $scopedQuery = Meter::with(['vendor', 'landlord', 'customers'])
                ->whereIn('id', $customerMeterIds);
            $this->applyRoleScope($scopedQuery, $user);
            $meters = $scopedQuery->limit(10)->get();
        }

        if ($meters->isEmpty()) {
            return response()->json([
                'message' => 'No matching meter found.',
                'data' => [],
            ], 404);
        }

        return response()->json([
            'message' => 'Meters retrieved successfully',
            'data' => $meters->map(fn (Meter $meter) => $this->serializeMeterForManagement($meter)),
        ]);
    }

    /**
     * Generate a new token for a meter.
     */
    public function generate(Request $request)
    {
        $validated = $request->validate([
            'meter_id' => 'required|string|exists:meters,_id',
            'token_type' => 'required|string|in:credit,clear_tamper,clear_credit,set_max_overdraft',
            'vend_mode' => 'nullable|string|in:unit,value',
            'amount' => 'nullable|numeric|min:0.01',
            'transaction_id' => 'nullable|string|max:255',
            'transaction_time' => 'nullable|date',
            'send_sms' => 'nullable|boolean',
            'phone' => 'nullable|string|max:30',
            'control_value' => 'nullable|integer|min:0',
        ]);

        $meter = Meter::with(['vendor.smsConfig', 'landlord', 'customers'])->findOrFail($validated['meter_id']);
        $user = $request->user();
        $this->authorizeForMeter($meter, $user);

        $tokenType = $validated['token_type'];
        $vendMode = $validated['vend_mode'] ?? 'value';
        $customer = $meter->customers()->first();
        $phone = $validated['phone'] ?? $customer?->phone;
        $sendSms = (bool) ($validated['send_sms'] ?? false);
        $amount = null;
        $units = null;
        $controlIndex = null;
        $controlValue = null;
        $tokenStrings = [];

        [$ownerType, $ownerId] = $this->resolveOwner($meter);

        try {
            if ($tokenType === 'credit') {
                if (!isset($validated['amount'])) {
                    return response()->json(['message' => 'Amount is required for credit vending.'], 422);
                }

                $pricePerUnit = (float) ($meter->price_per_unit ?: 0);
                $inputAmount = (float) $validated['amount'];
                if ($vendMode === 'unit') {
                    if ($pricePerUnit <= 0) {
                        return response()->json(['message' => 'This meter has no valid price per unit set for vend-by-unit.'], 422);
                    }
                    $units = $inputAmount;
                    $amount = round($units * $pricePerUnit, 2);
                } else {
                    $amount = $inputAmount;
                    $units = $pricePerUnit > 0 ? round($amount / $pricePerUnit, 3) : null;
                }

                $generatedTokens = $this->prismService->issueCreditToken($meter, $amount);
            } else {
                $controlConfig = $this->resolveControlConfig($tokenType, $validated);
                $controlIndex = $controlConfig['index'];
                $controlValue = $controlConfig['value'];

                $generatedTokens = $this->prismService->issueSetControlToken(
                    $meter,
                    (bool) $controlConfig['is_flag'],
                    (int) $controlIndex,
                    (int) $controlValue
                );
            }

            foreach ($generatedTokens as $token) {
                if (isset($token->tokenDec)) {
                    $tokenStrings[] = $token->tokenDec;
                } elseif (isset($token->tokenHex)) {
                    $tokenStrings[] = $token->tokenHex;
                }
            }

            $smsSent = false;
            if ($sendSms && $phone && !empty($tokenStrings)) {
                $smsSent = $this->paymentSmsService->sendManualTokenMessage(
                    $phone,
                    $meter,
                    $tokenStrings,
                    [
                        'amount' => $amount,
                        'units' => $units,
                        'token_type' => $tokenType,
                        'transaction_id' => $validated['transaction_id'] ?? null,
                    ]
                );
            }

            $transaction = TokenTransaction::create([
                'meter_id' => $meter->id,
                'vendor_id' => $meter->vendor_id,
                'landlord_id' => $meter->landlord_id,
                'owner_type' => $ownerType,
                'owner_id' => $ownerId,
                'actor_user_id' => $user->id,
                'customer_id' => $customer?->id,
                'amount' => $amount,
                'units' => $units,
                'tokens' => $tokenStrings,
                'token_type' => $tokenType,
                'vend_mode' => $tokenType === 'credit' ? $vendMode : null,
                'control_index' => $controlIndex,
                'control_value' => $controlValue,
                'transaction_id' => $validated['transaction_id'] ?? null,
                'transaction_time' => $validated['transaction_time'] ?? null,
                'send_sms' => $sendSms,
                'sms_sent' => $smsSent,
                'phone' => $phone,
                'prism_message_id' => $this->prismService->getLastMessageId(),
                'status' => 'success',
                'description' => $this->describeTransaction($tokenType, $amount, $units, $controlValue, count($tokenStrings)),
            ]);

            return response()->json([
                'message' => 'Token generated successfully',
                'transaction' => $transaction,
                'tokens' => $tokenStrings,
                'sms_sent' => $smsSent,
            ], 201);

        } catch (\Prism\PrismToken1\ApiException $e) {
            Log::error("Prism API Exception: {$e->eCode} - {$e->eMsgEn}");

            TokenTransaction::create([
                'meter_id' => $meter->id,
                'vendor_id' => $meter->vendor_id,
                'landlord_id' => $meter->landlord_id,
                'owner_type' => $ownerType,
                'owner_id' => $ownerId,
                'actor_user_id' => $user->id,
                'customer_id' => $customer?->id,
                'amount' => $amount,
                'units' => $units,
                'token_type' => $tokenType,
                'vend_mode' => $tokenType === 'credit' ? $vendMode : null,
                'control_index' => $controlIndex,
                'control_value' => $controlValue,
                'transaction_id' => $validated['transaction_id'] ?? null,
                'transaction_time' => $validated['transaction_time'] ?? null,
                'send_sms' => $sendSms,
                'phone' => $phone,
                'prism_message_id' => $this->prismService->getLastMessageId(),
                'status' => 'failed',
                'description' => "Prism Error: {$e->eCode} - {$e->eMsgEn}",
            ]);

            return response()->json([
                'message' => 'Failed to generate token from Prism network',
                'error_code' => $e->eCode,
                'error_details' => $e->eMsgEn,
            ], 502);

        } catch (\Exception $e) {
            Log::error("Prism Connection/System Error: " . $e->getMessage());

            TokenTransaction::create([
                'meter_id' => $meter->id,
                'vendor_id' => $meter->vendor_id,
                'landlord_id' => $meter->landlord_id,
                'owner_type' => $ownerType,
                'owner_id' => $ownerId,
                'actor_user_id' => $user->id,
                'customer_id' => $customer?->id,
                'amount' => $amount,
                'units' => $units,
                'token_type' => $tokenType,
                'vend_mode' => $tokenType === 'credit' ? $vendMode : null,
                'control_index' => $controlIndex,
                'control_value' => $controlValue,
                'transaction_id' => $validated['transaction_id'] ?? null,
                'transaction_time' => $validated['transaction_time'] ?? null,
                'send_sms' => $sendSms,
                'phone' => $phone,
                'prism_message_id' => $this->prismService->getLastMessageId(),
                'status' => 'failed',
                'description' => 'System Error: ' . $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'An internal error occurred while connecting to the token server',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Search latest tokens by meter number or customer phone number
     */
    public function searchPublic(Request $request)
    {
        $query = $request->query('q');

        if (!$query) {
            return response()->json(['message' => 'Query parameter "q" is required.'], 400);
        }

        $meterIds = [];
        $metersData = [];

        // 1. Try to find by Meter Number
        $meters = Meter::where('meter_number', 'like', '%' . $query . '%')->get();
        if ($meters->isNotEmpty()) {
            foreach ($meters as $m) {
                $meterIds[] = $m->id;
                $metersData[$m->id] = $m;
            }
        }

        // 2. Try to find by Phone Number (Customer)
        // Ensure to remove common prefixes or formatting if necessary
        $customers = Customer::where('phone', 'like', '%' . $query . '%')->get();
        if ($customers->isNotEmpty()) {
            foreach ($customers as $c) {
                if ($c->meter_id) {
                    $meterIds[] = $c->meter_id;
                    if (!isset($metersData[$c->meter_id])) {
                        $m = Meter::find($c->meter_id);
                        if ($m) {
                            $metersData[$m->id] = $m;
                        }
                    }
                }
            }
        }

        $meterIds = array_unique($meterIds);

        if (empty($meterIds)) {
            return response()->json(['message' => 'No matching meter or customer found.'], 404);
        }

        // 3. Fetch latest 5 transactions for these meters
        $transactions = TokenTransaction::whereIn('meter_id', $meterIds)
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        // Attach meter info to each transaction for frontend display
        $transactions->transform(function ($transaction) use ($metersData) {
            $transaction->meter = $metersData[$transaction->meter_id] ?? null;
            return $transaction;
        });

        return response()->json([
            'message' => 'Transactions retrieved successfully',
            'data' => $transactions
        ]);
    }

    private function authorizeForMeter(Meter $meter, $user): void
    {
        $isAdmin = in_array($user->role, ['admin', 'system_admin'], true);
        if ($isAdmin) {
            return;
        }

        if ($user->role === 'vendor') {
            $vendor = Vendor::where('user_id', $user->id)->first();
            if ($vendor && (string) $meter->vendor_id === (string) $vendor->id) {
                return;
            }
        }

        if ($user->role === 'landlord') {
            $landlord = Landlord::where('user_id', $user->id)->first();
            if ($landlord && (string) $meter->landlord_id === (string) $landlord->id) {
                return;
            }
        }

        abort(response()->json(['message' => 'Unauthorized to manage tokens for this meter.'], 403));
    }

    private function applyRoleScope($query, $user): void
    {
        if ($user->role === 'vendor') {
            $vendor = Vendor::where('user_id', $user->id)->first();
            $query->where('vendor_id', $vendor?->id ?? '__none__');
        } elseif ($user->role === 'landlord') {
            $landlord = Landlord::where('user_id', $user->id)->first();
            $query->where('landlord_id', $landlord?->id ?? '__none__');
        }
    }

    private function serializeMeterForManagement(Meter $meter): array
    {
        $customer = $meter->customers->first();
        $unit = PropertyUnit::where('meter_id', (string) $meter->id)->first();
        $property = $unit ? Property::find($unit->property_id) : null;
        $route = null;
        $street = null;
        $zone = null;

        if ($unit) {
            if ($unit->parent_type === 'street') {
                $street = PropertyStreet::find($unit->parent_id);
                $route = $street ? PropertyRoute::find($street->route_id) : null;
                $zone = $route ? PropertyZone::find($route->zone_id) : null;
            } elseif ($unit->parent_type === 'route') {
                $route = PropertyRoute::find($unit->parent_id);
                $zone = $route ? PropertyZone::find($route->zone_id) : null;
            } elseif ($unit->parent_type === 'zone') {
                $zone = PropertyZone::find($unit->parent_id);
            }
        }

        return [
            'id' => (string) $meter->id,
            'meter_number' => $meter->meter_number,
            'meter_type' => $meter->type,
            'price_per_unit' => $meter->price_per_unit,
            'status' => $meter->status,
            'vendor' => $meter->vendor ? [
                'id' => (string) $meter->vendor->id,
                'name' => $meter->vendor->business_name,
            ] : null,
            'landlord' => $meter->landlord ? [
                'id' => (string) $meter->landlord->id,
                'name' => $meter->landlord->full_name,
            ] : null,
            'customer' => $customer ? [
                'id' => (string) $customer->id,
                'name' => $customer->name,
                'phone' => $customer->phone,
                'address' => $customer->address,
            ] : null,
            'location' => [
                'property' => $property?->name,
                'zone' => $zone?->name,
                'route' => $route?->name,
                'street' => $street?->name,
                'unit' => $unit?->name ?: $unit?->unit_number,
                'address' => $property?->location ?? $customer?->address,
            ],
        ];
    }

    private function resolveControlConfig(string $tokenType, array $validated): array
    {
        $config = config("token_controls.{$tokenType}");
        if (!$config || !array_key_exists('index', $config) || $config['index'] === null || $config['index'] === '') {
            abort(response()->json([
                'message' => "Control token mapping for {$tokenType} is not configured on the server.",
            ], 422));
        }

        $value = $config['value'] ?? null;
        if ($tokenType === 'set_max_overdraft') {
            $value = $validated['control_value'] ?? $value;
        }

        if ($value === null || $value === '') {
            abort(response()->json([
                'message' => "Control value for {$tokenType} is required.",
            ], 422));
        }

        return [
            'index' => (int) $config['index'],
            'value' => (int) $value,
            'is_flag' => (bool) ($config['is_flag'] ?? false),
        ];
    }

    private function resolveOwner(Meter $meter): array
    {
        if ($meter->vendor_id) {
            return ['vendor', (string) $meter->vendor_id];
        }

        if ($meter->landlord_id) {
            return ['landlord', (string) $meter->landlord_id];
        }

        return ['unassigned', null];
    }

    private function describeTransaction(string $tokenType, ?float $amount, ?float $units, ?int $controlValue, int $tokenCount): string
    {
        return match ($tokenType) {
            'credit' => "Successfully generated {$tokenCount} credit token(s) for KES " . number_format((float) $amount, 2),
            'clear_tamper' => "Successfully generated {$tokenCount} clear tamper token(s).",
            'clear_credit' => "Successfully generated {$tokenCount} clear credit token(s).",
            'set_max_overdraft' => "Successfully generated {$tokenCount} max overdraft token(s) with value {$controlValue}.",
            default => "Successfully generated {$tokenCount} token(s).",
        };
    }
}
