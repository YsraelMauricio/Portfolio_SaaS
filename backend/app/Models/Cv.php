<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Cv extends Model implements HasMedia
{
    use InteractsWithMedia;

    protected $fillable = [
        'id',
    ];

    /**
     * Register the media collections for this model.
     */
    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('cv')->singleFile();
    }
}
