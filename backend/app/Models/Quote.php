<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
        ];
    }

    /**
     * Get the user who owns this quote (nullable for anonymous visitors).
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
