import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

/** Horizontally scrollable table with hairline rows. */
export function Table({ className, wrapperClassName, ...rest }: HTMLAttributes<HTMLTableElement> & { wrapperClassName?: string }) {
  return (
    <div className={cn('w-full overflow-x-auto rounded-2xl border border-line', wrapperClassName)}>
      <table className={cn('w-full border-collapse text-left text-sm', className)} {...rest} />
    </div>
  )
}
export function THead({ className, ...rest }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn('bg-fg/[0.025]', className)} {...rest} />
}
export function TBody({ className, ...rest }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn('[&>tr:last-child]:border-0', className)} {...rest} />
}
export function TR({ className, ...rest }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn('border-b border-line', className)} {...rest} />
}
export function TH({ className, ...rest }: ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn('whitespace-nowrap px-4 py-3 text-[11px] font-medium uppercase tracking-[0.12em] text-fg-3', className)} {...rest} />
}
export function TD({ className, ...rest }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('px-4 py-3 align-top text-fg-2', className)} {...rest} />
}
