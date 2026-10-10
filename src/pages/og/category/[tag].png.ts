import type { APIContext } from 'astro'
import { getOgImage } from '../../../components/OgImage'
import {
  getAllTags,
  getAllPosts,
  getDatabase,
} from '../../../lib/notion/client'
import { getTaxonomyEntries } from '../../../lib/taxonomy'

export async function getStaticPaths() {
  const tags = await getAllTags()
  const categories = getTaxonomyEntries(await getAllPosts(), 'category')
  return [...new Set([...tags, ...categories].map((tag) => tag.name))].map(
    (tag) => ({ params: { tag } })
  )
}

export async function GET({ params }: APIContext) {
  if (params.tag === undefined) return new Response(null, { status: 404 })
  const database = await getDatabase()
  const body = await getOgImage({
    title: `${params.tag}の記事`,
    author: database.Title,
    category: 'カテゴリー',
  })
  return new Response(body, { headers: { 'Content-Type': 'image/png' } })
}
