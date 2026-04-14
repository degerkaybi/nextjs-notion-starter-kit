import { resolveNotionPage } from './lib/resolve-notion-page.js'
import { domain } from './lib/config.js'
import * as fs from 'fs'

async function debugSubpage(slug: string) {
  try {
    console.log(`Debugging slug: ${slug}`)
    const props = await resolveNotionPage(domain, slug)
    console.log(`Page ID: ${props.pageId}`)
    console.log(`Has recordMap: ${!!props.recordMap}`)
    if (props.recordMap && props.pageId) {
      console.log(`Block exists: ${!!props.recordMap.block[props.pageId]}`)
      console.log(`Block keys: ${Object.keys(props.recordMap.block).slice(0, 5)}`)
    }
    if (props.error) {
      console.log(`Error: ${props.error.message} (${props.error.statusCode})`)
    }
    fs.writeFileSync('debug_output.json', JSON.stringify(props, null, 2))
    console.log('Output written to debug_output.json')
  } catch (err) {
    console.error('Debug failed:', err)
  }
}

debugSubpage('about')
