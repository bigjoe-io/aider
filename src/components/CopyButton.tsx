import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface Props {
  text: string;
  className?: string;
  label?: string;
}

export function CopyButton({ text, className = '', label }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <button
      onClick={handleCopy}
      aria-label={copied ? 'Copied' : (label ?? 'Copy to clipboard')}
      className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md border transition-colors
        border-[var(--border-strong)] text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--ink)]
        focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${className}`}
    >
      {copied ? (
        <><Check size={13} className="text-[var(--success)]" /> Copied</>
      ) : (
        <><Copy size={13} /> {label ?? 'Copy'}</>
      )}
    </button>
  );
}
