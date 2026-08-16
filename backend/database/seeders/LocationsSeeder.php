<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class LocationsSeeder extends Seeder
{
    public function run(): void
    {
        $this->clearExistingData();
        $this->seedFromJson();
    }

    private function clearExistingData(): void
    {
        // Truncate tables in a driver-prognostic way. 
        // MongoDB doesn't have foreign key checks to disable.
        if (DB::getDriverName() !== 'mongodb') {
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        }
        
        DB::table('location_area')->truncate();
        DB::table('constituencies')->truncate();
        DB::table('location')->truncate();
        
        if (DB::getDriverName() !== 'mongodb') {
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        }
    }

    private function seedFromJson(): void
    {
        $jsonPath = database_path('seeders/region.json');
        
        if (!File::exists($jsonPath)) {
            $this->command->error("JSON file not found: {$jsonPath} . Please ensure the JSON file is present.");
            return;
        }

        $jsonData = json_decode(File::get($jsonPath), true);
        
        if (!isset($jsonData['counties'])) {
            $this->command->error("Invalid JSON structure: missing 'counties' key.");
            return;
        }

        $countiesData = $jsonData['counties'];

        $constituencyId = 1;
        $wardId = 1;

        $countiesInsert = [];
        $constituenciesInsert = [];
        $wardsInsert = [];

        foreach ($countiesData as $countyName => $countyInfo) {
            $countyId = $countyInfo['code'];
            
            $countiesInsert[] = [
                'id' => (int) $countyId,
                'description' => $countyName,
                'status' => 1
            ];

            if (isset($countyInfo['constituencies'])) {
                foreach ($countyInfo['constituencies'] as $constituencyName => $wardsList) {
                    $currentConstituencyId = $constituencyId++;
                    
                    $constituenciesInsert[] = [
                        'id' => $currentConstituencyId,
                        'location_id' => (int) $countyId,
                        'description' => $constituencyName,
                        'status' => 1
                    ];

                    if (is_array($wardsList)) {
                        foreach ($wardsList as $wardName) {
                            $wardsInsert[] = [
                                'id' => $wardId++,
                                'location_id' => (int) $countyId,
                                'constituency_id' => $currentConstituencyId,
                                'description' => strtoupper($wardName),
                                'status' => 1
                            ];
                        }
                    }
                }
            }
        }

        // Insert Counties
        DB::table('location')->insert($countiesInsert);
        $this->command->info(count($countiesInsert) . ' counties seeded successfully.');

        // Insert Constituencies in chunks
        foreach (array_chunk($constituenciesInsert, 100) as $chunk) {
            DB::table('constituencies')->insert($chunk);
        }
        $this->command->info(count($constituenciesInsert) . ' constituencies seeded successfully.');

        // Insert Wards in chunks
        foreach (array_chunk($wardsInsert, 500) as $chunk) {
            DB::table('location_area')->insert($chunk);
        }
        $this->command->info(count($wardsInsert) . ' wards seeded successfully.');
    }
}