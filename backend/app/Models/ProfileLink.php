<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProfileLink extends Model
{
    protected $fillable = [
        'key',
        'url',
        'visible',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'visible' => 'boolean',
        ];
    }
}
