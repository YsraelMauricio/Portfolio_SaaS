<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PortfolioProjectTranslation extends Model
{
    use HasFactory;

    protected $fillable = [
        'portfolio_project_id',
        'locale',
        'title',
        'description',
        'key_result',
    ];

    /**
     * Get the portfolio project that this translation belongs to.
     */
    public function portfolioProject(): BelongsTo
    {
        return $this->belongsTo(PortfolioProject::class);
    }
}
