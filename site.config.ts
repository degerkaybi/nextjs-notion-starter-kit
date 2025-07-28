import { siteConfig } from './lib/site-config'

export default siteConfig({
  // the site's root Notion page (required)
  rootNotionPageId: '7479b6483c7c47d1a4b16ec3c3b15060',

  // if you want to restrict pages to a single notion workspace (optional)
  // (this should be a Notion ID; see the docs for how to extract this)
  rootNotionSpaceId: null,

  // basic site info (required)
  name: 'Kaybid',
  domain: 'https://nextjs-notion-starter-li0fiy43n-degers-projects-64d52290.vercel.app',
  author: 'Kaybid',

  // open graph metadata (optional)
  description: 'kaybid',

  // social usernames (optional)
      // twitter: 'x',

  // mastodon: '#', // optional mastodon profile URL, provides link verification
  // newsletter: '#', // optional newsletter URL
  // youtube: '#', // optional youtube channel name or `channel/UCGbXXXXXXXXXXXXXXXXXXXXXX`

  // default notion icon and cover images for site-wide consistency (optional)
  // page-specific values will override these site-wide defaults
  defaultPageIcon: null,
  defaultPageCover: null,
  defaultPageCoverPosition: 0.5,

  // whether or not to enable support for LQIP preview images (optional)
  isPreviewImageSupportEnabled: false,

  // whether or not redis is enabled for caching generated preview images (optional)
  // NOTE: if you enable redis, you need to set the `REDIS_HOST` and `REDIS_PASSWORD`
  // environment variables. see the readme for more info
  isRedisEnabled: false,

  // map of notion page IDs to URL paths (optional)
  // any pages defined here will override their default URL paths
  // example:
  //
  // pageUrlOverrides: {
  //   '/foo': '067dd719a912471ea9a3ac10710e7fdf',
  //   '/bar': '0be6efce9daf42688f65c76b89f8eb27'
  // }
        //  pageUrlOverrides: null,
  
pageUrlOverrides: {
  '/akar': '1bf392488fe580d7840cdb756f8a2df0',
  '/aslan': '1bf392488fe580dba637ccc083eebf2b',
  '/bifokalus': '1bf392488fe580428719e6dc4fa2ae22',
  '/crowded-static': '1bf392488fe58005b290d99a594e23de',
  '/dokunamayanlar': '1b0392488fe5811b8fd8f3c2c6e98b75',
  '/echo': '1bf392488fe58096bf91fd3827d86d87',
  '/eid': 'da5cf4ffa5a74d81b2b4651d85c9a9d8',
  '/elements-meeting': '1b0392488fe58196b50df19c86037df0',
  '/evacuation-protocol': '1b5392488fe580848876f4dff6437f49',
  '/eik': '1bf392488fe5806e9224d72e686f100e',
  '/faces': '22a392488fe580508c6fd28fd81cb677',
  '/fire': '22a392488fe5805c89e1da5a13492505',
  '/float': '1bf392488fe5806db642cf09bc92355f',
  '/gag-reflex': '1b0392488fe581b082eef03a37f6343d',
  '/gercegin-olu': '1b0392488fe58195a8f4efa4519c4861',
  '/goril': '1bf392488fe58069be45d2b9963d1356',
  '/in-between-sips': '1bf392488fe5801eb9d8cdd52696975c',
  '/insomnia': '22a392488fe580a09857cb0c4a15ff18',
  '/ivre-mort': '1b0392488fe581728173f7e5eacd1471',
  '/kaybid-plak-gururla-sunar-volta': '1b0392488fe580f79589d1dd2ffbba93',
  '/limbo': '1b5392488fe580d7b811dcf875748ffa',
  '/lost-transmission': '1b0392488fe5813f82fbc0ed07daa13d',
  '/neon-echoes': '1b0392488fe581589591c5da9e7376f5',
  '/night-watch': 'bd62c75cff0b4b11a8571ea394db1d59',
  '/night-watch-bull-run-edition': '4902f670013a466182341cc6d94f00d4',
  '/no-flag': '1bf392488fe580feb36be8a3a4d07817',
  '/no-plan': '1bf392488fe5804b961cf22b788e210b',
  '/panda': '1bf392488fe5800c8deee6acbb3e05bc',
  '/passage': '1b0392488fe581b689c2d4e0cfef7382',
  '/pelerin-takman-n-anlam': '1bf392488fe580d5bd67d09e68b3a9f0',
  '/rest': '22a392488fe5803bae38dd7624d05277',
  '/reverie': '22a392488fe58029b20fdfc88d8205de',
  '/right-rabbit-x6': '1cb392488fe5800883b3f54700d835ae',
  '/ripple-the-dusk': '1bf392488fe580e885d8d855b91ebf51',
  '/seed': '22a392488fe580109f40c26361af670e',
  '/sessiz-l-k': '1b0392488fe58174939fde01249da8f6',
  '/seyir': '1bf392488fe58030a445d19127bc655b',
  '/signal-lost': '1bf392488fe5808590c4cc80cfab7a64',
  '/silent-disco-x9': '1bf392488fe580f8b6cfefe71afe763b',
  '/soz-nt-noktas': '1bf392488fe5809095dbd9013a56d47a',
  '/the-bird-at-table-nine': '1bf392488fe580b186bdf1e5cdfcb4f1',
  '/the-play-without-a-lead': '1b0392488fe58182bfb7d0c4d324f201',
  '/u...kyusuz-lambalar': '1bf392488fe580dfa469db7aaf7e3bbe',
  '/unfamiliar-warmth': '1bf392488fe58077a15afceb85a533bd',
  '/yer-ekimiyle-pazarl-k': '1bf392488fe58097a82eed6afd3a8af4',
  '/yok': '1b0392488fe58107ba8ee33798a681c1',
  '/yukseltilen': '1bf392488fe58068b5f1f1ba79455462',
  '/z-birakmadan': '1b0392488fe581718a9ee258ec7c672f'
}

  // whether to use the default notion navigation style or a custom one with links to
  // important pages. To use `navigationLinks`, set `navigationStyle` to `custom`.
  // navigationStyle: 'custom',
  // navigationLinks: [
  //   {
  //     title: 'Home',
  //     pageId: '7479b6483c7c47d1a4b16ec3c3b15060'
  //   },
    //   {
  //     title: 'About',
  //     pageId: '8401785badf840e99bb988a5e63eacb8'
  //   },
    //   {
  //     title: 'Works',
  //     pageId: 'f9757225c30447d49fa61fdd164703d7'
  //   },
    //   {
  //     title: 'Art & Ideas',
  //     pageId: '32345bd70e2d4156a30b399acd23c897'
  //   },
  //   {
  //     title: 'Press',
  //     pageId: '226392488fe580429c7fd774798d9c8a'
  //   }
  // ]
  navigationStyle: 'custom',
  navigationLinks: [

    {
      title: 'About',
      pageId: '8401785badf840e99bb988a5e63eacb8'
    },
    {
      title: 'Works',
      pageId: 'f9757225c30447d49fa61fdd164703d7'
    },
    {
      title: 'Art & Ideas',
      pageId: '32345bd70e2d4156a30b399acd23c897'
    },
    {
      title: 'Press',
      pageId: '226392488fe580429c7fd774798d9c8a'
    }
 ]
})
