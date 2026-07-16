<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class PortfolioProject extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia, SoftDeletes;

    protected $fillable = [
        'slug',
        'featured_image_media_id',
        'technologies',
        'demo_url',
        'repo_url',
        'is_this_platform',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'technologies' => 'array',
            'is_this_platform' => 'boolean',
        ];
    }

    /**
     * Get the translations for this portfolio project.
     */
    public function translations(): HasMany
    {
        return $this->hasMany(PortfolioProjectTranslation::class);
    }

    /**
     * Get the featured image media.
     */
    public function featuredImage(): BelongsTo
    {
        return $this->belongsTo(config('media-library.media_model'), 'featured_image_media_id');
    }

    /**
     * Register the media collections for this model.
     */
    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('featured_image')->singleFile();
    }
}
