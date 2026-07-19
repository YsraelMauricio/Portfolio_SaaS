<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MaintenancePlan extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'monthly_price_usd',
        'annual_price_usd',
        'included_hours_month',
        'response_time_hours',
        'active',
    ];

    protected function casts(): array
    {
        return [
            'monthly_price_usd' => 'decimal:2',
            'annual_price_usd' => 'decimal:2',
            'included_hours_month' => 'integer',
            'response_time_hours' => 'integer',
            'active' => 'boolean',
        ];
    }
}
