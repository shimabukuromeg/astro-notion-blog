import { Card, Heading, InlineLink, Link, Text } from '@primer/react-brand';
import {
  BookIcon,
  CodeIcon,
  NoteIcon,
  PeopleIcon,
} from '@primer/octicons-react';
import BlogPagination from './BlogPagination';

export interface ListPost {
  title: string;
  date: string;
  href: string;
  excerpt: string;
  image?: string;
  format?: string;
  tags: { name: string; href: string }[];
}
interface Props {
  posts: ListPost[];
  total: number;
  topics: {
    name: string;
    label: string;
    shortLabel: string;
    href: string;
    count: number;
  }[];
  tag?: string;
  kindLabel?: string;
  homeHref: string;
  currentPage: number;
  pageLinks: string[];
}

// Editorial metadata and a compact media layout are blog-specific. Typography
// comes from Brand components; the media frame uses Brand/base tokens only.
function ArticleVisual({
  post,
  priority = false,
}: {
  post: ListPost;
  priority?: boolean;
}) {
  const topic = post.tags[0]?.name || 'Notes';
  const Icon =
    post.format === '読書メモ' ||
    post.tags.some((tag) => tag.name === '本' || tag.name === '本の感想')
      ? BookIcon
      : post.tags.some(
            (tag) => tag.name === 'EM' || tag.name === '組織・マネジメント'
          )
        ? PeopleIcon
        : post.tags.some((tag) => /技術|GPT|AI|開発/.test(tag.name))
          ? CodeIcon
          : NoteIcon;
  return (
    <a
      href={post.href}
      className="article-visual"
      aria-hidden="true"
      tabIndex={-1}
    >
      {post.image ? (
        <img
          src={post.image}
          alt=""
          width={1200}
          height={675}
          loading={priority ? 'eager' : 'lazy'}
        />
      ) : (
        <span className="note-art" aria-hidden="true">
          <span className="note-art-topic">{topic}</span>
          <span className="note-art-sheet">
            <Icon size={64} />
            <span className="note-art-rule" />
            <span className="note-art-rule" />
            <span className="note-art-rule short" />
          </span>
          <span className="note-art-date">
            {post.date.replaceAll('-', '.')}
          </span>
        </span>
      )}
    </a>
  );
}
function Story({
  post,
  featured = false,
  headingLevel = 'h2',
  stacked = false,
}: {
  post: ListPost;
  featured?: boolean;
  headingLevel?: 'h2' | 'h3';
  stacked?: boolean;
}) {
  return (
    <article
      className={
        featured
          ? 'editorial-story feature-story'
          : stacked
            ? 'editorial-story stacked-story'
            : 'editorial-story compact-story'
      }
    >
      <ArticleVisual post={post} priority={featured} />
      <div className="story-copy">
        <div className="story-topics">
          {post.tags.slice(0, 2).map((tag) => (
            <InlineLink key={tag.name} href={tag.href}>
              {tag.name}
            </InlineLink>
          ))}
        </div>
        <Heading
          as={headingLevel}
          className="story-heading"
          size={featured ? '4' : '6'}
          weight={
            featured
              ? { narrow: 'semibold', regular: 'extrabold', wide: 'extrabold' }
              : 'semibold'
          }
        >
          <a href={post.href} className="story-title-link">
            {post.title}
          </a>
        </Heading>
        {post.excerpt && (
          <Text as="p" variant="muted" size="300" className="story-excerpt">
            {post.excerpt}
          </Text>
        )}
        <div className="story-meta">
          <span>Megumi Shimabukuro</span>
          <span aria-hidden="true">·</span>
          <time dateTime={post.date}>{post.date}</time>
        </div>
      </div>
    </article>
  );
}
export default function PostList({
  posts,
  total,
  topics,
  tag,
  kindLabel,
  homeHref,
  currentPage,
  pageLinks,
}: Props) {
  const isHome = !tag && currentPage === 1;
  const recent = isHome ? posts.slice(0, 4) : [];
  const latest = isHome ? posts.slice(4, 7) : [];
  const remaining = posts.slice(recent.length + latest.length);
  return (
    <div className="post-index">
      <header className={isHome ? 'editorial-intro' : 'category-intro'}>
        {!isHome && <InlineLink href={homeHref}>すべての記事へ</InlineLink>}
        {tag && kindLabel && (
          <Text as="p" size="100" variant="muted">
            {kindLabel}
          </Text>
        )}
        <Heading as="h1" size={isHome ? '6' : '3'}>
          {tag || 'すべての記事'}
        </Heading>
        <Text as="p" size="100" variant="muted">
          {tag
            ? kindLabel === '記事形式'
              ? `「${tag}」の形式で書いた記事をまとめています。`
              : `「${tag}」について書いた記事をまとめています。`
            : '読書、仕事、日々の気づき。試したことと考えたことを書き残しています。'}
        </Text>
      </header>
      {recent.length > 0 && (
        <section aria-labelledby="latest-heading">
          <div className="featured-band">
            <div className="section-heading">
              <Heading as="h2" size="6" id="latest-heading">
                最新の記事
              </Heading>
            </div>
            <div className="editorial-lead">
              <Story post={recent[0]} featured headingLevel="h3" />
              <div className="lead-stories">
                {recent.slice(1).map((post) => (
                  <Story key={post.href} post={post} headingLevel="h3" />
                ))}
              </div>
            </div>
          </div>
          {latest.length > 0 && (
            <div className="latest-section">
              <div className="latest-grid">
                {latest.map((post) => (
                  <Story key={post.href} post={post} stacked headingLevel="h3" />
                ))}
              </div>
            </div>
          )}
        </section>
      )}
      {isHome && topics.length > 0 && (
        <nav className="reading-topics" aria-label="テーマから記事を読む">
          {topics.map((topic) => (
            <div key={topic.name}>
              <Link href={topic.href} size="medium">
                {topic.label}
              </Link>
              <Text as="span" variant="muted" size="100">
                {topic.count} 件の記事
              </Text>
            </div>
          ))}
        </nav>
      )}
      <section className="articles-section" aria-labelledby="articles-heading">
        <div className="articles-heading section-heading">
          <Heading as="h2" size="6" id="articles-heading">
            {tag
              ? `${tag}の記事`
              : recent.length
                ? 'これまでの記事'
                : '記事一覧'}
          </Heading>
          <Text size="100" variant="muted">
            {total} 件 · 新しい順
          </Text>
        </div>
        <div className="articles-grid">
          {remaining.length === 1 ? (
            <Story post={remaining[0]} headingLevel="h3" />
          ) : (
            remaining.map((post) => (
              <article key={post.href} className="archive-story">
                <Card
                  href={post.href}
                  variant="minimal"
                  fullWidth
                  ctaText="記事を読む"
                >
                  {post.tags[0] && <Card.Label>{post.tags[0].name}</Card.Label>}
                  <Card.Heading as="h3" size="6">
                    {post.title}
                  </Card.Heading>
                  {post.excerpt && (
                    <Card.Description>{post.excerpt}</Card.Description>
                  )}
                </Card>
                <time className="archive-date" dateTime={post.date}>
                  {post.date}
                </time>
              </article>
            ))
          )}
        </div>
        {posts.length === 0 && <Text as="p">まだ記事がありません。</Text>}
      </section>
      {pageLinks.length > 1 && (
        <BlogPagination currentPage={currentPage} pageLinks={pageLinks} />
      )}
      <p className="list-page-note">
        {total} 件中 {posts.length ? (currentPage - 1) * 20 + 1 : 0}–
        {Math.min(currentPage * 20, total)} 件を表示
      </p>
    </div>
  );
}
