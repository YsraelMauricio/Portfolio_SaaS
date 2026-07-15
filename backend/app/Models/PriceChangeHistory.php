<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class PriceChangeHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'changeable_type',
        'changeable_id',
        'old_value',
        'new_value',
        'reason',
        'admin_id',
    ];

    /**
     * Get the parent changeable model (modifier or product type).
     */
    public function changeable(): MorphTo
    {
        return $this->morphTo();
    }
}
