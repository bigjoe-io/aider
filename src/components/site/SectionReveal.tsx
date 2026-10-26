'use client'

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

const TAGS = { div: motion.div, section: motion.section, li: motion.li, article: motion.article } as const

/**
 * Fade-up on scroll (y 14 → 0, 0.6 s, easeOut, once). Honours reduced motion through the root
 * <MotionConfig reducedMotion="user">.
 */
export function SectionReveal({
  children,
  className,
  delay = 0,
  as = 'div',
  id,
}: {
  children: ReactNode
  className?: string
  delay?: number
  as?: 'div' | 'section' | 'li' | 'article'
  id?: string
}) {
  const Comp = TAGS[as]
  return (
    <Comp
      id={id}
      className={className}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration: 0.6, ease: 'easeOut', delay }}
    >
      {children}
    </Comp>
  )
}
