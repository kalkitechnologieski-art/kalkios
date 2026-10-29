import { Fragment } from 'react';

type Tag = 'h1' | 'h2' | 'h3' | 'p' | 'span';

interface AnimatedHeadlineProps {
  text: string;
  as?: Tag;
  className?: string;
  delay?: number;
  stagger?: number;
  gradient?: boolean;
  inView?: boolean;
}

// Words rise out of their own mask. Deliberately CSS-driven: the reveal is in the
// first paint, so a headline never waits on hydration to become visible. With
// `inView` the same keyframes are bound to the scroll timeline where the browser
// supports it, and fall back to the time-based reveal where it doesn't.
export function AnimatedHeadline({
  text,
  as: Tag = 'h2',
  className = '',
  delay = 0,
  stagger = 0.055,
  gradient = false,
  inView = false,
}: AnimatedHeadlineProps) {
  const words = text.split(' ').filter(Boolean);

  return (
    <Tag className={`${inView ? 'kalki-headline--view' : ''} ${className}`.trim()}>
      {words.map((word, i) => (
        <Fragment key={`${word}-${i}`}>
          <span className="kalki-word">
            <span className="kalki-word-in" style={{ animationDelay: `${(delay + i * stagger).toFixed(3)}s` }}>
              {gradient ? <GradientWord text={word} /> : word}
            </span>
          </span>
          {i < words.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </Tag>
  );
}

function GradientWord({ text }: { text: string }) {
  return (
    <span
      className="bg-clip-text text-transparent"
      style={{
        backgroundImage:
          'linear-gradient(96deg, var(--kalki-brand-a) 0%, var(--kalki-brand-b) 52%, var(--kalki-brand-c) 100%)',
      }}
    >
      {text}
    </span>
  );
}
