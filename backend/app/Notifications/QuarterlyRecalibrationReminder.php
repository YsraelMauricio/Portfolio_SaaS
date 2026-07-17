<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class QuarterlyRecalibrationReminder extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * The number of delivered projects available for recalibration analysis.
     */
    protected int $availableProjects;

    /**
     * The total number of delivered projects (excluding scope changes).
     */
    protected int $totalDeliveredProjects;

    /**
     * Create a new notification instance.
     */
    public function __construct(int $availableProjects, int $totalDeliveredProjects)
    {
        $this->availableProjects = $availableProjects;
        $this->totalDeliveredProjects = $totalDeliveredProjects;
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
        return (new MailMessage)
            ->subject('Quarterly Recalibration Reminder — Review Your Quote Estimates')
            ->greeting('Hi Ysrael,')
            ->line('It\'s time for your quarterly recalibration review!')
            ->line("There are **{$this->availableProjects}** delivered projects available for analysis out of **{$this->totalDeliveredProjects}** total delivered projects.")
            ->action('Review Recalibration Data', url('/admin/dashboard/recalibration'))
            ->line('This quarterly review helps keep your quote estimates accurate by comparing quoted vs actual project data.')
            ->line('Projects with scope changes are automatically excluded from the comparison.')
            ->line('This is an automated alert from Portfolio_SaaS.');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'available_projects' => $this->availableProjects,
            'total_delivered_projects' => $this->totalDeliveredProjects,
        ];
    }
}
