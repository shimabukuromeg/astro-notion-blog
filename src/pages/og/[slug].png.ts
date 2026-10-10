import type { APIContext } from 'astro'
import { getOgImage } from '../../components/OgImage'
import {
  getAllPosts,
  getPostBySlug,
  getDatabase,
} from '../../lib/notion/client'
import { getEditorialImage } from '../../lib/editorial-image'
import { getDateStr } from '../../lib/blog-helpers'

export async function getStaticPaths() {
  const posts = await getAllPosts()
  return posts.map((post) => ({
    params: { slug: post.Slug },
  }))
}

export async function GET({ params }: APIContext) {
  if (params.slug === undefined) return new Response(null, { status: 404 })
  const post = await getPostBySlug(params.slug)
  if (!post) return new Response(null, { status: 404 })
  const database = await getDatabase()
  const body = await getOgImage({
    title: post.Title,
    author: database.Title,
    category: post.Tags.map((tag) => tag.name)
      .slice(0, 2)
      .join(' · '),
    date: getDateStr(post.Date),
    image: await getEditorialImage(post),
  })
  return new Response(body, { headers: { 'Content-Type': 'image/png' } })
}
