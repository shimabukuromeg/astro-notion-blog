import { getOgImage } from '../components/OgImage'
import { getDatabase } from '../lib/notion/client'

export async function GET() {
  const database = await getDatabase()
  const body = await getOgImage({
    title: database.Title,
    author: database.Title,
  })
  return new Response(body, { headers: { 'Content-Type': 'image/png' } })
}
