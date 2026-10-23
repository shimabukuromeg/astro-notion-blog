import type { Post } from './interfaces'
import { getAllBlocksByBlockId } from './notion/client'
import { extractTargetBlocks, filePath } from './blog-helpers'
import { isBookReview, matchesTaxonomy } from './taxonomy'

// Share the explicit feature image or first book/diary body image across feed and OGP.
export async function getEditorialImage(post: Post) {
  if (post.FeaturedImage?.Url) {
    const url = post.FeaturedImage.Url
    return { url, src: filePath(new URL(url)) }
  }
  if (!isBookReview(post) && !matchesTaxonomy(post, 'category', '日記'))
    return undefined
  const blocks = await getAllBlocksByBlockId(post.PageId)
  const image = extractTargetBlocks('image', blocks).find(
    (block) => block.Image
  )?.Image
  const url = image?.External?.Url || image?.File?.Url
  if (!url) return undefined
  return { url, src: image?.External?.Url ? url : filePath(new URL(url)) }
}
