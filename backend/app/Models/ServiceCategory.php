<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ServiceCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'bolivia_only',
        'sort_order',
        'active',
    ];

    protected function casts(): array
    {
        return [
            'bolivia_only' => 'boolean',
            'active' => 'boolean',
        ];
    }

    /**
     * Get the product types for this category.
     */
    public function productTypes(): HasMany
    {
        return $this->hasMany(ProductType::class)->orderBy('sort_order');
    }

    /**
     * Scope a query to only include active categories.
     */
    public function scopeActive($query)
    {
        return $query->where('active', true);
    }
}
