import type { PageProps } from '@/lib/types'
import { NotionPage } from '@/components/NotionPage'
import { WorksPageCards } from '@/components/WorksPageCards'
import { domain } from '@/lib/config'
import { resolveNotionPage } from '@/lib/resolve-notion-page'

export const getStaticProps = async () => {
  try {
    // /works sayfası için Notion sayfa ID'sini doğrudan kullanıyoruz
    // site.config.ts'deki navigationLinks'te: Works -> '302392488fe580d4824accf5851dfe96'
    // Force revalidation check: 4
    const props = await resolveNotionPage(domain, '302392488fe580d4824accf5851dfe96')

    return { props, revalidate: 10 }
  } catch (err) {
    console.error('works page error', domain, err)

    // we don't want to publish the error version of this page, so
    // let next.js know explicitly that incremental SSG failed
    throw err
  }
}

export default function WorksPage(props: PageProps) {
  // NotionPage'i kullanarak header, navigation ve dark mode desteğini koruyoruz
  // customContent prop'u ile WorksPageCards'ı gösteriyoruz
  return (
    <NotionPage
      {...props}
    />
  )
}
