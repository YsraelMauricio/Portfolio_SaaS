<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Quote extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'product_type_id',
        'estimated_price_min',
        'estimated_price_max',
        'estimated_days_min',
        'estimated_days_max',
        'currency',
        'status',
        'is_test',
        'locale',
    ];

    protected function casts(): array
    {
        return [
            'is_test' => 'boolean',
            'estimated_price_min' => 'decimal:2',
            'estimated_price_max' => 'decimal:2',
        ];
    }

    /**
     * Get the user who owns this quote (nullable for anonymous visitors).
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the product type associated with this quote.
     */
    public function productType(): BelongsTo
    {
        return $this->belongsTo(ProductType::class);
    }

    /**
     * The modifiers selected for this quote.
     */
    public function modifiers(): BelongsToMany
    {
        return $this->belongsToMany(Modifier::class, 'quote_modifiers');
    }
}
