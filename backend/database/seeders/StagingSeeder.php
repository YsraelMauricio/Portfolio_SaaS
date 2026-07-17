<?php

namespace Database\Seeders;

use App\Models\Contract;
use App\Models\Payment;
use App\Models\ProductType;
use App\Models\Project;
use App\Models\Quote;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class StagingSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed test data with is_test = true for staging validation.
     *
     * Run: php artisan db:seed --class=StagingSeeder
     *
     * All records created here have is_test = true so they are excluded
     * from every BI query by default (CONSTRAINTS.md §Money and legal).
     */
    public function run(): void
    {
        // ─── 1. Create test admin user ──────────────────────────────────────────
        $adminUser = User::firstOrCreate(
            ['email' => 'test-admin@ysraelmauricio.com'],
            [
                'name' => 'Test Admin',
                'password' => 'password', // 'hashed' cast handles hashing
                'preferred_locale' => 'en',
            ]
        );

        $adminRole = Role::where('name', 'admin')->first();
        if ($adminRole && ! $adminUser->hasRole('admin')) {
            $adminUser->assignRole('admin');
        }

        $this->command?->info('Created/verified test admin: test-admin@ysraelmauricio.com / password');

        // ─── 2. Create test quotes (3 categories) ──────────────────────────────
        // Fetch product types by their slugs (seeded by QuoteEngineSeeder)
        $landingPage = ProductType::where('slug', 'landing-page')->first();
        $flutterApp = ProductType::where('slug', 'flutter-app')->first();
        $desktopApp = ProductType::where('slug', 'desktop-cross-platform')->first();

        if (! $landingPage || ! $flutterApp || ! $desktopApp) {
            $this->command?->error(
                'Product types not found. Run `php artisan db:seed` first to seed QuoteEngineSeeder.'
            );

            return;
        }

        $now = Carbon::now();

        // Quote 1 — Web / Landing page, English
        $quote1 = Quote::create([
            'user_id' => $adminUser->id,
            'product_type_id' => $landingPage->id,
            'estimated_price_min' => 350.00,
            'estimated_price_max' => 650.00,
            'estimated_days_min' => 5,
            'estimated_days_max' => 10,
            'currency' => 'USD',
            'status' => 'saved',
            'is_test' => true,
            'locale' => 'en',
            'created_at' => $now->copy()->subDays(30),
            'updated_at' => $now->copy()->subDays(30),
        ]);

        // Quote 2 — Mobile / Flutter app, English
        $quote2 = Quote::create([
            'user_id' => $adminUser->id,
            'product_type_id' => $flutterApp->id,
            'estimated_price_min' => 4000.00,
            'estimated_price_max' => 5000.00,
            'estimated_days_min' => 25,
            'estimated_days_max' => 35,
            'currency' => 'USD',
            'status' => 'saved',
            'is_test' => true,
            'locale' => 'en',
            'created_at' => $now->copy()->subDays(20),
            'updated_at' => $now->copy()->subDays(20),
        ]);

        // Quote 3 — Desktop / Cross-platform, Spanish
        $quote3 = Quote::create([
            'user_id' => $adminUser->id,
            'product_type_id' => $desktopApp->id,
            'estimated_price_min' => 2500.00,
            'estimated_price_max' => 3500.00,
            'estimated_days_min' => 15,
            'estimated_days_max' => 25,
            'currency' => 'USD',
            'status' => 'saved',
            'is_test' => true,
            'locale' => 'es',
            'created_at' => $now->copy()->subDays(10),
            'updated_at' => $now->copy()->subDays(10),
        ]);

        $this->command?->info('Created 3 test quotes (is_test = true)');

        // ─── 3. Create test projects with various statuses ──────────────────────
        // Project 1 — linked to Quote 1, delivered
        $project1 = Project::create([
            'quote_id' => $quote1->id,
            'user_id' => $adminUser->id,
            'status' => 'delivered',
            'actual_start_date' => $now->copy()->subDays(25),
            'confirmed_delivery_date' => $now->copy()->subDays(5),
            'actual_delivery_date' => $now->copy()->subDays(3),
            'paused_days' => 0,
            'scope_changed' => false,
            'is_test' => true,
            'created_at' => $now->copy()->subDays(25),
            'updated_at' => $now->copy()->subDays(3),
        ]);

        // Project 2 — linked to Quote 2, in development (active)
        $project2 = Project::create([
            'quote_id' => $quote2->id,
            'user_id' => $adminUser->id,
            'status' => 'in_development',
            'actual_start_date' => $now->copy()->subDays(15),
            'confirmed_delivery_date' => $now->copy()->addDays(10),
            'actual_delivery_date' => null,
            'paused_days' => 2,
            'scope_changed' => false,
            'is_test' => true,
            'created_at' => $now->copy()->subDays(15),
            'updated_at' => $now->copy()->subDays(1),
        ]);

        // Project 3 — linked to Quote 3, cancelled
        $project3 = Project::create([
            'quote_id' => $quote3->id,
            'user_id' => $adminUser->id,
            'status' => 'cancelled',
            'actual_start_date' => null,
            'confirmed_delivery_date' => null,
            'actual_delivery_date' => null,
            'paused_days' => 0,
            'scope_changed' => false,
            'is_test' => true,
            'created_at' => $now->copy()->subDays(8),
            'updated_at' => $now->copy()->subDays(6),
        ]);

        $this->command?->info('Created 3 test projects (delivered, in_development, cancelled — is_test = true)');

        // ─── 4. Create test contracts (signed for delivered/in_development; cancelled for cancelled) ──
        // Contract 1 — signed, for delivered project
        $contract1 = Contract::create([
            'project_id' => $project1->id,
            'quote_snapshot' => [
                'product_type_name' => 'Landing page',
                'price_usd' => 500.00,
                'estimated_days_min' => 5,
                'estimated_days_max' => 10,
                'modifiers' => ['Diseño personalizado', 'SEO inicial'],
                'technologies' => ['React', 'Tailwind'],
            ],
            'status' => 'signed',
            'documenso_document_id' => 'DOCUMENSO_STAGING_MOCK_1',
            'generated_at' => $now->copy()->subDays(24),
            'approved_by_admin_at' => $now->copy()->subDays(23),
            'sent_at' => $now->copy()->subDays(22),
            'signed_at' => $now->copy()->subDays(20),
            'cancelled_at' => null,
            'is_test' => true,
            'created_at' => $now->copy()->subDays(24),
            'updated_at' => $now->copy()->subDays(20),
        ]);

        // Contract 2 — signed, for in_development project
        $contract2 = Contract::create([
            'project_id' => $project2->id,
            'quote_snapshot' => [
                'product_type_name' => 'App Flutter (ambas plataformas)',
                'price_usd' => 4500.00,
                'estimated_days_min' => 25,
                'estimated_days_max' => 35,
                'modifiers' => ['Android + iOS'],
                'technologies' => ['Flutter', 'Dart', 'Firebase'],
            ],
            'status' => 'signed',
            'documenso_document_id' => 'DOCUMENSO_STAGING_MOCK_2',
            'generated_at' => $now->copy()->subDays(14),
            'approved_by_admin_at' => $now->copy()->subDays(13),
            'sent_at' => $now->copy()->subDays(12),
            'signed_at' => $now->copy()->subDays(10),
            'cancelled_at' => null,
            'is_test' => true,
            'created_at' => $now->copy()->subDays(14),
            'updated_at' => $now->copy()->subDays(10),
        ]);

        // Contract 3 — cancelled, for cancelled project
        $contract3 = Contract::create([
            'project_id' => $project3->id,
            'quote_snapshot' => [
                'product_type_name' => 'App escritorio — Electron/Tauri',
                'price_usd' => 3000.00,
                'estimated_days_min' => 15,
                'estimated_days_max' => 25,
                'modifiers' => ['Multiplataforma (Tauri/Electron)'],
                'technologies' => ['Tauri', 'Rust', 'React'],
            ],
            'status' => 'cancelled',
            'documenso_document_id' => 'DOCUMENSO_STAGING_MOCK_3',
            'generated_at' => $now->copy()->subDays(7),
            'approved_by_admin_at' => $now->copy()->subDays(7),
            'sent_at' => null,
            'signed_at' => null,
            'cancelled_at' => $now->copy()->subDays(6),
            'is_test' => true,
            'created_at' => $now->copy()->subDays(7),
            'updated_at' => $now->copy()->subDays(6),
        ]);

        $this->command?->info('Created 3 test contracts (2 signed, 1 cancelled — is_test = true)');

        // ─── 5. Create test payments with various statuses ──────────────────────
        // Payment 1 — confirmed (paypal), for delivered project
        Payment::create([
            'project_id' => $project1->id,
            'contract_id' => $contract1->id,
            'amount_usd' => 500.00,
            'method' => 'paypal',
            'local_currency' => null,
            'amount_local' => null,
            'exchange_rate_used' => null,
            'exchange_rate_overridden_by_admin_id' => null,
            'provider_transaction_id' => 'PAYPAL_STAGING_MOCK_1',
            'webhook_signature_verified' => true,
            'status' => 'confirmed',
            'proof_media_id' => null,
            'confirmed_by_admin_id' => $adminUser->id,
            'paid_at' => $now->copy()->subDays(18),
            'is_test' => true,
            'created_at' => $now->copy()->subDays(19),
            'updated_at' => $now->copy()->subDays(18),
        ]);

        // Payment 2 — pending (qr_bcb), for in_development project (partial/deposit)
        Payment::create([
            'project_id' => $project2->id,
            'contract_id' => $contract2->id,
            'amount_usd' => 2250.00,
            'method' => 'qr_bcb',
            'local_currency' => 'BOB',
            'amount_local' => 15750.00,
            'exchange_rate_used' => 7.0000,
            'exchange_rate_overridden_by_admin_id' => null,
            'provider_transaction_id' => 'BCB_STAGING_MOCK_1',
            'webhook_signature_verified' => true,
            'status' => 'pending',
            'proof_media_id' => null,
            'confirmed_by_admin_id' => null,
            'paid_at' => null,
            'is_test' => true,
            'created_at' => $now->copy()->subDays(9),
            'updated_at' => $now->copy()->subDays(9),
        ]);

        // Payment 3 — pending (bank_transfer), for delivered project (remaining balance)
        Payment::create([
            'project_id' => $project1->id,
            'contract_id' => $contract1->id,
            'amount_usd' => 250.00,
            'method' => 'bank_transfer',
            'local_currency' => 'BOB',
            'amount_local' => 1750.00,
            'exchange_rate_used' => 7.0000,
            'exchange_rate_overridden_by_admin_id' => null,
            'provider_transaction_id' => null,
            'webhook_signature_verified' => false,
            'status' => 'pending',
            'proof_media_id' => null,
            'confirmed_by_admin_id' => null,
            'paid_at' => null,
            'is_test' => true,
            'created_at' => $now->copy()->subDays(3),
            'updated_at' => $now->copy()->subDays(3),
        ]);

        $this->command?->info('Created 3 test payments (1 confirmed, 2 pending — is_test = true)');

        $this->command?->info('✓ StagingSeeder complete — all records have is_test = true');
    }
}
