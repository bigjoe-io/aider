import { useEffect, useRef, useState, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
  delay?: number; // ms
}

/** Fades + slides child in when it enters the viewport. Respects prefers-reduced-motion. */
export function InView({ children, className = '', delay = 0 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
        transition: `opacity 0.4s ease ${delay}ms, transform 0.4s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
