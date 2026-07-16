<?php

use Illuminate\Support\Facades\Broadcast;

/**
 * Channel authorization for WebSockets (Reverb / Pusher).
 *
 * In environments where broadcasting is not configured (e.g., testing,
 * or local dev without WebSockets), Broadcast::channel() will attempt
 * to resolve the broadcast driver and fail if credentials are missing.
 * The try-catch below lets us gracefully skip channel registration.
 */
try {
    Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
        return (int) $user->id === (int) $id;
    });

    Broadcast::channel('chatbot.{conversationId}', function ($user, $conversationId) {
        return true; // Public channel — visitors without accounts can listen
    });
} catch (Throwable $e) {
    // Broadcasting is not configured or the driver is unavailable —
    // skip channel registration silently.
}
