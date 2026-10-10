import { Button } from '@primer/react-brand';
import { ShareIcon } from '@primer/octicons-react';

interface Props {
  title: string;
  url: string;
}

export default function ArticleShare({ title, url }: Props) {
  const shareUrl = new URL('https://x.com/intent/tweet');
  shareUrl.searchParams.set('text', title);
  shareUrl.searchParams.set('url', url);

  return (
    <Button
      as="a"
      href={shareUrl.toString()}
      target="_blank"
      rel="noopener noreferrer"
      size="small"
      hasArrow={false}
      leadingVisual={<ShareIcon size={16} />}
      aria-label="この記事をXでシェア（新しいタブで開く）"
    >
      Xでシェア
    </Button>
  );
}
