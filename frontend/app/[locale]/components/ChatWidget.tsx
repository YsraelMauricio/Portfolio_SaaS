'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { API_BASE, getAuthToken } from '@/app/lib/api';
import { listenToChatbotStream } from '@/app/lib/echo';

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

type EscalationPhase = null | 'channel' | 'summary' | 'confirming' | 'success';

type ChannelType = 'whatsapp' | 'telegram' | 'email';

/* -------------------------------------------------------------------------- */
/*  Icons (inline SVGs to avoid extra deps)                                    */
/* -------------------------------------------------------------------------- */

const icons = {
  chat: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  ),
  chevronDown: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  ),
  close: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  send: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" />
    </svg>
  ),
  spinner: (
    <svg className="w-5 h-5 motion-safe:animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  ),
  check: (
    <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  whatsapp: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  ),
  telegram: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  ),
  email: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
};

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

const CHANNEL_CONFIG: Record<ChannelType, { color: string; labelKey: string }> = {
  whatsapp: { color: 'bg-[#25D366] hover:bg-[#1ebe5d] text-white', labelKey: 'escalation.whatsapp' },
  telegram: { color: 'bg-[#0088cc] hover:bg-[#0077b5] text-white', labelKey: 'escalation.telegram' },
  email: { color: 'bg-zinc-500 hover:bg-zinc-600 text-white', labelKey: 'escalation.email' },
};

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function ChatWidget() {
  const t = useTranslations('Chatbot');

  /* ----- state ----- */
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Escalation
  const [escalationPhase, setEscalationPhase] = useState<EscalationPhase>(null);
  const [selectedChannel, setSelectedChannel] = useState<ChannelType | null>(null);
  const [summaryText, setSummaryText] = useState('');

  /* ----- refs ----- */
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const unsubscribeStreamRef = useRef<(() => void) | null>(null);
  const streamingMsgIdRef = useRef<string | null>(null);
  const conversationIdRef = useRef<number | null>(null); // keeps latest ID across closures

  // Respect reduced motion — initialized lazily to avoid setState in effect body
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => { setPrefersReducedMotion(e.matches); };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  /* ----- auto-scroll ----- */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  }, [messages, prefersReducedMotion]);

  /* ----- auto-focus input when chat opens ----- */
  useEffect(() => {
    if (isOpen && !isMinimized) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isMinimized]);

  /* ----- welcome message on first open ----- */
  const welcomeShownRef = useRef(false);

  useEffect(() => {
    if (isOpen && !isMinimized && !welcomeShownRef.current) {
      welcomeShownRef.current = true;
      setMessages([
        { id: crypto.randomUUID(), role: 'assistant', content: t('messages.welcome') },
      ]);
    }
    // Reset when fully closed
    if (!isOpen) {
      welcomeShownRef.current = false;
    }
  }, [isOpen, isMinimized, t]);

  /* ----- cleanup stream listener on unmount ----- */
  useEffect(() => {
    return () => {
      unsubscribeStreamRef.current?.();
    };
  }, []);

  /* ----- keep ref in sync ----- */
  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  /* ------------------------------------------------------------------------ */
  /*  Send message                                                             */
  /* ------------------------------------------------------------------------ */
  const handleSend = useCallback(async () => {
    const text = inputValue.trim();
    if (!text || isSending) return;

    setInputValue('');
    setError(null);

    const userMsgId = crypto.randomUUID();
    const assistantMsgId = crypto.randomUUID();

    // Show user message + streaming placeholder
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: 'user', content: text },
      { id: assistantMsgId, role: 'assistant', content: '', isStreaming: true },
    ]);

    setIsSending(true);
    streamingMsgIdRef.current = assistantMsgId;

    try {
      // Build request
      const body: Record<string, unknown> = { message: text };
      const cid = conversationIdRef.current;
      if (cid) body.conversation_id = cid;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };
      const token = getAuthToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${API_BASE}/chatbot/message`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.errors?.[0] || `HTTP ${response.status}`);
      }

      const responseData = await response.json();
      const newConvId: number | undefined =
        responseData.data?.conversation_id ?? responseData.conversation_id;

      if (newConvId && !conversationIdRef.current) {
        setConversationId(newConvId);
      }

      const activeConvId = newConvId ?? cid;

      if (activeConvId) {
        // Unsubscribe previous stream if any
        unsubscribeStreamRef.current?.();

        let accumulated = '';
        unsubscribeStreamRef.current = listenToChatbotStream(activeConvId, {
          onChunk: (chunk: string) => {
            accumulated += chunk;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMsgId
                  ? { ...msg, content: accumulated }
                  : msg,
              ),
            );
          },
          onComplete: () => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMsgId
                  ? { ...msg, isStreaming: false }
                  : msg,
              ),
            );
            setIsSending(false);
            streamingMsgIdRef.current = null;
            unsubscribeStreamRef.current = null;
          },
          onError: (errMsg: string) => {
            setError(errMsg);
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMsgId
                  ? { ...msg, content: errMsg || t('messages.error'), isStreaming: false }
                  : msg,
              ),
            );
            setIsSending(false);
            streamingMsgIdRef.current = null;
            unsubscribeStreamRef.current = null;
          },
        });
      } else {
        // No conversation ID — show error
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? { ...msg, content: t('messages.error'), isStreaming: false }
              : msg,
          ),
        );
        setIsSending(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages.error'));
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? { ...msg, content: t('messages.error'), isStreaming: false }
            : msg,
        ),
      );
      setIsSending(false);
      streamingMsgIdRef.current = null;
    }
  }, [inputValue, isSending, t]);

  /* ----- keyboard handler ----- */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  /* ------------------------------------------------------------------------ */
  /*  Escalation helpers                                                       */
  /* ------------------------------------------------------------------------ */
  const buildSummary = useCallback(
    () =>
      messages
        .filter((m) => m.role === 'user' || (m.role === 'assistant' && !m.isStreaming))
        .map((m) => `${m.role === 'user' ? 'User' : 'Índigo'}: ${m.content}`)
        .join('\n'),
    [messages],
  );

  const handleStartEscalation = useCallback(() => {
    setEscalationPhase('channel');
    setSummaryText(buildSummary());
  }, [buildSummary]);

  const handleChannelSelect = useCallback((channel: ChannelType) => {
    setSelectedChannel(channel);
    setEscalationPhase('summary');
  }, []);

  const handleCancelEscalation = useCallback(() => {
    setEscalationPhase(null);
    setSelectedChannel(null);
    setSummaryText('');
  }, []);

  const handleSendEscalation = useCallback(async () => {
    if (!selectedChannel) return;
    const cid = conversationIdRef.current;
    if (!cid) return;

    setEscalationPhase('confirming');
    setError(null);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };
      const token = getAuthToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${API_BASE}/chatbot/escalate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          conversation_id: cid,
          channel: selectedChannel,
          summary: summaryText,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.errors?.[0] || `HTTP ${response.status}`);
      }

      const responseData = await response.json();
      const link: string | undefined =
        responseData.data?.link ?? responseData.link;

      setEscalationPhase('success');

      // Open the link after a short delay
      setTimeout(() => {
        if (link) window.open(link, '_blank', 'noopener,noreferrer');
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Escalation failed');
      setEscalationPhase('summary'); // Go back to retry
    }
  }, [selectedChannel, summaryText]);

  /* ------------------------------------------------------------------------ */
  /*  Panel visibility helpers                                                 */
  /* ------------------------------------------------------------------------ */
  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setIsMinimized(false);
  }, []);

  const handleMinimize = useCallback(() => {
    setIsMinimized(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setIsMinimized(false);
    setEscalationPhase(null);
    setSelectedChannel(null);
    setSummaryText('');
    setError(null);
  }, []);

  /* ------------------------------------------------------------------------ */
  /*  Staggered bounce animation class (typing dots)                           */
  /* ------------------------------------------------------------------------ */
  const motionClass = prefersReducedMotion ? '' : 'animate-bounce';

  /* ------------------------------------------------------------------------ */
  /*  Floating button (closed state)                                           */
  /* ------------------------------------------------------------------------ */
  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={handleOpen}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-primary text-white rounded-full shadow-lg hover:brightness-110 transition-all flex items-center justify-center"
        aria-label={t('chat.open')}
      >
        {icons.chat}
      </button>
    );
  }

  /* ------------------------------------------------------------------------ */
  /*  Chat panel                                                               */
  /* ------------------------------------------------------------------------ */
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <div
        className={`
          glass-card flex flex-col overflow-hidden
          motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-in-out
          ${isMinimized ? 'w-72 h-14' : 'w-[calc(100vw-1.5rem)] sm:w-[380px]'}
        `}
        style={
          isMinimized
            ? undefined
            : { height: 'min(500px, calc(100vh - 7rem))' }
        }
      >
        {/* ---- Header ---- */}
        <div className="flex items-center justify-between px-4 py-3 bg-primary text-white shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="relative flex w-2 h-2 shrink-0">
              <span className="absolute inline-flex w-full h-full rounded-full bg-green-400 opacity-75 motion-safe:animate-ping" />
              <span className="relative inline-flex w-2 h-2 rounded-full bg-green-400" />
            </span>
            <span className="font-medium text-sm truncate">{t('chat.title')}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleMinimize}
              className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
              aria-label={t('chat.minimize')}
            >
              {icons.chevronDown}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
              aria-label={t('chat.close')}
            >
              {icons.close}
            </button>
          </div>
        </div>

        {/* ---- Body (hidden when minimized) ---- */}
        {!isMinimized && (
          <>
            {/* Messages view (normal chat) */}
            {escalationPhase === null && (
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-primary text-white rounded-br-md'
                          : 'glass-card--light text-text rounded-bl-md'
                      }`}
                    >
                      <span className="font-medium text-xs text-inherit opacity-60 block mb-0.5">
                        {msg.role === 'user' ? t('messages.you') : t('messages.assistant')}
                      </span>

                      {msg.content}

                      {msg.isStreaming && (
                        <span className="inline-flex gap-0.5 ml-1">
                          <span
                            className={`w-1.5 h-1.5 bg-text-muted rounded-full ${motionClass}`}
                            style={{ animationDelay: '0ms' }}
                          />
                          <span
                            className={`w-1.5 h-1.5 bg-text-muted rounded-full ${motionClass}`}
                            style={{ animationDelay: '150ms' }}
                          />
                          <span
                            className={`w-1.5 h-1.5 bg-text-muted rounded-full ${motionClass}`}
                            style={{ animationDelay: '300ms' }}
                          />
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {/* Typing indicator (before stream starts) */}
                {isSending && !messages.some((m) => m.isStreaming) && (
                  <div className="flex justify-start">
                    <div className="glass-card--light rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex gap-1">
                        <span
                          className={`w-2 h-2 bg-text-muted rounded-full ${motionClass}`}
                          style={{ animationDelay: '0ms' }}
                        />
                        <span
                          className={`w-2 h-2 bg-text-muted rounded-full ${motionClass}`}
                          style={{ animationDelay: '150ms' }}
                        />
                        <span
                          className={`w-2 h-2 bg-text-muted rounded-full ${motionClass}`}
                          style={{ animationDelay: '300ms' }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Error banner */}
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2 text-xs text-red-600 dark:text-red-400">
                    {error}
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Escalation view */}
            {escalationPhase === 'channel' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="text-center">
                  <p className="text-sm font-medium text-text">
                    {t('escalation.title')}
                  </p>
                  <p className="text-xs text-text-muted mt-1">
                    {t('escalation.description')}
                  </p>
                </div>

                <div className="space-y-2">
                  {(Object.keys(CHANNEL_CONFIG) as ChannelType[]).map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => handleChannelSelect(ch)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${CHANNEL_CONFIG[ch].color}`}
                    >
                      {icons[ch]}
                      {t(CHANNEL_CONFIG[ch].labelKey)}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleCancelEscalation}
                  className="w-full text-center text-xs text-text-muted hover:text-text py-2 transition-colors"
                >
                  {t('escalation.cancel')}
                </button>
              </div>
            )}

            {escalationPhase === 'summary' && selectedChannel && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="text-center">
                  <p className="text-sm font-medium text-text">
                    {t('escalation.title')}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">
                    {t('escalation.summary_label')}
                  </label>
                  <textarea
                    value={summaryText}
                    onChange={(e) => setSummaryText(e.target.value)}
                    rows={8}
                    className="w-full rounded-xl glass-card--light text-text resize-none focus:outline-none focus:ring-2 focus:ring-accent/50"
                  />
                </div>

                  <button
                    type="button"
                    onClick={handleSendEscalation}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium bg-accent text-[#1E1B2E] hover:brightness-110 transition-all"
                  >
                  {t('escalation.send_button', {
                    channel: t(`escalation.${selectedChannel}`),
                  })}
                </button>

                <button
                  type="button"
                  onClick={() => setEscalationPhase('channel')}
                  className="w-full text-center text-xs text-text-muted hover:text-text py-2 motion-safe:transition-colors"
                >
                  {t('escalation.cancel')}
                </button>
              </div>
            )}

            {escalationPhase === 'confirming' && selectedChannel && (
              <div className="flex-1 flex flex-col items-center justify-center p-4 text-center space-y-3">
                <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full motion-safe:animate-spin" />
                <p className="text-sm text-text-muted">
                  {t('escalation.success', {
                    channel: t(`escalation.${selectedChannel}`),
                  })}
                </p>
              </div>
            )}

            {escalationPhase === 'success' && selectedChannel && (
              <div className="flex-1 flex flex-col items-center justify-center p-4 text-center space-y-3">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  {icons.check}
                </div>
                <div>
                  <p className="text-sm font-medium text-text">
                    {t('escalation.success', {
                      channel: t(`escalation.${selectedChannel}`),
                    })}
                  </p>
                  <p className="text-xs text-text-muted mt-1">
                    {t('escalation.admin_notified')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="text-xs text-primary hover:underline mt-2"
                >
                  {t('chat.close')}
                </button>
              </div>
            )}

            {/* ---- Input area (only in normal chat mode) ---- */}
            {escalationPhase === null && (
              <div className="border-t border-[var(--glass-border)] p-3 shrink-0">
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t('chat.input_placeholder')}
                    disabled={isSending}
                    className="flex-1 px-4 py-2.5 text-sm rounded-xl glass-card--light text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isSending}
                    className="p-2.5 bg-accent text-[#1E1B2E] rounded-xl hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    aria-label={isSending ? t('chat.sending') : t('chat.send')}
                  >
                    {isSending ? icons.spinner : icons.send}
                  </button>
                </div>

                {/* Talk to Ysrael */}
                <button
                  type="button"
                  onClick={handleStartEscalation}
                  className="w-full mt-2 py-2 text-xs font-medium text-text-muted hover:text-primary transition-colors"
                >
                  {t('escalation.title')}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
