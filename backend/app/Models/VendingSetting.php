<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class VendingSetting extends Model
{
    use HasFactory;

    protected $table = 'vending_settings';

    protected $fillable = [
        'key',
        'value',
        'type',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Get config value by key.
     */
    public static function getValue(string $key, $default = null)
    {
        $config = self::where('key', $key)->where('is_active', true)->first();

        if (!$config) {
            return $default;
        }

        $value = $config->value;

        // Cast based on type
        switch ($config->type) {
            case 'boolean':
                return filter_var($value, FILTER_VALIDATE_BOOLEAN);
            case 'number':
            case 'integer':
                return is_numeric($value) ? (int) $value : $default;
            case 'float':
                return is_numeric($value) ? (float) $value : $default;
            case 'json':
                return json_decode($value, true) ?? $default;
            default:
                return $value ?? $default;
        }
    }
}
