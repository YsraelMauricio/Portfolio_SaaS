<?php

namespace App\Notifications;

use App\Models\ChatbotConversation;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AdminEscalationNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * The chatbot conversation that was escalated.
     */
    protected ChatbotConversation $conversation;

    /**
     * The escalation link (WhatsApp / Telegram / mailto).
     */
    protected string $escalationLink;

    /**
     * Create a new notification instance.
     */
    public function __construct(ChatbotConversation $conversation, string $escalationLink)
    {
        $this->conversation = $conversation;
        $this->escalationLink = $escalationLink;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $conversation = $this->conversation;

        $mailMessage = (new MailMessage)
            ->subject('🚀 Chatbot Escalation — Conversation #'.$conversation->id)
            ->greeting('Conversation #'.$conversation->id)
            ->line('The client chose to escalate via: **'.ucfirst($conversation->escalation_channel).'**')
            ->line('**Summary:**')
            ->line($conversation->escalation_summary ?: 'No summary provided.')
            ->action('Open Conversation', $this->escalationLink);

        // Client info
        if ($conversation->user_id && $conversation->relationLoaded('user') && $conversation->user) {
            $mailMessage->line('**Client:** '.$conversation->user->name.' ('.$conversation->user->email.')');
        } else {
            $mailMessage->line('**Client:** Anonymous visitor');
        }

        $mailMessage->line('This is an automated alert from Portfolio_SaaS.');

        return $mailMessage;
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'conversation_id' => $this->conversation->id,
            'escalation_channel' => $this->conversation->escalation_channel,
            'escalation_summary' => $this->conversation->escalation_summary,
            'escalation_link' => $this->escalationLink,
        ];
    }
}
