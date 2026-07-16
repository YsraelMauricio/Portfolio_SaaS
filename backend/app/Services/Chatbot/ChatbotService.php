<?php

namespace App\Services\Chatbot;

use App\Events\ChatbotMessageStreamed;
use App\Models\ChatbotConversation;
use App\Models\ChatbotMessage;
use Illuminate\Support\Facades\Log;
use Laravel\Ai\Streaming\Events\TextDelta;

use function Laravel\Ai\agent;

class ChatbotService
{
    /**
     * System instructions for the AI assistant.
     */
    private const INSTRUCTIONS = 'You are Índigo, an AI assistant for Portfolio_SaaS, a software development agency. '.
        'You help visitors understand services (web, mobile, desktop apps, maintenance, technical support), '.
        'answer questions about pricing and process, and discuss technology choices. '.
        'Be concise, professional, and friendly. If you can\'t help or the visitor wants to talk to a human, '.
        'suggest they click the \'Talk to Ysrael\' button to escalate.';

    /**
     * The AI provider to use.
     */
    private const PROVIDER = 'groq';

    /**
     * The AI model to use.
     */
    private const MODEL = 'llama-3.3-70b-versatile';

    /**
     * Process a user message in a conversation, stream the AI response via Reverb,
     * and save the complete message.
     */
    public function processMessage(ChatbotConversation $conversation, string $userMessage): void
    {
        // 1. Save user message
        ChatbotMessage::create([
            'conversation_id' => $conversation->id,
            'role' => 'user',
            'content' => $userMessage,
        ]);

        // 2. Get conversation history (last 20 messages)
        $history = $conversation->messages()
            ->orderBy('created_at')
            ->limit(20)
            ->get()
            ->map(fn (ChatbotMessage $msg) => [
                'role' => $msg->role,
                'content' => $msg->content,
            ])
            ->toArray();

        // 3. Call Groq via AI SDK with streaming
        $fullResponse = '';

        try {
            $stream = agent(
                instructions: self::INSTRUCTIONS,
                messages: $history,
            )->stream(
                prompt: $userMessage,
                provider: self::PROVIDER,
                model: self::MODEL,
            );

            // Process each chunk and broadcast via Reverb
            foreach ($stream as $event) {
                if ($event instanceof TextDelta && ! empty($event->delta)) {
                    $fullResponse .= $event->delta;

                    broadcast(new ChatbotMessageStreamed(
                        conversationId: $conversation->id,
                        chunk: $event->delta,
                        final: false,
                    ));
                }
            }

            // Save complete assistant message
            if (! empty($fullResponse)) {
                ChatbotMessage::create([
                    'conversation_id' => $conversation->id,
                    'role' => 'assistant',
                    'content' => $fullResponse,
                ]);
            }

            // Broadcast final signal
            broadcast(new ChatbotMessageStreamed(
                conversationId: $conversation->id,
                chunk: '',
                final: true,
            ));
        } catch (\Exception $e) {
            Log::error('Chatbot AI error', [
                'conversation_id' => $conversation->id,
                'error' => $e->getMessage(),
            ]);

            // Broadcast error message
            broadcast(new ChatbotMessageStreamed(
                conversationId: $conversation->id,
                chunk: 'I apologize, but I encountered an error. Please try again or click "Talk to Ysrael" for immediate assistance.',
                final: true,
                error: true,
            ));
        }
    }

    /**
     * Summarize a conversation for escalation using the AI SDK.
     */
    public function summarizeConversation(ChatbotConversation $conversation): string
    {
        $history = $conversation->messages()
            ->orderBy('created_at')
            ->get()
            ->map(fn (ChatbotMessage $msg) => [
                'role' => $msg->role,
                'content' => $msg->content,
            ])
            ->toArray();

        try {
            $response = agent(
                instructions: 'Summarize this support conversation concisely for a human agent. '.
                    'Include the main topic, key questions asked, what the visitor needs help with, '.
                    'and any relevant context. Keep it under 300 words.',
                messages: $history,
            )->prompt(
                prompt: 'Please summarize the above conversation.',
                provider: self::PROVIDER,
                model: self::MODEL,
            );

            return (string) $response;
        } catch (\Exception $e) {
            Log::error('Chatbot summarization error', [
                'conversation_id' => $conversation->id,
                'error' => $e->getMessage(),
            ]);

            // Fallback summary using last few messages
            $recentMessages = collect($history)->take(-4);

            return 'Conversation summary unavailable due to AI error. Last '.
                min(4, $recentMessages->count()).' messages attached.';
        }
    }
}
