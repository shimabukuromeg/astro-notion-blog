import type { APIContext } from 'astro'
import { getOgImage } from '../../../components/OgImage'
import { getAllPosts, getDatabase } from '../../../lib/notion/client'
import {
  getTaxonomyEntries,
  taxonomyLabels,
  type TaxonomyKind,
} from '../../../lib/taxonomy'

export async function getStaticPaths() {
  const posts = await getAllPosts()
  return (['format', 'topic'] as const).flatMap((kind) =>
    getTaxonomyEntries(posts, kind).map((entry) => ({
      params: { kind, name: entry.name },
    }))
  )
}

export async function GET({ params }: APIContext) {
  if (!params.name || !['format', 'topic'].includes(params.kind || ''))
    return new Response(null, { status: 404 })
  const database = await getDatabase()
  const body = await getOgImage({
    title: `${params.name}の記事`,
    author: database.Title,
    category: taxonomyLabels[params.kind as TaxonomyKind],
  })
  return new Response(body, { headers: { 'Content-Type': 'image/png' } })
}
