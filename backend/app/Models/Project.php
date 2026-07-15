<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Project extends Model
{
    use HasFactory;

    protected $fillable = [
        'quote_id',
        'user_id',
        'status',
        'actual_start_date',
        'confirmed_delivery_date',
        'actual_delivery_date',
        'paused_days',
        'scope_changed',
        'is_test',
    ];

    protected function casts(): array
    {
        return [
            'actual_start_date' => 'date',
            'confirmed_delivery_date' => 'date',
            'actual_delivery_date' => 'date',
            'scope_changed' => 'boolean',
            'is_test' => 'boolean',
        ];
    }

    /**
     * Get the project owner.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the milestones for this project.
     */
    public function milestones(): HasMany
    {
        return $this->hasMany(ProjectMilestone::class);
    }

    /**
     * Get the contracts for this project.
     */
    public function contracts(): HasMany
    {
        return $this->hasMany(Contract::class);
    }
}
