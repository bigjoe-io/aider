import { useState, type ReactNode } from 'react';
import { Check, Copy } from 'lucide-react';

interface Tab { label: string; content: string }

interface Props {
  children?: string;
  tabs?: Tab[];
  language?: string;
  filename?: string;
}

export function CodeBlock({ children, tabs, language = '', filename }: Props) {
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);

  const text = tabs ? tabs[activeTab].content : (children ?? '');

  const handleCopy = () => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  };

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-[var(--border-strong)] text-sm" style={{ background: 'var(--code-bg)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 min-h-[36px]">
        <div className="flex items-center gap-3">
          {filename && (
            <span className="font-mono text-xs text-white/40">{filename}</span>
          )}
          {tabs && tabs.map((t, i) => (
            <button
              key={t.label}
              onClick={() => setActiveTab(i)}
              className={`text-xs px-2 py-0.5 rounded transition-colors ${
                i === activeTab
                  ? 'bg-white/15 text-white/90'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {t.label}
            </button>
          ))}
          {!tabs && language && (
            <span className="text-xs text-white/30 font-mono">{language}</span>
          )}
        </div>
        <button
          onClick={handleCopy}
          aria-label={copied ? 'Copied' : 'Copy code'}
          className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/80 transition-colors px-2 py-0.5 rounded hover:bg-white/10"
        >
          {copied ? <><Check size={12} className="text-green-400" /> Copied</> : <><Copy size={12} /> Copy</>}
        </button>
      </div>
      {/* Body */}
      <pre className="p-4 overflow-x-auto leading-relaxed font-mono text-[var(--code-fg)] whitespace-pre">
        <code>{text}</code>
      </pre>
    </div>
  );
}

/** Inline code span */
export function Code({ children }: { children: ReactNode }) {
  return (
    <code className="font-mono text-[0.875em] px-1.5 py-0.5 rounded bg-[var(--surface-muted)] border border-[var(--border)] text-[var(--ink-2)]">
      {children}
    </code>
  );
}
