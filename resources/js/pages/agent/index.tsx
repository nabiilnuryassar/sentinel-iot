import { Head, usePage } from '@inertiajs/react';
import {
    BrainCircuit,
    Check,
    Copy,
    RefreshCw,
    Send,
    Sparkles,
    Square,
    User,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { MarkdownView } from '@/components/markdown-view';
import { PageHeader } from '@/components/page-header';
import { StatusPill } from '@/components/status-pill';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AppLayout } from '@/layouts/app-layout';
import { formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { PageProps } from '@/types';

interface AgentMessageRow {
    id: number;
    prompt: string;
    response: string | null;
    source: string;
    metadata_json: Record<string, unknown> | null;
    created_at: string | null;
}

interface AgentIndexProps {
    messages: AgentMessageRow[];
    stream_url: string;
}

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    state: 'pending' | 'streaming' | 'complete' | 'error';
    createdAt: string;
    error?: string;
    activeTool?: string | null;
}

const QUICK_PROMPTS = [
    'What is the current risk level?',
    'Show open incidents from the last 24 hours.',
    'Audit the MQTT broker and report findings.',
    'Recommend mitigation for unauthorized publishes.',
] as const;

export default function AgentIndex({ messages, stream_url }: AgentIndexProps) {
    const page = usePage<PageProps>();
    const csrfToken = useMemo(() => readCsrfToken(), []);

    const initialChat = useMemo<ChatMessage[]>(
        () => buildHistoryChat(messages),
        [messages],
    );

    const [chat, setChat] = useState<ChatMessage[]>(initialChat);
    const lastHistorySigRef = useRef(historySignature(messages));
    const [prompt, setPrompt] = useState('');
    const [streaming, setStreaming] = useState(false);
    const abortRef = useRef<AbortController | null>(null);
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    useEffect(() => {
        // Reset state when Inertia re-renders the page with new history.
        const sig = historySignature(messages);

        if (lastHistorySigRef.current === sig) {
            return;
        }

        lastHistorySigRef.current = sig;
        setChat(initialChat);
    }, [messages, initialChat]);

    useEffect(() => {
        const node = scrollRef.current;

        if (!node) {
return;
}

        node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' });
    }, [chat]);

    useEffect(() => {
        // Auto-grow textarea up to 6 lines.
        const el = textareaRef.current;

        if (!el) {
return;
}

        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, 192)}px`;
    }, [prompt]);

    const send = async (text: string) => {
        const trimmed = text.trim();

        if (!trimmed || streaming) {
return;
}

        const userId = `u-${Date.now()}`;
        const assistantId = `a-${Date.now()}`;

        setChat((prev) => [
            ...prev,
            {
                id: userId,
                role: 'user',
                content: trimmed,
                state: 'complete',
                createdAt: new Date().toISOString(),
            },
            {
                id: assistantId,
                role: 'assistant',
                content: '',
                state: 'pending',
                createdAt: new Date().toISOString(),
            },
        ]);
        setPrompt('');
        setStreaming(true);

        const controller = new AbortController();
        abortRef.current = controller;

        try {
            const response = await fetch(stream_url, {
                method: 'POST',
                signal: controller.signal,
                credentials: 'same-origin',
                headers: {
                    Accept: 'text/event-stream',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
                },
                body: JSON.stringify({ prompt: trimmed }),
            });

            if (!response.ok || !response.body) {
                throw new Error(`HTTP ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { value, done } = await reader.read();

                if (done) {
break;
}

                buffer += decoder.decode(value, { stream: true });

                const events = buffer.split('\n\n');
                buffer = events.pop() ?? '';

                for (const raw of events) {
                    const line = raw.replace(/^data:\s*/, '').trim();

                    if (!line || line === '[DONE]') {
continue;
}

                    let payload: SsePayload;

                    try {
                        payload = JSON.parse(line) as SsePayload;
                    } catch {
                        continue;
                    }

                    setChat((prev) =>
                        prev.map((m) => {
                            if (m.id !== assistantId) {
return m;
}

                            switch (payload.type) {
                                case 'start':
                                    return { ...m, state: 'streaming' };
                                case 'delta':
                                    return {
                                        ...m,
                                        state: 'streaming',
                                        content: m.content + (payload.content ?? ''),
                                    };
                                case 'tool':
                                    return {
                                        ...m,
                                        activeTool:
                                            payload.phase === 'result'
                                                ? null
                                                : (payload.name ?? null),
                                    };
                                case 'turn_end':
                                    return { ...m, activeTool: null };
                                case 'end':
                                    return {
                                        ...m,
                                        state: 'complete',
                                        activeTool: null,
                                        content:
                                            (payload.text ?? '').trim() !== ''
                                                ? payload.text!
                                                : m.content,
                                    };
                                case 'error':
                                    return {
                                        ...m,
                                        state: 'error',
                                        error:
                                            payload.message ??
                                            'Agent run failed.',
                                    };
                                default:
                                    return m;
                            }
                        }),
                    );
                }
            }

            setChat((prev) =>
                prev.map((m) =>
                    m.id === assistantId && m.state === 'streaming'
                        ? { ...m, state: 'complete', activeTool: null }
                        : m,
                ),
            );

            // History pane stays in sync from local chat state — no Inertia
            // reload, no per-prompt round trip. Closes WORKLOG.md S2.
        } catch (e) {
            const aborted = (e as Error)?.name === 'AbortError';
            setChat((prev) =>
                prev.map((m) =>
                    m.id === assistantId
                        ? {
                              ...m,
                              state: aborted ? 'complete' : 'error',
                              error: aborted ? undefined : 'Agent stream failed.',
                              activeTool: null,
                          }
                        : m,
                ),
            );

            if (!aborted) {
                toast.error('Agent request failed.');
            }
        } finally {
            abortRef.current = null;
            setStreaming(false);
        }
    };

    const stop = () => {
        abortRef.current?.abort();
    };

    const regenerate = () => {
        const lastUser = [...chat].reverse().find((m) => m.role === 'user');

        if (!lastUser) {
return;
}

        // Remove last assistant turn and re-send the user prompt.
        setChat((prev) => {
            const lastAssistantIdx = prev.map((m) => m.role).lastIndexOf('assistant');

            if (lastAssistantIdx === -1) {
return prev;
}

            return prev.slice(0, lastAssistantIdx);
        });
        void send(lastUser.content);
    };

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        void send(prompt);
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            void send(prompt);
        }
    };

    const flashError = (page.props.errors as Record<string, string> | undefined)?.prompt;

    return (
        <AppLayout>
            <Head title="Agent" />
            <div className="flex min-h-[calc(100vh-7rem)] flex-col gap-4 lg:gap-5">
                <PageHeader
                    title="AI Agent / ChatOps"
                    subtitle="OpenClaw · Hermes-style Agent"
                    actions={<StatusPill status="online" />}
                />

                <div className="grid flex-1 gap-4 lg:grid-cols-[1fr_18rem]">
                    <section
                        aria-label="Conversation"
                        className="flex min-h-[60vh] flex-col overflow-hidden rounded-2xl border border-border/80 bg-card/60 backdrop-blur"
                    >
                        <header className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3">
                            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                <BrainCircuit
                                    aria-hidden
                                    className="size-4 text-primary"
                                />
                                soc.agent · session
                            </div>
                            <span className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-emerald-300">
                                ●  online
                            </span>
                        </header>

                        <div
                            ref={scrollRef}
                            className="flex-1 space-y-5 overflow-y-auto px-3 py-5 sm:px-6"
                        >
                            {chat.length === 0 ? (
                                <EmptyState onPick={(p) => void send(p)} />
                            ) : (
                                chat.map((message) => (
                                    <ChatBubble
                                        key={message.id}
                                        message={message}
                                    />
                                ))
                            )}
                        </div>

                        <form
                            onSubmit={onSubmit}
                            className="flex flex-col gap-2 border-t border-border/70 bg-background/40 p-3 sm:p-4"
                        >
                            <Textarea
                                ref={textareaRef}
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                onKeyDown={onKeyDown}
                                placeholder="Ask the agent (Shift+Enter for newline)"
                                rows={2}
                                maxLength={2000}
                                disabled={streaming}
                                aria-label="Agent prompt"
                                className="max-h-48 min-h-[3.5rem] resize-none border-border/70 bg-background/60 font-mono text-sm focus-visible:border-primary/40"
                            />
                            {flashError ? (
                                <p className="text-xs text-rose-300">
                                    {flashError}
                                </p>
                            ) : null}
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex flex-wrap gap-2">
                                    {QUICK_PROMPTS.map((q) => (
                                        <button
                                            key={q}
                                            type="button"
                                            disabled={streaming}
                                            onClick={() => setPrompt(q)}
                                            className="rounded-full border border-border/70 bg-background/40 px-3 py-1 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-muted-foreground transition hover:border-primary/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex items-center gap-2">
                                    {chat.some((m) => m.role === 'assistant') ? (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={regenerate}
                                            disabled={streaming}
                                            className="text-muted-foreground"
                                            aria-label="Regenerate last response"
                                        >
                                            <RefreshCw
                                                aria-hidden
                                                className="size-3.5"
                                            />
                                            Regenerate
                                        </Button>
                                    ) : null}
                                    {streaming ? (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={stop}
                                            className="border-rose-400/40 bg-rose-500/10 text-rose-200 hover:bg-rose-500/15"
                                        >
                                            <Square
                                                aria-hidden
                                                className="size-3.5"
                                            />
                                            Stop
                                        </Button>
                                    ) : (
                                        <Button
                                            type="submit"
                                            size="sm"
                                            disabled={prompt.trim() === ''}
                                            className="font-mono uppercase tracking-widest"
                                        >
                                            <Send
                                                aria-hidden
                                                className="size-3.5"
                                            />
                                            Send
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </form>
                    </section>

                    <aside className="flex flex-col gap-3 lg:max-h-[calc(100vh-12rem)]">
                        <div className="rounded-2xl border border-border/80 bg-card/60 p-4 backdrop-blur">
                            <h2 className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                <Sparkles
                                    aria-hidden
                                    className="size-3.5 text-primary"
                                />
                                Capabilities
                            </h2>
                            <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                                <li>· Telemetry + anomaly inspection</li>
                                <li>· Security event triage</li>
                                <li>· MQTT broker audit</li>
                                <li>· Mitigation recommendations</li>
                                <li>· Incident report drafting</li>
                            </ul>
                        </div>

                        <div className="flex-1 overflow-hidden rounded-2xl border border-border/80 bg-card/60 backdrop-blur">
                            <header className="flex items-center justify-between gap-2 border-b border-border/70 px-4 py-3">
                                <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                    History
                                </h2>
                                <span className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                                    {messages.length} prior
                                </span>
                            </header>
                            <div className="max-h-[50vh] space-y-3 overflow-y-auto px-3 py-3 lg:max-h-none">
                                {messages.length === 0 ? (
                                    <p className="px-1 text-xs text-muted-foreground">
                                        No prior conversations.
                                    </p>
                                ) : (
                                    messages.slice(0, 12).map((m) => (
                                        <button
                                            key={m.id}
                                            type="button"
                                            onClick={() => setPrompt(m.prompt)}
                                            className="block w-full rounded-xl border border-border/70 bg-background/35 p-3 text-left transition hover:border-primary/40"
                                        >
                                            <div className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                                                {formatDateTime(m.created_at)} · {m.source}
                                            </div>
                                            <div className="mt-1 truncate text-xs text-foreground">
                                                {m.prompt}
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </AppLayout>
    );
}

function ChatBubble({ message }: { message: ChatMessage }) {
    const isUser = message.role === 'user';
    const [copied, setCopied] = useState(false);

    const onCopy = async () => {
        try {
            await navigator.clipboard.writeText(message.content);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            toast.error('Copy failed.');
        }
    };

    return (
        <div
            className={cn(
                'flex w-full gap-3',
                isUser ? 'justify-end' : 'justify-start',
            )}
        >
            {!isUser ? (
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
                    <BrainCircuit aria-hidden className="size-4" />
                </span>
            ) : null}
            <div
                className={cn(
                    'group max-w-[85%] rounded-2xl border px-4 py-3 text-sm leading-relaxed shadow-sm sm:max-w-[78%]',
                    isUser
                        ? 'border-primary/30 bg-primary/12 text-foreground'
                        : 'border-border/70 bg-background/55 backdrop-blur',
                )}
            >
                {isUser ? (
                    <p className="whitespace-pre-wrap font-mono text-sm">
                        {message.content}
                    </p>
                ) : message.state === 'pending' && message.content === '' ? (
                    <TypingIndicator />
                ) : (
                    <>
                        {message.activeTool ? (
                            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-primary">
                                <span className="size-1.5 animate-pulse rounded-full bg-primary" />
                                tool · {message.activeTool}
                            </div>
                        ) : null}
                        {message.content !== '' ? (
                            <MarkdownView content={message.content} />
                        ) : message.state === 'streaming' ? (
                            <TypingIndicator />
                        ) : null}
                        {message.state === 'streaming' &&
                        message.content !== '' ? (
                            <span
                                aria-hidden
                                className="ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 animate-pulse bg-primary"
                            />
                        ) : null}
                        {message.state === 'error' ? (
                            <p className="mt-1 text-xs text-rose-300">
                                {message.error}
                            </p>
                        ) : null}
                    </>
                )}

                {!isUser && message.state === 'complete' && message.content ? (
                    <div className="mt-2 flex items-center gap-2 opacity-0 transition group-hover:opacity-100">
                        <button
                            type="button"
                            onClick={onCopy}
                            className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-background/40 px-2 py-0.5 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground transition hover:text-foreground"
                            aria-label="Copy response"
                        >
                            {copied ? (
                                <Check
                                    aria-hidden
                                    className="size-3 text-primary"
                                />
                            ) : (
                                <Copy aria-hidden className="size-3" />
                            )}
                            {copied ? 'Copied' : 'Copy'}
                        </button>
                    </div>
                ) : null}
            </div>
            {isUser ? (
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl border border-border/70 bg-background/40 text-muted-foreground">
                    <User aria-hidden className="size-4" />
                </span>
            ) : null}
        </div>
    );
}

function TypingIndicator() {
    return (
        <span
            aria-label="Agent is typing"
            className="inline-flex items-center gap-1"
        >
            {[0, 1, 2].map((i) => (
                <span
                    key={i}
                    className="size-1.5 animate-bounce rounded-full bg-primary"
                    style={{ animationDelay: `${i * 120}ms` }}
                />
            ))}
        </span>
    );
}

function EmptyState({ onPick }: { onPick: (prompt: string) => void }) {
    return (
        <div className="mx-auto flex max-w-xl flex-col items-center gap-4 py-10 text-center">
            <span className="grid size-12 place-items-center rounded-2xl border border-primary/30 bg-primary/10 text-primary shadow-[0_0_24px_rgba(31,230,208,0.18)]">
                <BrainCircuit aria-hidden className="size-6" />
            </span>
            <div className="space-y-1">
                <h2 className="font-mono text-base uppercase tracking-[0.2em]">
                    OpenClaw is listening
                </h2>
                <p className="text-sm text-muted-foreground">
                    Ask anything about devices, telemetry, security events, or
                    incidents. Use Shift+Enter for newlines.
                </p>
            </div>
            <div className="grid w-full gap-2 sm:grid-cols-2">
                {QUICK_PROMPTS.map((q) => (
                    <button
                        key={q}
                        type="button"
                        onClick={() => onPick(q)}
                        className="rounded-xl border border-border/70 bg-background/40 px-3 py-3 text-left text-sm transition hover:border-primary/40"
                    >
                        {q}
                    </button>
                ))}
            </div>
        </div>
    );
}

function historySignature(messages: AgentMessageRow[]): string {
    return messages.map((m) => `${m.id}:${m.response ? 1 : 0}`).join(',');
}

function buildHistoryChat(messages: AgentMessageRow[]): ChatMessage[] {
    // Latest first from the API; reverse so the oldest renders at the top.
    const ordered = [...messages].reverse();
    const out: ChatMessage[] = [];

    ordered.forEach((m) => {
        out.push({
            id: `h-u-${m.id}`,
            role: 'user',
            content: m.prompt,
            state: 'complete',
            createdAt: m.created_at ?? new Date().toISOString(),
        });

        if (m.response) {
            out.push({
                id: `h-a-${m.id}`,
                role: 'assistant',
                content: m.response,
                state: 'complete',
                createdAt: m.created_at ?? new Date().toISOString(),
            });
        }
    });

    return out;
}

function readCsrfToken(): string | null {
    if (typeof document === 'undefined') {
return null;
}

    const meta = document.querySelector<HTMLMetaElement>(
        'meta[name="csrf-token"]',
    );

    return meta?.content ?? null;
}

interface SsePayload {
    type:
        | 'start'
        | 'delta'
        | 'tool'
        | 'turn_end'
        | 'end'
        | 'error';
    content?: string;
    text?: string;
    name?: string;
    phase?: 'call' | 'result';
    conversation_id?: string | null;
    invocation_id?: string;
    duration_ms?: number;
    message?: string;
}
