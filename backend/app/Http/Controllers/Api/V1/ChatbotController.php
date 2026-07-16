<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ChatbotConversation;
use App\Notifications\AdminEscalationNotification;
use App\Services\Chatbot\ChatbotService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;

class ChatbotController extends Controller
{
    /**
     * Process a chatbot message.
     *
     * Creates a conversation if none exists (for anonymous visitors),
     * saves the user message, and triggers the AI service to generate
     * a streamed response via Reverb.
     */
    public function message(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'conversation_id' => ['nullable', 'integer', 'exists:chatbot_conversations,id'],
            'message' => ['required', 'string', 'max:2000'],
        ]);

        // Find or create the conversation
        if (! empty($validated['conversation_id'])) {
            $conversation = ChatbotConversation::findOrFail((int) $validated['conversation_id']);
        } else {
            $conversation = ChatbotConversation::create([
                'user_id' => $request->user()?->id,
                'session_id' => $request->header('X-Session-Id', (string) Str::uuid()),
                'status' => 'active',
            ]);
        }

        // Process the message (streams the AI response via Reverb)
        app(ChatbotService::class)->processMessage($conversation, $validated['message']);

        return response()->json([
            'data' => [
                'conversation_id' => $conversation->id,
                'status' => 'processing',
            ],
        ]);
    }

    /**
     * Escalate a chatbot conversation to a human channel.
     *
     * Summarizes the conversation using the AI SDK, saves the escalation
     * details, generates the appropriate link (WhatsApp / Telegram / email),
     * and fires an email notification to the admin.
     */
    public function escalate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'conversation_id' => ['required', 'integer', 'exists:chatbot_conversations,id'],
            'channel' => ['required', 'string', 'in:whatsapp,telegram,email'],
        ]);

        $conversation = ChatbotConversation::findOrFail((int) $validated['conversation_id']);

        // Summarize the conversation using the AI SDK
        $summary = app(ChatbotService::class)->summarizeConversation($conversation);

        // Save escalation details
        $conversation->escalation_summary = $summary;
        $conversation->escalation_channel = $validated['channel'];
        $conversation->status = 'escalated';
        $conversation->save();

        // Generate the escalation link based on channel
        $link = $this->generateEscalationLink($validated['channel'], $summary);

        // Fire email notification to the admin
        Notification::route('mail', config('app.admin_email', 'admin@example.com'))
            ->notify(new AdminEscalationNotification($conversation, $link));

        return response()->json([
            'data' => [
                'conversation_id' => $conversation->id,
                'status' => 'escalated',
                'link' => $link,
                'channel' => $validated['channel'],
            ],
        ]);
    }

    /**
     * Generate an escalation link for the given channel with the summary.
     */
    private function generateEscalationLink(string $channel, string $summary): string
    {
        $encodedSummary = rawurlencode($summary);

        return match ($channel) {
            'whatsapp' => 'https://wa.me/591XXXXXXXXX?text='.$encodedSummary,
            'telegram' => 'https://t.me/ysraelmauricio?text='.$encodedSummary,
            'email' => 'mailto:'.config('app.admin_email', 'admin@example.com').
                '?subject='.rawurlencode('Chatbot Escalation').
                '&body='.$encodedSummary,
            default => throw new \InvalidArgumentException("Unsupported channel: {$channel}"),
        };
    }
}
