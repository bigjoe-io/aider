import type { ReactNode } from 'react';

interface Props {
  headers: string[];
  rows: ReactNode[][];
  compact?: boolean;
}

export function Table({ headers, rows, compact }: Props) {
  return (
    <div className="my-4 w-full overflow-x-auto rounded-xl border border-[var(--border)]">
      <table className="w-full text-sm border-collapse min-w-[500px]">
        <thead>
          <tr className="bg-[var(--surface-muted)] border-b border-[var(--border)]">
            {headers.map((h) => (
              <th
                key={h}
                className={`text-left font-semibold text-[var(--ink)] px-4 ${compact ? 'py-2' : 'py-3'} whitespace-nowrap`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={`border-b border-[var(--border)] last:border-0 ${i % 2 === 1 ? 'bg-[var(--surface-muted)]/40' : ''}`}>
              {row.map((cell, j) => (
                <td key={j} className={`px-4 ${compact ? 'py-2' : 'py-3'} align-top text-[var(--ink-2)]`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
