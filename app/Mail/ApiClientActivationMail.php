<?php

namespace App\Mail;

use App\Models\ApiClient;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ApiClientActivationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public ApiClient $client,
        public string $activationUrl,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Activa tu cuenta API',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.api-client-activation',
        );
    }
}
