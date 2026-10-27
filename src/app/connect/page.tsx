import { redirect } from 'next/navigation'

/** The link `aidr setup` prints. The Agents page opens the pre-filled Add agent form from it. */
export default async function ConnectPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams
  const q = new URLSearchParams()
  for (const key of ['agent', 'name', 'chain', 'contract']) {
    const v = params[key]
    if (typeof v === 'string') q.set(key, v)
  }
  redirect(`/app/agents?${q.toString()}`)
}
