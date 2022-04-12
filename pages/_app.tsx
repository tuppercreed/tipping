import '../styles/globals.css'
import type { AppProps } from 'next/app'
import React from 'react'
import { UserProvider } from '@auth0/nextjs-auth0'
import { Layout } from '../components/layout'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <UserProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>

    </UserProvider>
  )
}

export default MyApp
