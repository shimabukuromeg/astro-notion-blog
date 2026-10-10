import {
  Breadcrumbs,
  Button,
  Heading,
  InlineLink as Link,
} from '@primer/react-brand';
import { PencilIcon } from '@primer/octicons-react';

interface Props {
  title: string;
  date: string;
  excerpt: string;
  homeHref: string;
  tags: { name: string; href: string }[];
  topics?: { name: string; href: string }[];
  editHref?: string;
  headingId?: string;
}
export default function ArticleHeader({
  title,
  date,
  excerpt,
  tags,
  topics = [],
  homeHref,
  editHref,
  headingId,
}: Props) {
  return (
    <>
      <Breadcrumbs className="article-breadcrumbs" aria-label="現在の位置">
        <Breadcrumbs.Item href={homeHref}>ブログ</Breadcrumbs.Item>
        {tags[0] && (
          <Breadcrumbs.Item href={tags[0].href}>
            {tags[0].name}
          </Breadcrumbs.Item>
        )}
        <Breadcrumbs.Item href={homeHref} selected>
          記事
        </Breadcrumbs.Item>
      </Breadcrumbs>
      <header className="article-header">
        <div className="article-tags">
          {tags.map((tag) => (
            <Link key={tag.name} href={tag.href} className="tag-link">
              {tag.name}
            </Link>
          ))}
        </div>
        <Heading as="h1" size="3" id={headingId}>
          {title}
        </Heading>
        {excerpt && <p className="article-deck">{excerpt}</p>}
        <div className="article-meta">
          <time dateTime={date}>{date}</time>
          {editHref && (
            <Button
              as="a"
              href={editHref}
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              leadingVisual={PencilIcon}
            >
              Notionで編集
            </Button>
          )}
        </div>
        {topics.length > 0 && (
          <nav className="article-tags" aria-label="この記事のトピック">
            <span>トピック</span>
            {topics.map((topic) => (
              <Link key={topic.name} href={topic.href} className="tag-link">
                {topic.name}
              </Link>
            ))}
          </nav>
        )}
      </header>
    </>
  );
}
