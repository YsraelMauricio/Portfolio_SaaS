<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Testimonial extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_name',
        'company_role',
        'content',
        'rating',
        'project_id',
        'avatar_media_id',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'rating' => 'integer',
        ];
    }

    /**
     * Get the project associated with this testimonial.
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Get the avatar media.
     */
    public function avatar(): BelongsTo
    {
        return $this->belongsTo(config('media-library.media_model'), 'avatar_media_id');
    }
}
