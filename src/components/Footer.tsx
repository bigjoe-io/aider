import { LEASH_ADDRESS, EXPLORER_URL } from '../lib/contract';

const GITHUB = 'https://github.com/bigjoe-io/aider';

export function Footer() {
  const shortAddr = `${LEASH_ADDRESS.slice(0, 6)}…${LEASH_ADDRESS.slice(-4)}`;

  return (
    <footer className="border-t border-[var(--border)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[var(--subtle)]">
        {/* Left */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 justify-center sm:justify-start">
          <span>Built with Arc Studio on Arc</span>
          <span className="hidden sm:inline">·</span>
          <a
            href={`${EXPLORER_URL}/address/${LEASH_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs hover:text-[var(--ink)] transition-colors"
            aria-label="View contract on explorer"
          >
            {shortAddr}
          </a>
        </div>

        {/* Right */}
        <div className="flex items-center gap-4">
          <a
            href={GITHUB}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--ink)] transition-colors"
          >
            GitHub
          </a>
          <a
            href="https://x.com/YOUR_X_HANDLE"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--ink)] transition-colors"
          >
            X
          </a>
        </div>
      </div>
    </footer>
  );
}
