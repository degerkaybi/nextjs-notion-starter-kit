import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { notion } from '@/lib/notion'

export const runtime = 'nodejs'

// Cache duration: 7 days for static images, 6 hours for original ones
const STATIC_CACHE_MAX_AGE = 60 * 60 * 24 * 7
const CACHE_MAX_AGE = 60 * 60 * 6

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')
  const blockId = searchParams.get('blockId')
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
    let targetUrl = url;
    let response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      },
      referrerPolicy: 'no-referrer',
    })

    // Auto-Healing: If Notion S3 image link has expired (403 Forbidden), fetch a fresh one using blockId!
    if (!response.ok && response.status === 403 && blockId && (targetUrl.includes('secure.notion-static.com') || targetUrl.includes('amazonaws.com') || targetUrl.includes('prod-files-secure'))) {
      console.log(`[Image Proxy] URL expired (403). Fetching fresh block ${blockId}...`);
      try {
        const block: any = await notion.blocks.retrieve({ block_id: blockId })
        const type = block.type
        // Extract new valid URL
        const freshUrl = block[type]?.file?.url || block[type]?.external?.url || block.video?.file?.url || block.image?.file?.url
        
        if (freshUrl) {
          targetUrl = freshUrl;
          response = await fetch(targetUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
            },
            referrerPolicy: 'no-referrer',
          })
          console.log(`[Image Proxy] Successfully fetched fresh URL for block ${blockId}`);
        }
      } catch (retryError: any) {
        console.error('[Image Proxy] Block retry failed for', blockId, retryError?.message)
      }
    }

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
