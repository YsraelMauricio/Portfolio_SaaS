<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BlogPostTranslation extends Model
{
    use HasFactory;

    protected $fillable = [
        'blog_post_id',
        'locale',
        'title',
        'summary',
        'content',
        'meta_title',
        'meta_description',
    ];

    /**
     * Get the blog post that this translation belongs to.
     */
    public function blogPost(): BelongsTo
    {
        return $this->belongsTo(BlogPost::class);
    }
}
