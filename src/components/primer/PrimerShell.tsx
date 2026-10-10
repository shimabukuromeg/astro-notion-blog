import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ActionList,
  Dialog,
  FormControl,
  IconButton,
  NavList,
  TextInput,
} from '@primer/react';
import { ThemeProvider } from '@primer/react/next';
import {
  Avatar,
  Button,
  InlineLink as Link,
  ThemeProvider as BrandThemeProvider,
} from '@primer/react-brand';
import {
  BookIcon,
  ChevronDownIcon,
  MarkGithubIcon,
  MoonIcon,
  RssIcon,
  SearchIcon,
  SunIcon,
  ThreeBarsIcon,
  XIcon,
} from '@primer/octicons-react';

export interface SearchPost {
  title: string;
  excerpt: string;
  href: string;
  tags: string[];
  date: string;
}

interface Props {
  title: string;
  profileImageSrc: string;
  description: string;
  homeHref: string;
  feedHref: string;
  tags: { name: string; href: string; count: number }[];
  formats?: { name: string; href: string; count: number }[];
  posts: SearchPost[];
  currentTag?: string;
  isIndex: boolean;
  children: ReactNode;
}

// The installed Dialog has no localized close-label prop. Preserve its standard
// Header / Title / IconButton composition and spacing; only translate the label.
function JapaneseDialogHeader({
  dialogLabelId,
  title,
  onClose,
}: {
  dialogLabelId: string;
  title?: ReactNode;
  onClose: (gesture: 'close-button' | 'escape') => void;
}) {
  return (
    <Dialog.Header>
      <div className="localized-dialog-header">
        <div className="localized-dialog-title">
          <Dialog.Title id={dialogLabelId}>{title}</Dialog.Title>
        </div>
        <IconButton
          icon={XIcon}
          aria-label="閉じる"
          variant="invisible"
          onClick={() => onClose('close-button')}
        />
      </div>
    </Dialog.Header>
  );
}

const HeaderSearchIcon = () => <SearchIcon size={24} />;
const HeaderMenuIcon = () => <ThreeBarsIcon size={24} />;

export default function PrimerShell({
  title,
  profileImageSrc,
  description,
  homeHref,
  feedHref,
  tags,
  formats = [],
  posts,
  currentTag,
  isIndex,
  children,
}: Props) {
  const [dark, setDark] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [categoryQuery, setCategoryQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const categoryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      setDark(document.documentElement.dataset.colorMode === 'dark');
    } catch {
      /* Reading remains available when storage is disabled. */
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.colorMode = next ? 'dark' : 'light';
    try {
      localStorage.setItem('blog-color-mode', next ? 'dark' : 'light');
    } catch {
      /* Optional preference. */
    }
  };
  const normalize = (value: string) =>
    value.normalize('NFKC').trim().toLocaleLowerCase();
  const normalizedQuery = normalize(query);
  const terms = normalizedQuery.split(/\s+/).filter(Boolean);
  const matches = posts
    .filter((post) =>
      terms.every((term) =>
        normalize(
          `${post.title} ${post.excerpt} ${post.tags.join(' ')}`
        ).includes(term)
      )
    )
    .sort((a, b) => {
      const relevance = (post: SearchPost) =>
        terms.reduce(
          (score, term) =>
            score +
            (normalize(post.title).includes(term)
              ? 2
              : normalize(post.tags.join(' ')).includes(term)
                ? 1
                : 0),
          0
        );
      return relevance(b) - relevance(a);
    });
  const visibleTags = tags.filter((tag) =>
    normalize(tag.name).includes(normalize(categoryQuery))
  );
  const navigationTags = tags.slice(0, 3);
  const selectedTag = tags.find((tag) => tag.name === currentTag);
  if (selectedTag && !navigationTags.includes(selectedTag))
    navigationTags.push(selectedTag);
  const categoryNavigation = (mobile = false) => (
    <>
      <TextInput
        ref={mobile ? categoryInputRef : undefined}
        id={`category-filter-${mobile ? 'mobile' : 'desktop'}`}
        aria-label="カテゴリーを絞り込む"
        placeholder="カテゴリーを絞り込む"
        leadingVisual={SearchIcon}
        block
        size="small"
        value={categoryQuery}
        onChange={(event) => setCategoryQuery(event.target.value)}
      />
      <div className="category-nav">
        <NavList aria-label="カテゴリー">
          {!categoryQuery && (
            <NavList.Item
              href={homeHref}
              aria-current={isIndex && !currentTag ? 'page' : undefined}
            >
              すべての記事
              <NavList.TrailingVisual>{posts.length}</NavList.TrailingVisual>
            </NavList.Item>
          )}
          {visibleTags.map((tag) => (
            <NavList.Item
              key={tag.name}
              href={tag.href}
              aria-current={currentTag === tag.name ? 'page' : undefined}
            >
              {tag.name}
              <NavList.TrailingVisual>{tag.count}</NavList.TrailingVisual>
            </NavList.Item>
          ))}
        </NavList>
      </div>
      {visibleTags.length === 0 && (
        <p className="category-empty" role="status">
          一致するカテゴリーがありません。
        </p>
      )}
      {formats.length > 0 && (
        <div className="taxonomy-format-navigation">
          <p>記事形式から探す</p>
          <NavList aria-label="記事形式">
            {formats.map((format) => (
              <NavList.Item key={format.name} href={format.href}>
                {format.name}
                <NavList.TrailingVisual>{format.count}</NavList.TrailingVisual>
              </NavList.Item>
            ))}
          </NavList>
        </div>
      )}
    </>
  );

  return (
    <ThemeProvider colorMode={dark ? 'dark' : 'light'} contextOnly>
      <BrandThemeProvider
        colorMode={dark ? 'dark' : 'light'}
        data-color-mode={undefined}
        className="primer-blog"
      >
        <a className="skip-link" href="#main-content">
          本文へ移動
        </a>
        <div className="masthead">
          <header className="site-header">
            <div className="header-inner">
              <a href={homeHref} className="site-brand" aria-label={title}>
                <Avatar
                  src={profileImageSrc}
                  alt=""
                  shape="circle"
                  size={{ narrow: 32, regular: 48, wide: 48 }}
                  className="brand-avatar"
                />
                <span className="brand-copy">
                  <span className="brand-name">{title}</span>
                  <span className="brand-mobile">
                    MEGUMI <span aria-hidden="true">/</span> Blog
                  </span>
                </span>
              </a>
              <div className="header-actions">
                <div className="desktop-search">
                  <Button
                    leadingVisual={SearchIcon}
                    size="small"
                    hasArrow={false}
                    onClick={() => setSearchOpen(true)}
                  >
                    記事を検索
                  </Button>
                </div>
                <div className="mobile-search">
                  <IconButton
                    icon={HeaderSearchIcon}
                    size="large"
                    aria-label="記事を検索"
                    variant="invisible"
                    onClick={() => setSearchOpen(true)}
                  />
                </div>
                <div className="desktop-theme">
                  <IconButton
                    icon={dark ? SunIcon : MoonIcon}
                    aria-label={
                      dark ? 'ライトモードに切り替え' : 'ダークモードに切り替え'
                    }
                    onClick={toggleTheme}
                    variant="invisible"
                  />
                </div>
                <div className="mobile-menu">
                  <IconButton
                    icon={HeaderMenuIcon}
                    size="large"
                    aria-label="カテゴリーを開く"
                    aria-expanded={menuOpen}
                    aria-controls={
                      menuOpen ? 'blog-mobile-categories' : undefined
                    }
                    onClick={() => setMenuOpen((open) => !open)}
                    variant="invisible"
                  />
                </div>
              </div>
            </div>
          </header>
          <nav className="topic-navigation" aria-label="記事のカテゴリー">
            <div className="topic-navigation-inner">
              <Link
                href={homeHref}
                aria-current={isIndex && !currentTag ? 'page' : undefined}
              >
                すべての記事
              </Link>
              {navigationTags.map((tag) => (
                <Link
                  key={tag.name}
                  href={tag.href}
                  aria-current={currentTag === tag.name ? 'page' : undefined}
                >
                  {tag.name}
                </Link>
              ))}
              <button
                type="button"
                className="all-topics-button"
                aria-expanded={menuOpen}
                aria-controls={menuOpen ? 'blog-mobile-categories' : undefined}
                onClick={() => setMenuOpen(true)}
              >
                カテゴリー一覧 <ChevronDownIcon size={16} />
              </button>
            </div>
          </nav>
        </div>
        <div className="site-grid">
          <main id="main-content" tabIndex={-1}>
            {children}
          </main>
        </div>
        <footer className="site-footer">
          <div className="footer-about">
            <span className="footer-name">{title}</span>
            {description && <p>{description}</p>}
          </div>
          <div className="footer-theme">
            <IconButton
              icon={dark ? SunIcon : MoonIcon}
              aria-label={
                dark ? 'ライトモードに切り替え' : 'ダークモードに切り替え'
              }
              onClick={toggleTheme}
              variant="invisible"
            />
          </div>
          <nav className="footer-links" aria-label="その他のリンク">
            <Link href="https://github.com/shimabukuromeg">
              <MarkGithubIcon /> GitHub
            </Link>
            <Link href={feedHref}>
              <RssIcon /> RSS
            </Link>
            <Link href="https://github.com/otoyo/astro-notion-blog">
              astro-notion-blog
            </Link>
          </nav>
        </footer>
        {menuOpen && (
          <Dialog
            title="カテゴリー・記事形式から読む"
            renderHeader={JapaneseDialogHeader}
            onClose={() => setMenuOpen(false)}
            initialFocusRef={categoryInputRef}
            width="small"
          >
            <div id="blog-mobile-categories">{categoryNavigation(true)}</div>
          </Dialog>
        )}
        {searchOpen && (
          <Dialog
            title="記事を検索"
            renderHeader={JapaneseDialogHeader}
            onClose={() => setSearchOpen(false)}
            width="large"
            initialFocusRef={inputRef}
          >
            <FormControl>
              <FormControl.Label>タイトル・概要・分類</FormControl.Label>
              <TextInput
                ref={inputRef}
                block
                leadingVisual={SearchIcon}
                placeholder="キーワードを入力…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </FormControl>
            <p className="search-count" role="status">
              {matches.length} 件の記事
            </p>
            <div className="search-results">
              <ActionList>
                {matches.map((post) => (
                  <ActionList.LinkItem key={post.href} href={post.href}>
                    <ActionList.LeadingVisual>
                      <BookIcon />
                    </ActionList.LeadingVisual>
                    {post.title}
                    <ActionList.Description variant="block">
                      {post.tags.join(' · ')}
                      {post.tags.length > 0 ? ' — ' : ''}
                      {post.date}
                    </ActionList.Description>
                  </ActionList.LinkItem>
                ))}
              </ActionList>
              {matches.length === 0 && (
                <p className="empty-search">
                  一致する記事がありません。別のキーワードで検索してください。
                </p>
              )}
            </div>
          </Dialog>
        )}
      </BrandThemeProvider>
    </ThemeProvider>
  );
}
