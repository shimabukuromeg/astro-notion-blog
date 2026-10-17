import type { APIContext } from 'astro'
import { getOgImage } from '../../components/OgImage'
import { getAllPosts, getPostBySlug } from '../../lib/notion/client'
import { getDateStr } from '../../lib/blog-helpers'

export async function getStaticPaths() {
  const posts = await getAllPosts()
  return posts.map((post) => ({ params: { slug: post.Slug } }))
}

export async function GET({ params }: APIContext) {
  if (params.slug === undefined) return new Response(null, { status: 404 })
  const post = await getPostBySlug(params.slug)
  if (!post) return new Response(null, { status: 404 })
  const body = await getOgImage({
    variant: 'thumbnail',
    title: post.Title,
    author: '',
    category: post.Category?.name || post.Tags[0]?.name,
    date: getDateStr(post.Date),
  })
  return new Response(body, { headers: { 'Content-Type': 'image/png' } })
}
