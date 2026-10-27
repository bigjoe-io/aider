import { ArrowRight, BookOpen, Bot, MessageSquare, Rocket } from 'lucide-react'
import { DOCS_GROUPS, getAllDocs } from '@/docs/registry'
import { DocLink } from '@/components/docs/DocsChrome'
import { Callout } from '@/components/ui'

const CARDS = [
  { slug: 'quickstart', title: 'Quickstart', text: 'Your first agent payment in 5 steps, about 10 minutes.', icon: Rocket },
  { slug: 'use-with-claude', title: 'Use it with Claude', text: 'What to say to Claude Code, and what agents can pay for.', icon: MessageSquare },
  { slug: 'quickstart-owners', title: 'Owner guide', text: 'Add money, add agents, approve, revoke and withdraw in the app.', icon: BookOpen },
  { slug: 'quickstart-agents', title: 'Agent guide', text: 'Install aidr, connect and pay from the terminal.', icon: Bot },
]

export default function DocsHome() {
  const pages = getAllDocs()
  return (
    <div className="max-w-[880px] py-10 lg:py-12">
      <p className="text-sm text-accent">Overview</p>
      <h1 className="mt-3 text-[clamp(2.25rem,4.5vw,3.25rem)] font-light leading-[1.05] tracking-[-0.035em] text-fg">Aider docs</h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-fg-2">
        Aider is a USDC wallet for AI agents on Arc. You keep the money; each agent gets its own key with limits. These docs cover setting it up,
        how every rule works, and the exact commands and contract functions.
      </p>
      <Callout tone="tip" className="mt-8" title="For AI agents">
        <p>
          Read <a href="/llms.txt">/llms.txt</a> for an index of every page, or <a href="/llms-full.txt">/llms-full.txt</a> for all of them in one
          file. The agent instructions are at <a href="/skill.md">/skill.md</a>.
        </p>
      </Callout>

      <div className="mt-10 grid gap-3 sm:grid-cols-2">
        {CARDS.map((c) => (
          <DocLink key={c.slug} slug={c.slug} className="group flex flex-col rounded-[20px] border border-line bg-surface p-6 transition-colors hover:border-line-strong">
            <c.icon className="size-5 text-fg-2" />
            <span className="mt-10 text-lg text-fg">{c.title}</span>
            <span className="mt-1.5 text-[15px] leading-relaxed text-fg-2">{c.text}</span>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm text-fg">
              Read <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </DocLink>
        ))}
      </div>

      <div className="mt-16 grid gap-10 sm:grid-cols-2">
        {DOCS_GROUPS.map((g) => (
          <section key={g}>
            <h2 className="label">{g}</h2>
            <ul className="mt-4 space-y-3">
              {pages
                .filter((p) => p.group === g)
                .map((p) => (
                  <li key={p.slug}>
                    <DocLink slug={p.slug} className="text-[15px] text-fg hover:underline">
                      {p.title}
                    </DocLink>
                    <p className="mt-0.5 text-sm leading-relaxed text-fg-3">{p.summary}</p>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
