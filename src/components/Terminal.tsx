import { useEffect, useRef, useState } from 'react';
import { InView } from './InView';

interface Line {
  text: string;
  type: 'command' | 'success' | 'pending' | 'error' | 'info';
  pauseAfter?: number; // ms to pause after this line completes
}

const SCRIPT: Line[] = [
  { text: '$ aidr pay 0x8f3…a21 0.05 "API credits"',               type: 'command',  pauseAfter: 400 },
  { text: '✓ Paid $0.05 · within limits · tx 0x4c1…e9b',           type: 'success',  pauseAfter: 1200 },
  { text: '$ aidr pay 0x8f3…a21 1.00 "premium dataset"',            type: 'command',  pauseAfter: 400 },
  { text: '⏳ Over your $0.10 limit → approval request sent',       type: 'pending',  pauseAfter: 1600 },
  { text: '✓ Approved by owner · Paid $1.00 · tx 0x7aa…03d',       type: 'success',  pauseAfter: 1200 },
  { text: '$ aidr pay 0x8f3…a21 0.01 "retry"',                      type: 'command',  pauseAfter: 400 },
  { text: '✗ Blocked: this agent was revoked',                       type: 'error',    pauseAfter: 3000 },
];

const CHAR_DELAY = 28; // ms per character
const LINE_DELAY = 180; // ms pause before starting next line

function colorClass(type: Line['type']) {
  switch (type) {
    case 'command': return 'text-[var(--code-fg)]';
    case 'success': return 'text-[#4ade80]';
    case 'pending': return 'text-[#fbbf24]';
    case 'error':   return 'text-[#f87171]';
    default:        return 'text-[var(--code-fg)]/70';
  }
}

export function Terminal() {
  const [lines, setLines] = useState<{ text: string; type: Line['type'] }[]>([]);
  const [cursorVisible, setCursorVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check reduced-motion preference
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      // Batch the two state updates to avoid cascading renders
      setTimeout(() => {
        setLines(SCRIPT.map((l) => ({ text: l.text, type: l.type })));
        setCursorVisible(false);
      }, 0);
      return;
    }

    let cancelled = false;
    let lineIdx = 0;
    let charIdx = 0;

    async function tick() {
      if (cancelled) return;

      if (lineIdx >= SCRIPT.length) {
        // Pause then restart
        await sleep(2400);
        if (!cancelled) {
          setLines([]);
          lineIdx = 0;
          charIdx = 0;
          setTimeout(() => { void tick(); }, LINE_DELAY);
        }
        return;
      }

      const line = SCRIPT[lineIdx];

      if (charIdx === 0) {
        // Start new line
        setLines((prev) => [...prev, { text: '', type: line.type }]);
      }

      if (charIdx < line.text.length) {
        const ch = line.text[charIdx];
        charIdx++;
        setLines((prev) => {
          const next = [...prev];
          next[next.length - 1] = { text: next[next.length - 1].text + ch, type: line.type };
          return next;
        });
        // Scroll to bottom
        requestAnimationFrame(() => {
          if (containerRef.current) containerRef.current.scrollTop = containerRef.current.scrollHeight;
        });
        setTimeout(() => { void tick(); }, CHAR_DELAY);
      } else {
        // Line complete
        const pause = line.pauseAfter ?? 0;
        charIdx = 0;
        lineIdx++;
        setTimeout(() => { void tick(); }, LINE_DELAY + pause);
      }
    }

    setTimeout(() => { void tick(); }, 600);
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
      <InView>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-display text-xl font-semibold text-[var(--ink)]">Example session</h2>
          <p className="text-xs text-[var(--subtle)]">Hashes are illustrative</p>
        </div>
      </InView>

      <InView delay={80}>
        <div
          className="rounded-xl overflow-hidden border border-[var(--border-strong)] shadow-sm"
          style={{ background: 'var(--code-bg)' }}
        >
          {/* Title bar */}
          <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/10">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
            <span className="ml-2 text-xs text-white/30 font-mono">agent terminal</span>
          </div>

          {/* Body */}
          <div
            ref={containerRef}
            className="font-mono text-sm p-5 min-h-[200px] max-h-[320px] overflow-y-auto thin-scroll space-y-1.5"
          >
            {lines.map((l, i) => (
              <div key={i} className={`${colorClass(l.type)} leading-relaxed break-all`}>
                {l.text}
                {i === lines.length - 1 && cursorVisible && (
                  <span className="cursor-blink ml-0.5 inline-block w-[2px] h-[1em] align-middle bg-[var(--code-fg)]" />
                )}
              </div>
            ))}
            {lines.length === 0 && (
              <span className="text-white/20">
                <span className="cursor-blink inline-block w-[2px] h-[1em] align-middle bg-white/20" />
              </span>
            )}
          </div>
        </div>
      </InView>
    </section>
  );
}

function sleep(ms: number) { return new Promise<void>((r) => setTimeout(r, ms)); }
