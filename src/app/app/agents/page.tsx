'use client'

import { Suspense } from 'react'
import { AgentsPage } from '@/components/app/Agents'

export default function Page() {
  // AgentsPage reads the connect link from the query string.
  return (
    <Suspense>
      <AgentsPage />
    </Suspense>
  )
}
