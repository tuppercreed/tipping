import React from "react";

export function HCell({ children, className }: {
    children: React.ReactNode,
    className?: string
}) {
    return (
        <th className={`
            text-[0px] first-letter:text-base sm:text-base
            ${className ?? ''}`}>
            {children}
        </th>
    )
}

export function Cell({ children, className }: {
    children: React.ReactNode,
    className?: string
}) {
    return (
        <td className={`
            min-w-[35px] 
            ${className ?? ''}
        `}>
            {children}
        </td>
    )
}

export function Heading({ children, className }: {
    children: React.ReactNode,
    className?: string,
}) {
    return (
        <thead>
            <tr className={`
            font-bold text-center
            border-b border-sky-700/25 text-slate-100
            ${className ?? ''}
        `}>
                {children}
            </tr>
        </thead>
    )
}

export function Row({ children, className }: {
    children: React.ReactNode,
    className?: string,
}) {
    return (
        <tr className={`
            odd:bg-sky-500/25 even:bg-sky-600/25
            hover:odd:bg-sky-300/25 hover:even:bg-sky-800/25
            border-b border-sky-700/25
            text-center
            ${className ?? ''}
        `}>
            {children}
        </tr>
    )
}

export function Table({ children, heading, className }: {
    children: React.ReactNode,
    heading?: JSX.Element,
    className?: string
}) {
    return (
        <table className={`
        border-collapse table-auto overflow-scroll
        w-full
        ${className ?? ''}
    `}>
            {heading}
            <tbody>
                {children}
            </tbody>

        </table>
    )
}

