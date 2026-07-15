<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RoleSeeder extends Seeder
{
    /**
     * Seed the application's roles and permissions.
     *
     * Creates the two DB-backed roles:
     * - client: default role for registered users
     * - admin: full access, requires 2FA
     *
     * The "visitor" role is implicit (unauthenticated users) and has no DB row.
     *
     * Permissions are not granular yet — admin gets all permissions,
     * but the create_permission_tables migration creates the table structure.
     * Granular permission assignments will be added in a later phase.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // Create permissions for all modules (scope for future use)
        // Using a broad set so the admin role can be assigned "all" access
        $permissions = [
            'manage users',
            'manage quotes',
            'manage products',
            'manage contracts',
            'manage payments',
            'manage projects',
            'manage settings',
            'manage content',
            'manage media',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // Create roles and assign permissions

        // Admin role — gets all permissions
        $admin = Role::firstOrCreate(['name' => 'admin']);
        $admin->syncPermissions($permissions);

        // Client role — gets no special permissions (scoped by ownership)
        // Clients see only their own projects, quotes, contracts
        Role::firstOrCreate(['name' => 'client']);
    }
}
