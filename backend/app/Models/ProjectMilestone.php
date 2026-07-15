<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectMilestone extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'name',
        'estimated_date',
        'completed_date',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'estimated_date' => 'date',
            'completed_date' => 'date',
        ];
    }

    /**
     * Get the project this milestone belongs to.
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
