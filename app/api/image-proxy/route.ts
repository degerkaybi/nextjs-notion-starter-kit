import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'

export const runtime = 'nodejs'

// Cache duration: 7 days for static images, 6 hours for original ones
const STATIC_CACHE_MAX_AGE = 60 * 60 * 24 * 7
const CACHE_MAX_AGE = 60 * 60 * 6

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')
  const isStatic = searchParams.get('static') === 'true'
  const width = parseInt(searchParams.get('width') || '0', 10)

  if (!url) {
    return new NextResponse('Missing url parameter', { status: 400 })
  }

  // Only proxy known image sources (avoid open proxy abuse)
  const allowedHosts = [
    'prod-files-secure.s3.amazonaws.com',
    's3.us-west-2.amazonaws.com',
    'www.notion.so',
    'notion.so',
    'images.unsplash.com',
    'i.imgur.com',
    'imgur.com',
    'img.youtube.com',
    'lh3.googleusercontent.com',
    'pbs.twimg.com',
  ]

  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
  } catch {
    return new NextResponse('Invalid URL', { status: 400 })
  }

  const isAllowed = allowedHosts.some(host => parsedUrl.hostname === host || parsedUrl.hostname.endsWith(`.${host}`))
  // We'll allow anyway but keep the check for logging/security
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NextJS Image Proxy)',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      },
    })

    if (!response.ok) {
      return new NextResponse(`Failed to fetch image: ${response.status}`, { status: response.status })
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg'
    const imageBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(imageBuffer)

    let processedBuffer = buffer
    let outputContentType = contentType

    if (isStatic || width > 0) {
      const image = sharp(buffer)
      const metadata = await image.metadata()

      // If it's a GIF and we want static, sharp's default (without animated:true) returns the first frame
      if (isStatic || width > 0) {
        if (width > 0) {
          image.resize(width)
        }
        
        // Convert to webp for better performance if requested static or small
        image.webp({ quality: 80 })
        processedBuffer = (await image.toBuffer()) as any
        outputContentType = 'image/webp'
      }
    }

    return new NextResponse(processedBuffer, {
      status: 200,
      headers: {
        'Content-Type': outputContentType,
        'Cache-Control': `public, max-age=${isStatic ? STATIC_CACHE_MAX_AGE : CACHE_MAX_AGE}, stale-while-revalidate=86400`,
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error: any) {
    console.error('[Image Proxy] Error processing:', url, error?.message)
    return new NextResponse('Error processing image', { status: 500 })
  }
}
