<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Contract extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'quote_snapshot',
        'status',
        'documenso_document_id',
        'generated_at',
        'approved_by_admin_at',
        'sent_at',
        'signed_at',
        'cancelled_at',
        'pdf_media_id',
        'is_test',
    ];

    protected function casts(): array
    {
        return [
            'quote_snapshot' => 'array',
            'generated_at' => 'datetime',
            'approved_by_admin_at' => 'datetime',
            'sent_at' => 'datetime',
            'signed_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'is_test' => 'boolean',
        ];
    }

    /**
     * Get the project this contract belongs to.
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
