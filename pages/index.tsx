import type { PageProps } from '@/lib/types'
import { NotionPage } from '@/components/NotionPage'
import { domain } from '@/lib/config'
import { resolveNotionPage } from '@/lib/resolve-notion-page'

export const getStaticProps = async () => {
  try {
    const props = await resolveNotionPage(domain)

    return { props, revalidate: 10 }
  } catch (err) {
    console.error('page error', domain, err)

    return {
      props: {
        error: {
          statusCode: 500,
          message: 'Error resolving notion page'
        }
      },
      revalidate: 10
    }
  }
}

export default function NotionDomainPage(props: PageProps) {
  return <NotionPage {...props} />
}
