<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UploadCVRequest;
use App\Models\Cv;
use Illuminate\Http\JsonResponse;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CVController extends Controller
{
    /**
     * Return CV metadata for the download card.
     *
     * GET /cv
     */
    public function metadata(): JsonResponse
    {
        $cv = $this->getCvModel();

        $media = $cv->getFirstMedia('cv');

        if (! $media) {
            return response()->json([
                'data' => null,
            ]);
        }

        return response()->json([
            'data' => [
                'file_name' => $media->file_name,
                'updated_at' => $media->updated_at,
                'size_bytes' => $media->size,
            ],
        ]);
    }

    /**
     * Serve the CV binary from media.
     *
     * GET /cv/download
     */
    public function download(): StreamedResponse|JsonResponse
    {
        $cv = $this->getCvModel();

        $media = $cv->getFirstMedia('cv');

        if (! $media) {
            return response()->json([
                'errors' => ['cv' => ['No CV file available.']],
            ], 404);
        }

        return $media->toResponse(request());
    }

    /**
     * Upload/replace the CV file.
     *
     * POST /admin/cv
     */
    public function upload(UploadCVRequest $request): JsonResponse
    {
        $cv = $this->getCvModel();

        // Clear existing CV files
        $cv->clearMediaCollection('cv');

        // Add the new file
        $media = $cv->addMediaFromRequest('file')
            ->usingName('cv')
            ->toMediaCollection('cv');

        return response()->json([
            'data' => [
                'id' => $media->id,
                'file_name' => $media->file_name,
                'size_bytes' => $media->size,
                'mime_type' => $media->mime_type,
                'updated_at' => $media->updated_at,
            ],
        ], 201);
    }

    /**
     * Get or create the singleton Cv model.
     */
    private function getCvModel(): Cv
    {
        return Cv::firstOrCreate(['id' => 1]);
    }
}
