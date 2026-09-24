import { useId } from 'react';

/* Small inline flags (3:2), shared by the language switcher and the market-price cards. */
export type Country = 'gb' | 'cz' | 'pl' | 'ua';

export function Flag({ of, className = '' }: { of: Country; className?: string }) {
  const id = useId(); // the Union Jack needs a clip path; ids must stay unique across instances
  const cls = ('flag ' + className).trim();
  switch (of) {
    case 'gb':
      return (
        <span className={cls}>
          <svg viewBox="0 0 24 16" aria-hidden="true">
            <clipPath id={id}>
              <path d="M12 8h12v8zv8H12zH0V8zV0h12z" />
            </clipPath>
            <rect width="24" height="16" fill="#012169" />
            <path d="M0 0l24 16M24 0L0 16" stroke="#fff" strokeWidth="3" />
            <path d="M0 0l24 16M24 0L0 16" clipPath={`url(#${id})`} stroke="#c8102e" strokeWidth="2" />
            <path d="M12 0v16M0 8h24" stroke="#fff" strokeWidth="5" />
            <path d="M12 0v16M0 8h24" stroke="#c8102e" strokeWidth="3" />
          </svg>
        </span>
      );
    case 'cz':
      return (
        <span className={cls}>
          <svg viewBox="0 0 24 16" aria-hidden="true">
            <rect width="24" height="8" fill="#fff" />
            <rect y="8" width="24" height="8" fill="#d7141a" />
            <path d="M0 0l12 8-12 8z" fill="#11457e" />
          </svg>
        </span>
      );
    case 'pl':
      return (
        <span className={cls}>
          <svg viewBox="0 0 24 16" aria-hidden="true">
            <rect width="24" height="8" fill="#fff" />
            <rect y="8" width="24" height="8" fill="#dc143c" />
          </svg>
        </span>
      );
    case 'ua':
      return (
        <span className={cls}>
          <svg viewBox="0 0 24 16" aria-hidden="true">
            <rect width="24" height="8" fill="#0057b7" />
            <rect y="8" width="24" height="8" fill="#ffd700" />
          </svg>
        </span>
      );
  }
}
