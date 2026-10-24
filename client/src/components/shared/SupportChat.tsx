import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Bot, MessageCircle, Send, Sparkles, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import type { NavSection } from '@/types';

interface ChatMessage {
  id: number;
  role: 'assistant' | 'user';
  text: string;
  action?: { label: string; section: NavSection };
}

function getReply(message: string, brandName: string, threatCount: number): Omit<ChatMessage, 'id' | 'role'> {
  const query = message.toLowerCase();

  if (/live|real.?time|real data|actual data|social media api|integration/.test(query)) {
    return {
      text: 'This hackathon demo does not connect to live social networks or app stores. Scans use a sample dataset, so results are for demonstration only and should not be treated as verified threats.',
    };
  }

  if (/scan|scanning|run.*check/.test(query)) {
    return {
      text: `Use “Scan Now” in the sidebar to run a scan. The demo analyzes its sample profiles and apps against the ${brandName} brand profile; it currently shows ${threatCount} detected item${threatCount === 1 ? '' : 's'}.`,
      action: { label: 'Open Overview', section: 'Overview' },
    };
  }

  if (/false positive|wrong|incorrect|dismiss|resolve|investigat/.test(query)) {
    return {
      text: 'Open a detection in Social Monitoring or App Monitoring to review its indicators, change its investigation status, or add analyst notes. Demo changes are saved in this browser only.',
      action: { label: 'Review social detections', section: 'Social Monitoring' },
    };
  }

  if (/brand|profile|domain|official account|publisher/.test(query)) {
    return {
      text: `You can update ${brandName}, official domains, accounts, apps, and known publishers in Brand Profile. Scans use this information to compare candidates with your registered assets.`,
      action: { label: 'Open Brand Profile', section: 'Brand Profile' },
    };
  }

  if (/report|export|csv|download/.test(query)) {
    return {
      text: 'The Reports section provides the demo reporting and export options. Report content reflects the sample/demo scan data currently stored in this browser.',
      action: { label: 'Open Reports', section: 'Reports' },
    };
  }

  if (/save|persist|data|storage|browser/.test(query)) {
    return {
      text: 'Brand profile, settings, and detections are stored in this browser’s local storage. They are not shared across browsers or users and may be cleared if browser data is removed.',
      action: { label: 'Open Settings', section: 'Settings' },
    };
  }

  if (/login|password|account|sign.?in|security/.test(query)) {
    return {
      text: 'This demo uses a lightweight local sign-in state, not production authentication. Do not enter real passwords or sensitive account details.',
    };
  }

  if (/risk|score|threat|indicator|detect/.test(query)) {
    return {
      text: 'Risk scores are heuristic demo estimates based on signals such as brand-name similarity, suspicious wording, verification status, and other indicators. They are not proof that an account or app is malicious; review evidence before taking action.',
      action: { label: 'Open Threat Intelligence', section: 'Threat Intelligence' },
    };
  }

  if (/help|what can you do|support/.test(query)) {
    return {
      text: 'I can guide you through scans, brand profile setup, detection review, reports, risk scores, and this demo’s data and deployment limitations. This support assistant uses a small built-in FAQ, not a live generative AI service.',
    };
  }

  return {
    text: 'I don’t have an answer for that in the demo FAQ yet. Try asking about running a scan, updating your brand profile, reviewing a detection, exporting reports, or whether monitoring uses live data.',
  };
}

export function SupportChat() {
  const { brandProfile, detections, setActiveSection } = useApp();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 0,
      role: 'assistant',
      text: `Hi! I’m the Trustguard demo support assistant. Ask me about scans, detections, reports, or setting up ${brandProfile.companyName}.`,
    },
  ]);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open]);

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const reply = getReply(trimmed, brandProfile.companyName, detections.filter((detection) => !detection.isOfficial).length);
    setMessages((current) => [
      ...current,
      { id: Date.now(), role: 'user', text: trimmed },
      { id: Date.now() + 1, role: 'assistant', ...reply },
    ]);
    setDraft('');
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sendMessage(draft);
  };

  return (
    <div className="fixed bottom-5 right-5 z-40">
      {open && (
        <section
          aria-label="Trustguard customer support chat"
          className="mb-3 flex h-[min(560px,calc(100vh-7rem))] w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/40"
        >
          <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400">
                <Bot size={21} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">Trustguard Support</h2>
                <p className="flex items-center gap-1 text-xs text-slate-400">
                  <Sparkles size={12} className="text-cyan-400" />
                  Demo assistant · FAQ-powered
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close support chat"
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            >
              <X size={18} />
            </button>
          </header>

          <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto p-4" aria-live="polite">
            {messages.map((message) => {
              const action = message.action;
              return (
                <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[88%] rounded-2xl px-3.5 py-3 text-sm leading-relaxed ${
                      message.role === 'user'
                        ? 'rounded-br-md bg-sky-600 text-white'
                        : 'rounded-bl-md border border-slate-700 bg-slate-800 text-slate-200'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.text}</p>
                    {action && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveSection(action.section);
                          setOpen(false);
                        }}
                        className="mt-3 rounded-lg border border-sky-400/30 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-300 transition-colors hover:bg-sky-500/20"
                      >
                        {action.label}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="flex items-end gap-2 border-t border-slate-800 p-3">
            <label className="sr-only" htmlFor="support-chat-message">Message support</label>
            <textarea
              id="support-chat-message"
              value={draft}
              onChange={(event) => setDraft(event.target.value.slice(0, 500))}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  sendMessage(draft);
                }
              }}
              placeholder="Ask a question..."
              rows={1}
              maxLength={500}
              className="max-h-24 min-h-11 flex-1 resize-y rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-500"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              aria-label="Send message"
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white transition-colors hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send size={17} />
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? 'Close support chat' : 'Open support chat'}
        aria-expanded={open}
        className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-sky-600 text-white shadow-lg shadow-sky-500/25 transition-transform hover:scale-105"
      >
        {open ? <X size={22} /> : <MessageCircle size={23} />}
      </button>
    </div>
  );
}
