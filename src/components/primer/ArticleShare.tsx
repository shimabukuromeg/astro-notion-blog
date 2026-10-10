import { Button } from '@primer/react-brand';
import { LinkButton } from '@primer/react';

interface Props {
  title: string;
  url: string;
  placement?: 'header' | 'footer';
}

// Original artwork: https://about.x.com/content/dam/about-twitter/x/brand-toolkit/x-logo.zip
function XLogo() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 1200 1227"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z" />
    </svg>
  );
}

export default function ArticleShare({ title, url, placement = 'footer' }: Props) {
  const shareUrl = new URL('https://x.com/intent/tweet');
  shareUrl.searchParams.set('text', title);
  shareUrl.searchParams.set('url', url);

  if (placement === 'header') {
    return (
      <LinkButton
        className="article-share-header"
        href={shareUrl.toString()}
        target="_blank"
        rel="noopener noreferrer"
        variant="invisible"
        size="large"
        leadingVisual={XLogo}
        aria-label="この記事をXでシェア（新しいタブで開く）"
      >
        シェア
      </LinkButton>
    );
  }

  return (
    <Button
      as="a"
      href={shareUrl.toString()}
      target="_blank"
      rel="noopener noreferrer"
      variant="secondary"
      size="medium"
      hasArrow={false}
      leadingVisual={<XLogo />}
      aria-label="この記事をXでシェア（新しいタブで開く）"
    >
      シェア
    </Button>
  );
}
