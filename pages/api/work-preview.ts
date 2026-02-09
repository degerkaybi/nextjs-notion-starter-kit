import { NotionClient } from 'notion-client'

const notion = new NotionClient()

export default async function handler(req, res) {
  const { pageId } = req.query

  if (!pageId || typeof pageId !== 'string') {
    return res.status(200).json({ image: null })
  }

  try {
    const recordMap = await notion.getPage(pageId)
    const blocks = recordMap.block

    let image = null

    for (const key in blocks) {
      const block = blocks[key]?.value
      if (block?.type === 'image') {
        image =
          block.properties?.source?.[0]?.[0] ||
          block.format?.display_source ||
          null
        break
      }
    }

    return res.status(200).json({ image })
  } catch {
    return res.status(200).json({ image: null })
  }
}
