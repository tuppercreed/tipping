import '../styles/globals.css'
import type { AppProps } from 'next/app'
import type { NextPage } from 'next'
import React, { ReactElement, ReactNode } from 'react'
import { Layout } from '../common/components/layout'

type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactElement) => ReactNode
}

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout
}

export default function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  const getLayout = Component.getLayout ?? (
    (page) => <Layout>{page}</Layout>
  )
  return getLayout(<Component {...pageProps} />)

}
