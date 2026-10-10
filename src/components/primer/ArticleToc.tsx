import { useEffect, useRef, useState } from 'react';
import { InlineLink as Link } from '@primer/react-brand';
import { ArrowUpIcon } from '@primer/octicons-react';

export interface TocEntry {
  id: string;
  text: string;
  level: number;
}
export default function ArticleToc({ headings }: { headings: TocEntry[] }) {
  const [active, setActive] = useState('');
  const list = useRef<HTMLOListElement>(null);
  useEffect(() => {
    let frame = 0;
    const nodes = headings.map((heading) => ({
      ...heading,
      node: document.getElementById(heading.id),
    }));
    const update = () => {
      frame = 0;
      const found = nodes.filter(
        ({ node }) => node && node.getBoundingClientRect().top <= 150
      );
      setActive(found.at(-1)?.id || headings[0]?.id || '');
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    return () => {
      window.removeEventListener('scroll', schedule);
      cancelAnimationFrame(frame);
    };
  }, [headings]);
  useEffect(() => {
    const container = list.current;
    const link = container?.querySelector<HTMLElement>(
      '[aria-current="location"]'
    );
    if (!container || !link) return;
    const bounds = container.getBoundingClientRect();
    const item = link.getBoundingClientRect();
    if (item.top < bounds.top || item.bottom > bounds.bottom)
      container.scrollTop += item.top - bounds.top - 12;
  }, [active]);
  if (!headings.length) return null;
  return (
    <>
      <nav className="article-toc" aria-label="この記事の目次">
        <div className="toc-heading">この記事の内容</div>
        <ol ref={list}>
          {headings.map((heading) => (
            <li key={heading.id} data-level={heading.level}>
              <Link
                href={`#${encodeURIComponent(heading.id)}`}
                aria-current={active === heading.id ? 'location' : undefined}
              >
                {heading.text}
              </Link>
            </li>
          ))}
        </ol>
        <Link href="#main-content" className="back-to-top">
          <ArrowUpIcon size={14} />
          先頭に戻る
        </Link>
      </nav>
    </>
  );
}
