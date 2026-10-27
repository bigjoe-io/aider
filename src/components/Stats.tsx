import { useEffect, useState } from 'react';
import { fetchLiveStats, formatUsdcCents, type LiveStats } from '../lib/contract';
import { InView } from './InView';

const STATS: { key: keyof LiveStats; label: string; format: (v: number) => string }[] = [
  { key: 'agentsConnected',  label: 'Agents connected',    format: (v) => v.toLocaleString() },
  { key: 'agentPayments',    label: 'Agent payments',      format: (v) => v.toLocaleString() },
  { key: 'usdcMovedCents',   label: 'USDC moved by agents',format: formatUsdcCents },
  { key: 'approvalsHandled', label: 'Approvals handled',   format: (v) => v.toLocaleString() },
];

export function Stats() {
  const [data, setData] = useState<LiveStats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchLiveStats()
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="border-y border-[var(--border)] bg-[var(--surface-muted)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <InView>
          <p className="text-xs uppercase tracking-widest text-[var(--subtle)] text-center mb-8">
            Live · Arc Testnet
          </p>
        </InView>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {STATS.map(({ key, label, format }, i) => (
            <InView key={key} delay={i * 60} className="text-center">
              <div
                className="font-display text-3xl sm:text-4xl font-bold text-[var(--ink)] tabular-nums mb-1"
                style={{ letterSpacing: '-0.03em' }}
              >
                {error ? (
                  <span className="text-[var(--subtle)]">—</span>
                ) : data === null ? (
                  <span className="inline-block w-16 h-9 rounded bg-[var(--border)] animate-pulse" />
                ) : (
                  format(data[key])
                )}
              </div>
              <div className="text-sm text-[var(--muted)]">{label}</div>
            </InView>
          ))}
        </div>
      </div>
    </section>
  );
}
