<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductType extends Model
{
    use HasFactory;

    protected $fillable = [
        'service_category_id',
        'name',
        'slug',
        'base_price_usd',
        'base_days_min',
        'base_days_max',
        'is_floor_not_ceiling',
        'sort_order',
        'active',
    ];

    protected function casts(): array
    {
        return [
            'is_floor_not_ceiling' => 'boolean',
            'active' => 'boolean',
            'base_price_usd' => 'decimal:2',
        ];
    }

    /**
     * Get the category that owns this product type.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(ServiceCategory::class, 'service_category_id');
    }

    /**
     * Get the modifier groups for this product type.
     */
    public function modifierGroups(): HasMany
    {
        return $this->hasMany(ModifierGroup::class)->orderBy('sort_order');
    }

    /**
     * Scope a query to only include active product types.
     */
    public function scopeActive($query)
    {
        return $query->where('active', true);
    }
}
