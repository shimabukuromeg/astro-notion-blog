import type { Post, SelectProperty } from './interfaces'
import { getNavLink, getStaticFilePath } from './blog-helpers'

export const taxonomyKinds = ['category', 'format', 'topic'] as const
export type TaxonomyKind = (typeof taxonomyKinds)[number]
export const taxonomyLabels: Record<TaxonomyKind, string> = {
  category: 'カテゴリー',
  format: '記事形式',
  topic: 'トピック',
}

export function getPostTaxonomy(
  post: Post,
  kind: TaxonomyKind
): SelectProperty[] {
  if (kind === 'category') return post.Category ? [post.Category] : []
  if (kind === 'format') return post.Format ? [post.Format] : []
  return post.Topics
}

export function matchesTaxonomy(post: Post, kind: TaxonomyKind, name: string) {
  return getPostTaxonomy(post, kind).some((item) => item.name === name)
}

export function getTaxonomyEntries(posts: Post[], kind: TaxonomyKind) {
  const counts = new Map<string, number>()
  for (const post of posts) {
    for (const name of new Set(
      getPostTaxonomy(post, kind).map((item) => item.name)
    )) {
      counts.set(name, (counts.get(name) || 0) + 1)
    }
  }
  return Array.from(counts, ([name, count]) => ({ name, count })).sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name, 'ja')
  )
}

export function getTaxonomyLink(kind: TaxonomyKind, name: string, page = 1) {
  return getNavLink(
    `/posts/${kind}/${encodeURIComponent(name)}${page > 1 ? `/page/${page}` : ''}`
  )
}

export function getTaxonomyOgPath(kind: TaxonomyKind, name: string) {
  return getStaticFilePath(`/og/${kind}/${encodeURIComponent(name)}.png`)
}

export function isBookReview(post: Post) {
  return post.Format
    ? post.Format.name === '読書メモ'
    : post.Tags.some((tag) => tag.name === '本')
}
