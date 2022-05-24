import Head from "next/head"
import React from "react"
import { Footer } from "./footer"
import { MobileMenu } from "./menu"

export function Layout({ children, props }: { children: React.ReactNode, props: any }) {
    return (
        <>
            <Head>
                <title>Tipping</title>
            </Head>

            <div className="h-full flex flex-col">
                <main className="bg-gradient-to-b from-sky-600 to-teal-600 text-white flex-grow flex flex-col items-center bg-teal-100">
                    {children}
                </main>

                <Footer />

                <MobileMenu />
            </div>

        </>
    )
}