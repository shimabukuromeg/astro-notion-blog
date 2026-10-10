import type { Block, Post } from './interfaces'
import {
  buildHeadingId,
  getDateStr,
  getPageLink,
  getPostLink,
  getTagLink,
  filePath,
} from './blog-helpers'
import type { TocEntry } from '../components/primer/ArticleToc'

const normalizedText = (text: string) =>
  text.normalize('NFKC').replace(/\s+/g, '')

export const toListPost = (post: Post) => ({
  title: post.Title,
  image: post.FeaturedImage?.Url
    ? filePath(new URL(post.FeaturedImage.Url))
    : undefined,
  date: getDateStr(post.Date),
  href: getPostLink(post.Slug),
  excerpt:
    normalizedText(post.Excerpt) === normalizedText(post.Title)
      ? ''
      : post.Excerpt,
  tags: post.Tags.map((tag) => ({
    name: tag.name,
    href: getTagLink(tag.name),
  })),
})

export const pageLinks = (count: number, tag = '') =>
  Array.from({ length: count }, (_, index) => getPageLink(index + 1, tag))

export const getHeadingBlocks = (blocks: Block[]): Block[] => {
  const headings: Block[] = []
  const visit = (items: Block[]) => {
    for (const block of items) {
      if (block.Heading1 || block.Heading2 || block.Heading3)
        headings.push(block)
      for (const value of Object.values(block)) {
        if (
          value &&
          typeof value === 'object' &&
          'Children' in value &&
          Array.isArray(value.Children)
        )
          visit(value.Children)
      }
      if (block.ColumnList)
        for (const column of block.ColumnList.Columns)
          visit(column.Children || [])
    }
  }
  visit(blocks)
  return headings
}

export const getHeadingAnchor = (block: Block, headings: Block[]) => {
  const heading = block.Heading1 || block.Heading2 || block.Heading3
  const legacyId = buildHeadingId(heading)
  const first = headings.find(
    (candidate) =>
      buildHeadingId(
        candidate.Heading1 || candidate.Heading2 || candidate.Heading3
      ) === legacyId
  )
  return !first || first.Id === block.Id ? legacyId : `${legacyId}-${block.Id}`
}

export const getArticleHeadings = (blocks: Block[]): TocEntry[] => {
  const headingBlocks = getHeadingBlocks(blocks)
  const firstLevel = Math.min(
    ...headingBlocks.map((block) => Number(block.Type.slice(-1)))
  )
  return headingBlocks
    .map((block) => {
      const heading = block.Heading1 || block.Heading2 || block.Heading3
      return {
        id: getHeadingAnchor(block, headingBlocks),
        text: heading.RichTexts.map((text) => text.PlainText).join(''),
        level: Number(block.Type.slice(-1)) - firstLevel + 1,
      }
    })
    .filter((heading) => heading.id)
}
