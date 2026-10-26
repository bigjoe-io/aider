import { cloneElement, isValidElement, type InputHTMLAttributes, type ReactElement, type ReactNode, type Ref, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export const inputClasses =
  'h-11 w-full rounded-xl border border-line-strong bg-surface-2 px-3.5 text-[15px] text-fg placeholder:text-fg-3 transition-colors hover:border-fg/25 focus:border-accent/70 focus:outline-none focus:ring-2 focus:ring-accent/25 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-danger/70 aria-[invalid=true]:focus:ring-danger/20'

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  /** Content inside the left edge (e.g. "$"). */
  prefix?: ReactNode
  /** Content inside the right edge (e.g. a Max button). */
  suffix?: ReactNode
  mono?: boolean
  ref?: Ref<HTMLInputElement>
}

/** Text input. With prefix/suffix it renders a wrapper; otherwise a bare <input>. */
export function Input({ className, prefix, suffix, mono, ref, ...rest }: InputProps) {
  const input = (
    <input
      ref={ref}
      className={cn(inputClasses, mono && 'mono-num text-[14px]', prefix !== undefined && 'pl-8', suffix !== undefined && 'pr-20', className)}
      {...rest}
    />
  )
  if (prefix === undefined && suffix === undefined) return input
  return (
    <div className="relative">
      {prefix !== undefined && (
        <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-[15px] text-fg-3">{prefix}</span>
      )}
      {input}
      {suffix !== undefined && <span className="absolute inset-y-0 right-1.5 flex items-center gap-1">{suffix}</span>}
    </div>
  )
}

export function Textarea({ className, ref, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { ref?: Ref<HTMLTextAreaElement> }) {
  return <textarea ref={ref} className={cn(inputClasses, 'h-auto min-h-[88px] py-2.5 leading-relaxed', className)} {...rest} />
}

export interface FieldProps {
  /** id of the control; also wires label/hint/error via aria attributes when the child is an element. */
  id: string
  label: ReactNode
  hint?: ReactNode
  error?: ReactNode
  /** Right side of the label row (e.g. "Balance: $12.00"). */
  aside?: ReactNode
  className?: string
  children: ReactNode
}

/** Label + control + hint + error. Injects id / aria-describedby / aria-invalid into a single child element. */
export function Field({ id, label, hint, error, aside, className, children }: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined
  const errId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errId].filter(Boolean).join(' ') || undefined
  const child = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
        id,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
      })
    : children
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[13px] font-medium text-fg">
          {label}
        </label>
        {aside && <span className="text-xs text-fg-3">{aside}</span>}
      </div>
      {child}
      {hint && !error && (
        <p id={hintId} className="text-xs leading-relaxed text-fg-3">
          {hint}
        </p>
      )}
      {error && (
        <p id={errId} role="alert" className="text-xs leading-relaxed text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
