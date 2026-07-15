<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ModifierGroup extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_type_id',
        'name',
        'allows_multiple',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'allows_multiple' => 'boolean',
        ];
    }

    /**
     * Get the product type that owns this modifier group (nullable for global groups).
     */
    public function productType(): BelongsTo
    {
        return $this->belongsTo(ProductType::class);
    }

    /**
     * Get the modifiers in this group.
     */
    public function modifiers(): HasMany
    {
        return $this->hasMany(Modifier::class)->orderBy('sort_order');
    }
}
