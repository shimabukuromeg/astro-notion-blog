import type { APIContext } from 'astro'
import { getOgImage } from '../../../components/OgImage'
import { getAllTags, getDatabase } from '../../../lib/notion/client'

export async function getStaticPaths() {
  const tags = await getAllTags()
  return tags.map((tag) => ({ params: { tag: tag.name } }))
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
