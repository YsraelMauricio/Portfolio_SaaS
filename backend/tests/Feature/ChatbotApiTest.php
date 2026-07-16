<?php

namespace Tests\Feature;

use App\Events\ChatbotMessageStreamed;
use App\Jobs\CloseStaleConversations;
use App\Models\ChatbotConversation;
use App\Models\ChatbotMessage;
use App\Models\User;
use App\Notifications\AdminEscalationNotification;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class ChatbotApiTest extends TestCase
{
    use LazilyRefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);

        $this->admin = User::factory()->create();
        $this->admin->assignRole('admin');

        // Fake Reverb broadcasting so tests don't need a real WebSocket server
        Event::fake([ChatbotMessageStreamed::class]);

        // Fake the Groq AI API calls so tests don't require a real API key.
        // The message endpoint uses streaming (SSE), while the escalate endpoint
        // uses a non-streaming prompt. We inspect the request body to distinguish:
        // if body contains "stream":true, respond with SSE; otherwise, JSON.
        Http::fake([
            'api.groq.com/*' => function (Request $request) {
                $body = $request->body();
                $isStreaming = str_contains($body, '"stream":true') || str_contains($body, '"stream": true');

                if ($isStreaming) {
                    return Http::response(
                        "data: {\"choices\":[{\"delta\":{\"content\":\"Hello! I am Índigo, your AI assistant.\"},\"finish_reason\":\"stop\"}]}\n\ndata: [DONE]\n\n",
                        200,
                        ['Content-Type' => 'text/event-stream'],
                    );
                }

                return Http::response([
                    'choices' => [
                        [
                            'message' => [
                                'content' => 'Client is asking about web development services.',
                            ],
                        ],
                    ],
                    'usage' => [
                        'prompt_tokens' => 50,
                        'completion_tokens' => 10,
                        'total_tokens' => 60,
                    ],
                ], 200);
            },
        ]);
    }

    // ────────────────────────────────────────────────────────────────────────
    //  Message endpoint: POST /api/v1/chatbot/message
    // ────────────────────────────────────────────────────────────────────────

    public function test_unauthenticated_user_can_start_conversation(): void
    {
        $response = $this->postJson('/api/v1/chatbot/message', [
            'message' => 'Hello',
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => ['conversation_id', 'status'],
        ]);
        $response->assertJsonPath('data.status', 'processing');

        $conversationId = $response->json('data.conversation_id');

        $this->assertDatabaseHas('chatbot_conversations', [
            'id' => $conversationId,
            'status' => 'active',
            'user_id' => null,
        ]);

        $this->assertDatabaseHas('chatbot_messages', [
            'conversation_id' => $conversationId,
            'role' => 'user',
            'content' => 'Hello',
        ]);
    }

    public function test_authenticated_user_can_start_conversation(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/v1/chatbot/message', [
                'message' => 'Hi',
            ]);

        $response->assertStatus(200);

        $conversationId = $response->json('data.conversation_id');

        $this->assertDatabaseHas('chatbot_conversations', [
            'id' => $conversationId,
            'user_id' => $user->id,
        ]);
    }

    public function test_can_continue_existing_conversation(): void
    {
        $conversation = ChatbotConversation::create([
            'session_id' => 'test-session-001',
            'status' => 'active',
        ]);

        ChatbotMessage::create([
            'conversation_id' => $conversation->id,
            'role' => 'user',
            'content' => 'First message',
        ]);

        $response = $this->postJson('/api/v1/chatbot/message', [
            'conversation_id' => $conversation->id,
            'message' => 'Follow up',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('data.conversation_id', $conversation->id);

        $this->assertEquals(
            2,
            ChatbotMessage::where('conversation_id', $conversation->id)
                ->where('role', 'user')
                ->count()
        );
    }

    public function test_returns_validation_error_for_non_existent_conversation(): void
    {
        $response = $this->postJson('/api/v1/chatbot/message', [
            'conversation_id' => 99999,
            'message' => 'test',
        ]);

        // The "exists" validation rule returns 422, not 404
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['conversation_id']);
    }

    public function test_validates_message_is_required(): void
    {
        $response = $this->postJson('/api/v1/chatbot/message', []);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['message']);
    }

    public function test_validates_message_max_length(): void
    {
        $response = $this->postJson('/api/v1/chatbot/message', [
            'message' => str_repeat('x', 2001),
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['message']);
    }

    // ────────────────────────────────────────────────────────────────────────
    //  Escalate endpoint: POST /api/v1/chatbot/escalate
    // ────────────────────────────────────────────────────────────────────────

    public function test_can_escalate_to_whatsapp(): void
    {
        Notification::fake();

        $conversation = ChatbotConversation::create([
            'session_id' => 'test-session-escalate-wa',
            'status' => 'active',
        ]);

        ChatbotMessage::create([
            'conversation_id' => $conversation->id,
            'role' => 'user',
            'content' => 'I need to speak to a human',
        ]);

        $response = $this->postJson('/api/v1/chatbot/escalate', [
            'conversation_id' => $conversation->id,
            'channel' => 'whatsapp',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('data.status', 'escalated');
        $response->assertJsonPath('data.channel', 'whatsapp');
        $this->assertStringStartsWith('https://wa.me/', $response->json('data.link'));

        $conversation->refresh();
        $this->assertSame('escalated', $conversation->status);
        $this->assertSame('whatsapp', $conversation->escalation_channel);
        $this->assertNotNull($conversation->escalation_summary);
    }

    public function test_can_escalate_to_telegram(): void
    {
        Notification::fake();

        $conversation = ChatbotConversation::create([
            'session_id' => 'test-session-escalate-tg',
            'status' => 'active',
        ]);

        ChatbotMessage::create([
            'conversation_id' => $conversation->id,
            'role' => 'user',
            'content' => 'Telegram support please',
        ]);

        $response = $this->postJson('/api/v1/chatbot/escalate', [
            'conversation_id' => $conversation->id,
            'channel' => 'telegram',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('data.status', 'escalated');
        $response->assertJsonPath('data.channel', 'telegram');
        $this->assertStringStartsWith('https://t.me/', $response->json('data.link'));

        $conversation->refresh();
        $this->assertSame('telegram', $conversation->escalation_channel);
    }

    public function test_can_escalate_to_email(): void
    {
        Notification::fake();

        $conversation = ChatbotConversation::create([
            'session_id' => 'test-session-escalate-em',
            'status' => 'active',
        ]);

        ChatbotMessage::create([
            'conversation_id' => $conversation->id,
            'role' => 'user',
            'content' => 'Email support please',
        ]);

        $response = $this->postJson('/api/v1/chatbot/escalate', [
            'conversation_id' => $conversation->id,
            'channel' => 'email',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('data.status', 'escalated');
        $response->assertJsonPath('data.channel', 'email');
        $this->assertStringStartsWith('mailto:', $response->json('data.link'));

        $conversation->refresh();
        $this->assertSame('email', $conversation->escalation_channel);
    }

    public function test_escalate_returns_validation_error_for_non_existent_conversation(): void
    {
        $response = $this->postJson('/api/v1/chatbot/escalate', [
            'conversation_id' => 99999,
            'channel' => 'whatsapp',
        ]);

        // The "exists" validation rule returns 422, not 404
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['conversation_id']);
    }

    public function test_escalate_validates_channel_is_required(): void
    {
        $conversation = ChatbotConversation::create([
            'session_id' => 'test-session-escalate-req',
            'status' => 'active',
        ]);

        $response = $this->postJson('/api/v1/chatbot/escalate', [
            'conversation_id' => $conversation->id,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['channel']);
    }

    public function test_escalate_validates_channel_is_valid(): void
    {
        $conversation = ChatbotConversation::create([
            'session_id' => 'test-session-escalate-valid',
            'status' => 'active',
        ]);

        $response = $this->postJson('/api/v1/chatbot/escalate', [
            'conversation_id' => $conversation->id,
            'channel' => 'invalid-channel',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['channel']);
    }

    // ────────────────────────────────────────────────────────────────────────
    //  CloseStaleConversations job
    // ────────────────────────────────────────────────────────────────────────

    public function test_closes_old_conversations_with_no_recent_messages(): void
    {
        $conversation = ChatbotConversation::create([
            'session_id' => 'stale-session',
            'status' => 'active',
        ]);

        // Create a message 48 hours ago — outside the 24-hour stale window
        $message = new ChatbotMessage([
            'conversation_id' => $conversation->id,
            'role' => 'user',
            'content' => 'Old message',
        ]);
        $message->created_at = now()->subHours(48);
        $message->save();

        (new CloseStaleConversations)->handle();

        $conversation->refresh();
        $this->assertSame('closed', $conversation->status);
    }

    public function test_keeps_conversations_with_recent_messages(): void
    {
        $conversation = ChatbotConversation::create([
            'session_id' => 'recent-session',
            'status' => 'active',
        ]);

        // Create a message 1 hour ago — within the 24-hour stale window
        $message = new ChatbotMessage([
            'conversation_id' => $conversation->id,
            'role' => 'user',
            'content' => 'Recent message',
        ]);
        $message->created_at = now()->subHour();
        $message->save();

        (new CloseStaleConversations)->handle();

        $conversation->refresh();
        $this->assertSame('active', $conversation->status);
    }

    public function test_skips_already_escalated_conversations(): void
    {
        $conversation = ChatbotConversation::create([
            'session_id' => 'escalated-session',
            'status' => 'escalated',
            'escalation_channel' => 'email',
            'escalation_summary' => 'Test summary',
        ]);

        // Old messages, but conversation is already escalated — should stay escalated
        $message = new ChatbotMessage([
            'conversation_id' => $conversation->id,
            'role' => 'user',
            'content' => 'Old escalated message',
        ]);
        $message->created_at = now()->subHours(48);
        $message->save();

        (new CloseStaleConversations)->handle();

        $conversation->refresh();
        $this->assertSame('escalated', $conversation->status);
    }

    // ────────────────────────────────────────────────────────────────────────
    //  AdminEscalationNotification
    // ────────────────────────────────────────────────────────────────────────

    public function test_admin_escalation_notification_contains_channel_and_conversation_id(): void
    {
        $conversation = ChatbotConversation::create([
            'session_id' => 'notification-test',
            'status' => 'escalated',
            'escalation_channel' => 'whatsapp',
            'escalation_summary' => 'Client needs help with web development.',
        ]);

        $link = 'https://wa.me/591XXXXXXXXX?text=Client%20needs%20help%20with%20web%20development.';

        $notification = new AdminEscalationNotification($conversation, $link);
        $mailMessage = $notification->toMail(new \stdClass);

        // Subject contains the conversation ID
        $this->assertStringContainsString((string) $conversation->id, $mailMessage->subject);

        // One of the intro lines mentions the escalation channel
        $introText = implode(' ', $mailMessage->introLines);
        $this->assertStringContainsString('Whatsapp', $introText);

        // The summary is included in the email body
        $this->assertStringContainsString(
            'Client needs help with web development.',
            $introText
        );
    }
}
