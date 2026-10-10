import { Pagination, type PaginationProps } from '@primer/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@primer/octicons-react';

// Keep Primer's layout, page model and styles. Localize labels through its
// public renderer, and render unavailable destinations as non-link text.
type PageProps = Parameters<NonNullable<PaginationProps['renderPage']>>[0];

function renderPage(page: PageProps) {
  const { key, number, className, href, rel } = page;
  const props = {
    className,
    href,
    rel,
    'data-component': page['data-component'],
    'aria-current': page['aria-current'],
    'aria-disabled': page['aria-disabled'],
  };
  const previous = props.rel === 'prev';
  const next = props.rel === 'next';
  const label = previous
    ? '前のページ'
    : next
      ? '次のページ'
      : `${number} ページ目`;
  const content = previous ? (
    <>
      <ChevronLeftIcon /> 前へ
    </>
  ) : next ? (
    <>
      次へ <ChevronRightIcon />
    </>
  ) : (
    number
  );
  return props['aria-disabled'] ? (
    <span
      key={key}
      className={props.className}
      data-component={props['data-component']}
      aria-disabled="true"
    >
      {content}
    </span>
  ) : (
    <a key={key} {...props} aria-label={label}>
      {content}
    </a>
  );
}

export default function BlogPagination({
  currentPage,
  pageLinks,
}: {
  currentPage: number;
  pageLinks: string[];
}) {
  return (
    <div className="list-pagination">
      <Pagination
        aria-label="記事一覧のページ"
        pageCount={pageLinks.length}
        currentPage={currentPage}
        hrefBuilder={(page) => pageLinks[page - 1]}
        renderPage={renderPage}
      />
    </div>
  );
}
