<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class Payment extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia;

    protected $fillable = [
        'project_id',
        'contract_id',
        'amount_usd',
        'method',
        'local_currency',
        'amount_local',
        'exchange_rate_used',
        'exchange_rate_overridden_by_admin_id',
        'provider_transaction_id',
        'webhook_signature_verified',
        'status',
        'proof_media_id',
        'confirmed_by_admin_id',
        'paid_at',
        'is_test',
    ];

    protected function casts(): array
    {
        return [
            'amount_usd' => 'decimal:2',
            'amount_local' => 'decimal:2',
            'exchange_rate_used' => 'decimal:4',
            'webhook_signature_verified' => 'boolean',
            'is_test' => 'boolean',
            'paid_at' => 'datetime',
        ];
    }

    /**
     * Register the media collections for this model.
     */
    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('payment_proof');
    }

    /**
     * Get the project this payment belongs to.
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Get the contract this payment is for.
     */
    public function contract(): BelongsTo
    {
        return $this->belongsTo(Contract::class);
    }

    /**
     * Get the admin who overrode the exchange rate for this payment.
     */
    public function exchangeRateOverriddenByAdmin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'exchange_rate_overridden_by_admin_id');
    }

    /**
     * Get the admin who confirmed this payment (bank transfers).
     */
    public function confirmedByAdmin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'confirmed_by_admin_id');
    }

    /**
     * Get the media proof file for this payment (bank transfers).
     */
    public function proof(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'proof_media_id');
    }
}
