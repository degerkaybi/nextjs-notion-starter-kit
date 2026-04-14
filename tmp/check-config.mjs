import * as config from './lib/config.js'

console.log('--- Config Dump ---')
console.log('rootNotionPageId:', config.rootNotionPageId)
console.log('pageUrlOverrides count:', Object.keys(config.pageUrlOverrides).length)
console.log('inversePageUrlOverrides count:', Object.keys(config.inversePageUrlOverrides).length)
console.log('About override:', config.inversePageUrlOverrides['8401785badf840e99bb988a5e63eacb8'])
console.log('includeNotionIdInUrls:', config.includeNotionIdInUrls)
console.log('-------------------')
