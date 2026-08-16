<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Admin;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create default admin user
        Admin::updateOrCreate(
            ['email' => 'admin@tokenapp.com'],
            [
                'name' => 'Super Admin',
                'username' => 'admin',
                'email' => 'admin@tokenpap.com',
                'password' => Hash::make('123456'),
                'role' => 'admin',
                'email_verified_at' => now(),
            ]
        );

        $this->command->info('Admin user created successfully!');
        $this->command->info('Email: admin@tokenapp.com');
        //$this->command->info(`Password: ${password}`);
        $this->command->warn('Please change the password after first login!');
    }
}
