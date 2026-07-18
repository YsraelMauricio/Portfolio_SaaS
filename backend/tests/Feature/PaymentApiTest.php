<?php

namespace Tests\Feature;

use App\Models\Contract;
use App\Models\Payment;
use App\Models\Project;
use App\Models\User;
use Database\Seeders\QuoteEngineSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PaymentApiTest extends TestCase
{
    use LazilyRefreshDatabase;

    private User $admin;

    private User $client;

    private Project $project;

    private Contract $signedContract;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
        $this->seed(QuoteEngineSeeder::class);
        Storage::fake('public');

        // Create admin
        $this->admin = User::factory()->create(['name' => 'Admin', 'email' => 'admin@test.com']);
        $this->admin->assignRole('admin');
        $this->admin->update(['two_factor_enabled' => true]);

        // Create client
        $this->client = User::factory()->create(['name' => 'Client', 'email' => 'client@test.com']);
        $this->client->assignRole('client');

        // Create a project owned by the client with a quote_snapshot price
        $this->project = Project::factory()->create([
            'user_id' => $this->client->id,
            'status' => 'approved',
            'is_test' => false,
        ]);

        // Create a signed contract on that project with price in snapshot
        $this->signedContract = Contract::factory()->signed()->create([
            'project_id' => $this->project->id,
            'quote_snapshot' => [
                'product_type_name' => 'Landing Page',
                'price_usd' => 1500.00,
                'estimated_days_min' => 10,
                'estimated_days_max' => 20,
                'modifiers' => [],
                'technologies' => [],
            ],
        ]);

        // Set payment provider config values for webhook tests
        Config::set('services.openbcb.api_token', 'test-openbcb-token');
        Config::set('services.binance_pay.secret_key', 'test-binance-secret');
        Config::set('services.paypal.client_secret', 'test-paypal-secret');
        Config::set('services.paypal.webhook_id', 'test-webhook-id');
        Config::set('services.documenso.api_token', 'test-documenso-token');

        $this->withSession(['2fa_verified' => true]);
    }

    // ─── POST /api/v1/payments/initiate ────────────────────────────────────

    public function test_client_initiates_payment_for_project(): void
    {
        $response = $this->actingAs($this->client)
            ->postJson('/api/v1/payments/initiate', [
                'project_id' => $this->project->id,
                'method' => 'paypal',
            ]);

        $response->assertStatus(201);
        $response->assertJsonStructure([
            'data' => [
                'payment' => [
                    'id',
                    'project_id',
                    'contract_id',
                    'amount_usd',
                    'method',
                    'status',
                    'is_test',
                ],
                'provider_data' => [
                    'checkout_url',
                    'amount_usd',
                ],
            ],
        ]);
        $this->assertEquals('pending', $response->json('data.payment.status'));
        $this->assertEquals('paypal', $response->json('data.payment.method'));
        $this->assertEquals(1500.00, (float) $response->json('data.payment.amount_usd'));
    }

    public function test_client_cannot_initiate_payment_for_other_users_project(): void
    {
        $otherClient = User::factory()->create();
        $otherClient->assignRole('client');
        $otherProject = Project::factory()->create([
            'user_id' => $otherClient->id,
        ]);
        // Create a signed contract for the other project
        Contract::factory()->signed()->create([
            'project_id' => $otherProject->id,
        ]);

        $response = $this->actingAs($this->client)
            ->postJson('/api/v1/payments/initiate', [
                'project_id' => $otherProject->id,
                'method' => 'paypal',
            ]);

        $response->assertStatus(404);
    }

    public function test_initiate_payment_fails_without_signed_contract(): void
    {
        // Create a new project without a signed contract
        $newProject = Project::factory()->create([
            'user_id' => $this->client->id,
        ]);

        $response = $this->actingAs($this->client)
            ->postJson('/api/v1/payments/initiate', [
                'project_id' => $newProject->id,
                'method' => 'paypal',
            ]);

        $response->assertStatus(422);
        $response->assertJson([
            'errors' => ['contract' => [
                'This project has no signed contract. Payment cannot be initiated without a signed contract.',
            ]],
        ]);
    }

    public function test_initiate_payment_provides_bank_transfer_instructions(): void
    {
        $response = $this->actingAs($this->client)
            ->postJson('/api/v1/payments/initiate', [
                'project_id' => $this->project->id,
                'method' => 'bank_transfer',
            ]);

        $response->assertStatus(201);
        $this->assertEquals('bank_transfer', $response->json('data.payment.method'));
        $this->assertArrayHasKey('instructions', $response->json('data.provider_data'));
        $this->assertArrayHasKey('account_details', $response->json('data.provider_data'));
    }

    // ─── POST /api/v1/payments/{id}/proof ──────────────────────────────────

    public function test_client_uploads_proof_for_bank_transfer(): void
    {
        // Create a pending bank transfer payment
        $payment = Payment::factory()->bankTransfer()->create([
            'project_id' => $this->project->id,
            'contract_id' => $this->signedContract->id,
            'status' => 'pending',
        ]);

        $file = UploadedFile::fake()->image('proof.jpg', 100, 100);

        $response = $this->actingAs($this->client)
            ->postJson("/api/v1/payments/{$payment->id}/proof", [
                'proof' => $file,
            ]);

        $response->assertStatus(200);
        $this->assertNotNull($response->json('data.proof_media_id'));
    }

    public function test_upload_proof_fails_for_non_bank_transfer(): void
    {
        $payment = Payment::factory()->create([
            'project_id' => $this->project->id,
            'contract_id' => $this->signedContract->id,
            'method' => 'paypal',
            'status' => 'pending',
        ]);

        $file = UploadedFile::fake()->image('proof.jpg');

        $response = $this->actingAs($this->client)
            ->postJson("/api/v1/payments/{$payment->id}/proof", [
                'proof' => $file,
            ]);

        $response->assertStatus(422);
        $response->assertJson([
            'errors' => ['method' => ['Proof upload is only supported for bank transfer payments.']],
        ]);
    }

    public function test_upload_proof_fails_for_confirmed_payment(): void
    {
        $payment = Payment::factory()->bankTransfer()->confirmed()->create([
            'project_id' => $this->project->id,
            'contract_id' => $this->signedContract->id,
        ]);

        $file = UploadedFile::fake()->image('proof.jpg');

        $response = $this->actingAs($this->client)
            ->postJson("/api/v1/payments/{$payment->id}/proof", [
                'proof' => $file,
            ]);

        $response->assertStatus(422);
        $response->assertJsonFragment(['Can only upload proof for pending payments. Current status: confirmed.']);
    }

    // ─── PATCH /api/v1/admin/payments/{id}/confirm ─────────────────────────

    public function test_admin_confirms_bank_transfer_payment(): void
    {
        $payment = Payment::factory()->bankTransfer()->create([
            'project_id' => $this->project->id,
            'contract_id' => $this->signedContract->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->admin)
            ->patchJson("/api/v1/admin/payments/{$payment->id}/confirm");

        $response->assertStatus(200);
        $this->assertEquals('confirmed', $response->json('data.status'));
        $this->assertNotNull($response->json('data.paid_at'));
        $this->assertEquals($this->admin->id, $response->json('data.confirmed_by_admin_id'));
    }

    public function test_admin_confirms_with_exchange_rate_override(): void
    {
        $payment = Payment::factory()->bankTransfer()->create([
            'project_id' => $this->project->id,
            'contract_id' => $this->signedContract->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->admin)
            ->patchJson("/api/v1/admin/payments/{$payment->id}/confirm", [
                'exchange_rate_override' => 7.00,
            ]);

        $response->assertStatus(200);
        $this->assertEquals('confirmed', $response->json('data.status'));
        $this->assertEquals(7.00, (float) $response->json('data.exchange_rate_used'));
    }

    public function test_confirm_fails_for_non_pending_payment(): void
    {
        $payment = Payment::factory()->bankTransfer()->confirmed()->create([
            'project_id' => $this->project->id,
            'contract_id' => $this->signedContract->id,
        ]);

        $response = $this->actingAs($this->admin)
            ->patchJson("/api/v1/admin/payments/{$payment->id}/confirm");

        $response->assertStatus(422);
        $response->assertJsonFragment(['Only pending payments can be confirmed. Current status: confirmed.']);
    }

    // ─── Payment Webhook Tests ─────────────────────────────────────────────

    public function test_paypal_webhook_with_valid_signature_processes_correctly(): void
    {
        $payload = [
            'event_type' => 'PAYMENT.SALE.COMPLETED',
            'resource' => [
                'id' => 'paypal_txn_123',
                'project_id' => $this->project->id,
                'contract_id' => $this->signedContract->id,
                'amount' => 1500.00,
                'is_test' => false,
            ],
        ];

        // Compute a valid signature using the test config values
        $webhookId = config('services.paypal.webhook_id');
        $clientSecret = config('services.paypal.client_secret');
        $transmissionId = 'test-transmission-id';
        $body = json_encode($payload);
        $signedPayload = $transmissionId.'|'.now()->toIso8601String().'|'.$webhookId.'|'.crc32($body);
        $expectedSignature = hash_hmac('sha256', $signedPayload, $clientSecret);

        $response = $this->postJson('/api/v1/webhooks/payments/paypal', $payload, [
            'PAYPAL-TRANSMISSION-ID' => $transmissionId,
            'PAYPAL-TRANSMISSION-TIME' => now()->toIso8601String(),
            'PAYPAL-CERT-URL' => 'https://mock.paypal.com/cert',
            'PAYPAL-TRANSMISSION-SIG' => $expectedSignature,
            'PAYPAL-AUTH-ALGO' => 'SHA256',
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                'id',
                'project_id',
                'amount_usd',
                'method',
                'provider_transaction_id',
                'status',
            ],
        ]);
        $this->assertEquals('confirmed', $response->json('data.status'));
        $this->assertEquals('paypal_txn_123', $response->json('data.provider_transaction_id'));

        // Verify payment exists in database
        $this->assertDatabaseHas('payments', [
            'provider_transaction_id' => 'paypal_txn_123',
            'status' => 'confirmed',
        ]);
    }

    public function test_paypal_webhook_with_invalid_signature_returns_401(): void
    {
        $response = $this->postJson('/api/v1/webhooks/payments/paypal', [
            'event_type' => 'PAYMENT.SALE.COMPLETED',
            'resource' => ['id' => 'txn_456', 'project_id' => 1],
        ], [
            'PAYPAL-TRANSMISSION-ID' => 'bad-transmission-id',
            'PAYPAL-TRANSMISSION-TIME' => now()->toIso8601String(),
            'PAYPAL-CERT-URL' => 'https://mock.paypal.com/cert',
            'PAYPAL-TRANSMISSION-SIG' => 'invalid-signature',
            'PAYPAL-AUTH-ALGO' => 'SHA256',
        ]);

        $response->assertStatus(401);
        $response->assertJson([
            'errors' => ['signature' => ['Invalid webhook signature']],
        ]);
    }

    public function test_paypal_webhook_with_duplicate_transaction_id_is_idempotent(): void
    {
        // First create a payment with this transaction ID
        Payment::factory()->create([
            'project_id' => $this->project->id,
            'contract_id' => $this->signedContract->id,
            'method' => 'paypal',
            'provider_transaction_id' => 'duplicate_txn',
            'status' => 'confirmed',
            'is_test' => false,
        ]);

        $payload = [
            'event_type' => 'PAYMENT.SALE.COMPLETED',
            'resource' => [
                'id' => 'duplicate_txn',
                'project_id' => $this->project->id,
                'contract_id' => $this->signedContract->id,
                'amount' => 1500.00,
                'is_test' => false,
            ],
        ];

        $webhookId = config('services.paypal.webhook_id');
        $clientSecret = config('services.paypal.client_secret');
        $transmissionId = 'test-transmission-id';
        $body = json_encode($payload);
        $signedPayload = $transmissionId.'|'.now()->toIso8601String().'|'.$webhookId.'|'.crc32($body);
        $expectedSignature = hash_hmac('sha256', $signedPayload, $clientSecret);

        $response = $this->postJson('/api/v1/webhooks/payments/paypal', $payload, [
            'PAYPAL-TRANSMISSION-ID' => $transmissionId,
            'PAYPAL-TRANSMISSION-TIME' => now()->toIso8601String(),
            'PAYPAL-CERT-URL' => 'https://mock.paypal.com/cert',
            'PAYPAL-TRANSMISSION-SIG' => $expectedSignature,
            'PAYPAL-AUTH-ALGO' => 'SHA256',
        ]);

        $response->assertStatus(200);

        // Should not have created a new payment — still only 1 with this provider_transaction_id
        $this->assertEquals(1, Payment::where('provider_transaction_id', 'duplicate_txn')->count());
    }

    public function test_binance_webhook_processes_correctly(): void
    {
        $payload = [
            'bizData' => [
                'merchantTradeNo' => 'binance_txn_789',
                'prepayId' => 'binance_prepay_789',
                'project_id' => $this->project->id,
                'contract_id' => $this->signedContract->id,
                'totalFee' => 1500.00,
                'status' => 'PAY_SUCCESS',
                'is_test' => false,
            ],
        ];

        $secretKey = config('services.binance_pay.secret_key');
        $body = json_encode($payload);
        $expectedSignature = hash_hmac('sha512', $body, $secretKey);

        $response = $this->postJson('/api/v1/webhooks/payments/binance', $payload, [
            'BinancePay-Signature' => $expectedSignature,
        ]);

        $response->assertStatus(200);
        $this->assertEquals('confirmed', $response->json('data.status'));
        // BinancePayProvider prefers prepayId as the final provider_transaction_id
        $this->assertEquals('binance_prepay_789', $response->json('data.provider_transaction_id'));

        $this->assertDatabaseHas('payments', [
            'provider_transaction_id' => 'binance_prepay_789',
            'status' => 'confirmed',
        ]);
    }

    public function test_binance_webhook_with_invalid_signature_returns_401(): void
    {
        $response = $this->postJson('/api/v1/webhooks/payments/binance', [
            'bizData' => [
                'merchantTradeNo' => 'binance_txn_999',
                'project_id' => 1,
            ],
        ], [
            'BinancePay-Signature' => 'invalid-signature',
        ]);

        $response->assertStatus(401);
        $response->assertJson([
            'errors' => ['signature' => ['Invalid webhook signature']],
        ]);
    }

    public function test_openbcb_webhook_processes_correctly(): void
    {
        $payload = [
            'transaction_id' => 'openbcb_txn_456',
            'project_id' => $this->project->id,
            'contract_id' => $this->signedContract->id,
            'amount_usd' => 1500.00,
            'amount_local' => 10290.00,
            'exchange_rate' => 6.86,
            'event' => 'completed',
            'is_test' => false,
        ];

        $apiToken = config('services.openbcb.api_token');
        $body = json_encode($payload);
        $expectedSignature = hash_hmac('sha256', $body, $apiToken);

        $response = $this->postJson('/api/v1/webhooks/payments/openbcb', $payload, [
            'X-OpenBCB-Signature' => $expectedSignature,
        ]);

        $response->assertStatus(200);
        $this->assertEquals('confirmed', $response->json('data.status'));
        $this->assertEquals('openbcb_txn_456', $response->json('data.provider_transaction_id'));

        $this->assertDatabaseHas('payments', [
            'provider_transaction_id' => 'openbcb_txn_456',
            'status' => 'confirmed',
        ]);
    }

    public function test_openbcb_webhook_with_invalid_signature_returns_401(): void
    {
        $response = $this->postJson('/api/v1/webhooks/payments/openbcb', [
            'transaction_id' => 'openbcb_txn_999',
            'project_id' => 1,
        ], [
            'X-OpenBCB-Signature' => 'invalid-signature',
        ]);

        $response->assertStatus(401);
        $response->assertJson([
            'errors' => ['signature' => ['Invalid webhook signature']],
        ]);
    }

    // ─── Documenso Webhook Tests ────────────────────────────────────────────

    public function test_documenso_webhook_with_valid_signature_signs_contract_and_triggers_payment(): void
    {
        // Create a sent contract with a documenso document ID
        $sentContract = Contract::factory()->sent()->create([
            'project_id' => $this->project->id,
            'quote_snapshot' => [
                'product_type_name' => 'Landing Page',
                'price_usd' => 1500.00,
                'estimated_days_min' => 10,
                'estimated_days_max' => 20,
                'modifiers' => [],
                'technologies' => [],
            ],
        ]);

        $payload = [
            'document_id' => $sentContract->documenso_document_id,
            'event' => 'document.signed',
        ];

        $apiToken = config('services.documenso.api_token');
        $body = json_encode($payload);
        $expectedSignature = hash_hmac('sha256', $body, $apiToken);

        $response = $this->postJson('/api/v1/webhooks/documenso', $payload, [
            'X-Documenso-Signature' => $expectedSignature,
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                'contract',
                'project',
                'payment',
            ],
        ]);

        // Contract should now be signed
        $this->assertEquals('signed', $response->json('data.contract.status'));
        $this->assertNotNull($response->json('data.contract.signed_at'));

        // Project should have a confirmed_delivery_date
        $this->assertNotNull($response->json('data.project.confirmed_delivery_date'));

        // Payment should have been created
        $this->assertEquals('pending', $response->json('data.payment.status'));
        $this->assertEquals(1500.00, (float) $response->json('data.payment.amount_usd'));
    }

    public function test_documenso_webhook_with_invalid_signature_returns_401(): void
    {
        $response = $this->postJson('/api/v1/webhooks/documenso', [
            'document_id' => 'some-doc-id',
        ], [
            'X-Documenso-Signature' => 'invalid-signature',
        ]);

        $response->assertStatus(401);
        $response->assertJson([
            'errors' => ['signature' => ['Invalid webhook signature']],
        ]);
    }

    public function test_documenso_webhook_is_idempotent_for_already_signed_contract(): void
    {
        // Create a signed contract
        $signedContract = Contract::factory()->signed()->create([
            'project_id' => $this->project->id,
        ]);

        $payload = [
            'document_id' => $signedContract->documenso_document_id,
            'event' => 'document.signed',
        ];

        $apiToken = config('services.documenso.api_token');
        $body = json_encode($payload);
        $expectedSignature = hash_hmac('sha256', $body, $apiToken);

        $response = $this->postJson('/api/v1/webhooks/documenso', $payload, [
            'X-Documenso-Signature' => $expectedSignature,
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'data' => ['message' => 'Contract was already marked as signed.'],
        ]);
    }

    public function test_documenso_webhook_returns_404_for_unknown_document(): void
    {
        $payload = [
            'document_id' => 'nonexistent-doc-id',
        ];

        $apiToken = config('services.documenso.api_token');
        $body = json_encode($payload);
        $expectedSignature = hash_hmac('sha256', $body, $apiToken);

        $response = $this->postJson('/api/v1/webhooks/documenso', $payload, [
            'X-Documenso-Signature' => $expectedSignature,
        ]);

        $response->assertStatus(404);
        $response->assertJson([
            'errors' => ['contract' => ['Contract not found for the given document ID.']],
        ]);
    }
}
