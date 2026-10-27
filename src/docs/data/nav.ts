export interface DocPage {
  slug: string;       // URL segment: /docs/<slug>
  title: string;
  summary: string;
  section: string;
}

export const DOC_SECTIONS = [
  'Get started',
  'Core concepts',
  'Security',
  'Reference',
] as const;

export const DOC_PAGES: DocPage[] = [
  // ── Get started ─────────────────────────────────────────────────────────────
  {
    slug: '',
    title: 'Aider documentation',
    summary: 'USDC wallets for AI agents on Arc — spending limits, approval flows, instant revoke.',
    section: 'Get started',
  },
  {
    slug: 'introduction',
    title: 'Introduction',
    summary: 'What Aider is, who it is for, and the problem it solves.',
    section: 'Get started',
  },
  {
    slug: 'quickstart-owners',
    title: 'Quickstart for owners',
    summary: 'Create a wallet, deposit USDC, and add an agent with limits.',
    section: 'Get started',
  },
  {
    slug: 'quickstart-agents',
    title: 'Quickstart for agents',
    summary: 'Install aidr, configure it, and make your first payment.',
    section: 'Get started',
  },
  {
    slug: 'how-it-works',
    title: 'How it works',
    summary: 'The contract, where funds live, and the life of a payment.',
    section: 'Get started',
  },
  // ── Core concepts ────────────────────────────────────────────────────────────
  {
    slug: 'agent-payments',
    title: 'Agent payments',
    summary: 'What agentPay checks, in order, and what each failure means.',
    section: 'Core concepts',
  },
  {
    slug: 'approval-requests',
    title: 'Approval requests',
    summary: 'Over-limit payments, fund reservation, approve/reject/expire.',
    section: 'Core concepts',
  },
  {
    slug: 'spending-rules',
    title: 'Spending rules',
    summary: 'Every rule — type, default, example, and how to change it.',
    section: 'Core concepts',
  },
  {
    slug: 'revoke-and-pause',
    title: 'Revoking and pausing',
    summary: 'Revoke one agent or stop every agent at once.',
    section: 'Core concepts',
  },
  {
    slug: 'agent-to-agent',
    title: 'Agent-to-agent payments',
    summary: 'One agent paying another agent\'s wallet directly.',
    section: 'Core concepts',
  },
  {
    slug: 'watching-activity',
    title: 'Watching activity',
    summary: 'Contract events, what each contains, and how to listen.',
    section: 'Core concepts',
  },
  // ── Security ─────────────────────────────────────────────────────────────────
  {
    slug: 'security-model',
    title: 'Security model',
    summary: 'What a leaked key can and cannot do, and what the owner must protect.',
    section: 'Security',
  },
  {
    slug: 'errors',
    title: 'Errors',
    summary: 'Every contract error, the CLI message, and what to do.',
    section: 'Security',
  },
  {
    slug: 'best-practices',
    title: 'Best practices',
    summary: 'Limits, memos, history checks, unused agents, and idle funds.',
    section: 'Security',
  },
  // ── Reference ────────────────────────────────────────────────────────────────
  {
    slug: 'cli-reference',
    title: 'CLI reference',
    summary: 'Every aidr command: usage, flags, and JSON output.',
    section: 'Reference',
  },
  {
    slug: 'skill-md',
    title: 'SKILL.md',
    summary: 'The full skill file for AI coding agents.',
    section: 'Reference',
  },
  {
    slug: 'contract-reference',
    title: 'Contract reference',
    summary: 'Every function, view, event, and error in the Aider contract.',
    section: 'Reference',
  },
  {
    slug: 'glossary',
    title: 'Glossary',
    summary: 'Owner, agent, wallet, limit, approval request, reservation, and more.',
    section: 'Reference',
  },
];

// Lookup helpers
export const PAGE_BY_SLUG = Object.fromEntries(DOC_PAGES.map((p) => [p.slug, p]));

export function prevNext(slug: string): { prev: DocPage | null; next: DocPage | null } {
  // exclude the home page (empty slug) from prev/next
  const pages = DOC_PAGES.filter((p) => p.slug !== '');
  const idx = pages.findIndex((p) => p.slug === slug);
  return {
    prev: idx > 0 ? pages[idx - 1] : null,
    next: idx >= 0 && idx < pages.length - 1 ? pages[idx + 1] : null,
  };
}
