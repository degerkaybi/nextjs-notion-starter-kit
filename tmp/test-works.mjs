import { getPage } from './lib/notion.js'

async function test() {
  try {
    const pageId = '302392488fe580d4824accf5851dfe96'
    console.log('Fetching Works page...', pageId)
    const recordMap = await getPage(pageId)
    console.log('Successfully fetched Works page!')
    console.log('Number of blocks:', Object.keys(recordMap.block).length)
    process.exit(0)
  } catch (err) {
    console.error('Error fetching Works page:', err)
    process.exit(1)
  }
}

test()
