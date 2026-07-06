'use client';

import { useRef, useState } from 'react';
import { Sparkles, Send, Loader2 } from 'lucide-react';
import type { Vehicle } from '@/types/vehicle';
import { VehicleCard } from '@/components/vehicle/vehicle-card';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  text: string;
  vehicles?: Vehicle[];
}

const SUGGESTIONS = [
  'SUV për familje deri në 40 mijë €',
  'Veturë elektrike me autonomi të gjatë',
  'Sedan sportiv me mbi 300 kuaj fuqi',
  'Diçka ekonomike me naftë',
];

const GREETING =
  'Përshëndetje! Unë jam asistenti i AUTO CONNECT. Më tregoni çfarë kërkoni — buxhetin, tipin e veturës, karburantin ose përdorimin — dhe do t’ju rekomandoj veturat më të përshtatshme nga inventari ynë.';

export function AssistantChat() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: GREETING },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setMessages((m) => [...m, { role: 'user', text: trimmed }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = await res.json();
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          text: data.message ?? 'Më vjen keq, diçka shkoi keq.',
          vehicles: data.vehicles ?? [],
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: 'assistant', text: 'Ndodhi një gabim. Ju lutem provoni përsëri.' },
      ]);
    } finally {
      setLoading(false);
      requestAnimationFrame(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
      });
    }
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-3xl border border-surface-border bg-white shadow-card">
      <div className="flex items-center gap-3 border-b border-surface-border bg-white px-6 py-4">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-ink text-white">
          <Sparkles className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-ink">Asistenti AUTO CONNECT</p>
          <p className="text-xs text-emerald-600">Online · përgjigje në sekonda</p>
        </div>
      </div>

      <div ref={listRef} className="flex max-h-[520px] min-h-[360px] flex-col gap-5 overflow-y-auto bg-surface-subtle p-6">
        {messages.map((m, i) => (
          <div key={i} className={cn('flex flex-col gap-3', m.role === 'user' && 'items-end')}>
            <div
              className={cn(
                'max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-relaxed',
                m.role === 'user'
                  ? 'bg-ink text-white'
                  : 'border border-surface-border bg-white text-ink-soft',
              )}
            >
              {m.text}
            </div>
            {m.vehicles && m.vehicles.length > 0 ? (
              <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {m.vehicles.map((v) => (
                  <VehicleCard key={v.id} vehicle={v} />
                ))}
              </div>
            ) : null}
          </div>
        ))}
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-ink-muted">
            <Loader2 className="h-4 w-4 animate-spin" /> Duke menduar…
          </div>
        ) : null}
      </div>

      {messages.length <= 1 ? (
        <div className="flex flex-wrap gap-2 border-t border-surface-border bg-white px-6 py-4">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              className="rounded-full border border-surface-border px-3.5 py-2 text-xs text-ink-muted transition-colors hover:border-ink/30 hover:text-ink"
            >
              {s}
            </button>
          ))}
        </div>
      ) : null}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-3 border-t border-surface-border bg-white px-4 py-4"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Shkruani kërkesën tuaj…"
          className="h-11 flex-1 rounded-full border border-surface-border bg-surface-subtle px-4 text-sm focus:border-ink/30 focus:outline-none focus:ring-2 focus:ring-brand/40"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          aria-label="Dërgo"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand text-white transition-colors hover:bg-brand-600 disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
