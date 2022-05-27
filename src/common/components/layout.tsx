import Head from "next/head"
import React from "react"
import { Footer } from "./footer"
import { MobileMenu } from "./menu"

export function Layout({ children, round, title, className }: {
    children: React.ReactNode,
    round?: number,
    title?: string,
    className?: string,
}) {
    return (
        <>
            <Head>
                <title>{title ? `Tipping - ${title}` : 'Tipping'}</title>
            </Head>

            <div className="h-full flex flex-col">
                <main className={`
                    bg-gradient-to-b from-sky-600 to-teal-600 
                    text-white bg-teal-100 
                    flex-grow
                    flex flex-col items-center
                `}>
                    <div className={`
                    my-4
                    flex-grow flex flex-col items-stretch gap-4
                    w-full sm:w-[90vw] md:w-[80vw] lg:w-[70vw] xl:w-[60vw]
                    ${className ?? ''}
                    `}>
                        {title && <h1 className="text-3xl">{title}</h1>}

                        {children}
                    </div>
                </main>

                <Footer />

                <MobileMenu {...{ round }} />
            </div>

        </>
    )
}