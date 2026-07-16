import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Make Pusher available globally for Laravel Echo
declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo: Echo<'reverb'>;
  }
}

/**
 * Get a public environment variable.
 * Next.js inlines process.env.NEXT_PUBLIC_* at build time.
 * Falls back to a default value when not set.
 */
function env(key: string, fallback: string): string {
  return (process.env[`NEXT_PUBLIC_REVERB_${key}`] as string | undefined)
    ?? (process.env[`VITE_REVERB_${key}`] as string | undefined)
    ?? fallback;
}

// Only initialize on the client side
let echoInstance: Echo<'reverb'> | null = null;

export function getEcho(): Echo<'reverb'> | null {
  if (typeof window === 'undefined') return null;

  if (!echoInstance) {
    window.Pusher = Pusher;

    echoInstance = new Echo<'reverb'>({
      broadcaster: 'reverb',
      key: env('APP_KEY', 'portfolio-reverb-key'),
      wsHost: env('HOST', 'localhost'),
      wsPort: parseInt(env('PORT', '8080'), 10),
      wssPort: parseInt(env('PORT', '443'), 10),
      forceTLS: env('SCHEME', 'http') === 'https',
      enabledTransports: ['ws', 'wss'],
    });

    window.Echo = echoInstance;
  }

  return echoInstance;
}

/**
 * Listen for streamed chatbot messages on a conversation channel.
 * Calls onChunk for each text chunk, onComplete when streaming finishes.
 * Returns an unsubscribe function.
 */
export function listenToChatbotStream(
  conversationId: number,
  callbacks: {
    onChunk: (chunk: string) => void;
    onComplete: () => void;
    onError?: (message: string) => void;
  }
): () => void {
  const echo = getEcho();
  if (!echo) return () => {};

  const channel = echo.channel(`chatbot.${conversationId}`);

  channel.listen('.message.streamed', (event: {
    conversationId: number;
    chunk: string;
    final: boolean;
    error: boolean;
  }) => {
    if (event.error && callbacks.onError) {
      callbacks.onError(event.chunk);
      return;
    }

    if (event.final) {
      callbacks.onComplete();
      return;
    }

    callbacks.onChunk(event.chunk);
  });

  // Return unsubscribe function
  return () => {
    channel.stopListening('.message.streamed');
    echo.leaveChannel(`chatbot.${conversationId}`);
  };
}
