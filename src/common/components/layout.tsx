import Head from "next/head"
import React from "react"
import { Footer } from "./footer"

export function Layout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <Head>
                <title>Tipping</title>
            </Head>

            <div className="h-full flex flex-col">
                <main className="flex-grow flex flex-col">
                    <h1 className="text-2xl mtall:text-4xl text-center my-0.5 mtall:my-2">Tipping</h1>
                    {children}
                </main>
                <Footer />
            </div>
        </>
    )
}