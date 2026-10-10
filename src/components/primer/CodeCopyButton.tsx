import { useEffect, useState } from 'react';
import { Button } from '@primer/react-brand';
import { CopyIcon } from '@primer/octicons-react';

export default function CodeCopyButton({ code }: { code: string }) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  useEffect(() => {
    if (status === 'idle') return;
    const timer = setTimeout(() => setStatus('idle'), 3000);
    return () => clearTimeout(timer);
  }, [status]);
  return (
    <>
      <Button
        size="small"
        hasArrow={false}
        aria-live="polite"
        leadingVisual={CopyIcon}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(code);
            setStatus('copied');
          } catch {
            setStatus('error');
          }
        }}
      >
        {status === 'copied'
          ? 'コピーしました'
          : status === 'error'
            ? 'コピーできませんでした'
            : 'コピー'}
      </Button>
    </>
  );
}
