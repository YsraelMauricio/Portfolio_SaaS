<?php

namespace App\Jobs;

use App\Models\ChatbotConversation;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class CloseStaleConversations implements ShouldQueue, ShouldBeUnique
{
    use Dispatchable, Queueable;

    /**
     * Number of hours without activity before a conversation is considered stale.
     *
     * @var int
     */
    public static int $staleHours = 24;

    /**
     * The number of seconds the unique lock is kept — prevents overlapping runs.
     *
     * @var int
     */
    public int $uniqueFor = 3600;

    /**
     * Execute the job.
     *
     * Marks chatbot conversations with no activity in the last N hours as closed.
     * Only targets conversations in 'active' status.
     */
    public function handle(): void
    {
        $staleConversations = ChatbotConversation::where('status', 'active')
            ->whereDoesntHave('messages', function ($query) {
                $query->where('created_at', '>=', now()->subHours(static::$staleHours));
            })
            ->cursor();

        $count = 0;

        foreach ($staleConversations as $conversation) {
            /** @var ChatbotConversation $conversation */
            $conversation->status = 'closed';
            $conversation->save();
            $count++;
        }

        Log::info('CloseStaleConversations: closed {count} stale conversation(s).', [
            'count' => $count,
        ]);
    }
}
