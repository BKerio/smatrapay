<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\VendingSetting;

class VendingConfigSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $configs = [
            [
                'key' => 'vending_sgc',
                'value' => '201457',
                'type' => 'integer',
                'description' => 'Supply Group Code',
            ],
            [
                'key' => 'vending_krn',
                'value' => '1',
                'type' => 'integer',
                'description' => 'Key Revision Number',
            ],
            [
                'key' => 'vending_ti',
                'value' => '1',
                'type' => 'integer',
                'description' => 'Tariff Index',
            ],
            [
                'key' => 'vending_ea',
                'value' => '7',
                'type' => 'integer',
                'description' => 'Encryption Algorithm',
            ],
            [
                'key' => 'vending_tct',
                'value' => '1',
                'type' => 'integer',
                'description' => 'Token Class Type (Usually 1 for standard numeric STS)',
            ],
            [
                'key' => 'vending_ken',
                'value' => '255',
                'type' => 'integer',
                'description' => 'Key Expiry Number',
            ],
        ];

        foreach ($configs as $config) {
            VendingSetting::updateOrCreate(
                ['key' => $config['key']],
                $config
            );
        }
    }
}
