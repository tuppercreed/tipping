import '../styles/globals.css'
import type { AppProps } from 'next/app'
import React from 'react'
import { Layout } from '../common/components/layout'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Layout props={pageProps}>
      <Component {...pageProps} />
    </Layout>

  )
}

export default MyApp
