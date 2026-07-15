<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OAuthProvider extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'provider',
        'provider_id',
        'provider_avatar_url',
    ];

    /**
     * Get the user that owns this OAuth provider link.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
