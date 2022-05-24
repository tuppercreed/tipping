import React, { useEffect, useRef, useState } from 'react';
import { faUserGroup, faPen, faChartSimple, faEllipsisVertical, faAngleLeft, faAngleRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { animated, useSpring } from '@react-spring/web';

function throttle(callbackFn: (e?: Event) => void, limit: number) {
    let wait = false;
    return function (...args: any[]) {
        if (!wait) {
            wait = true;
            setTimeout(function () {
                callbackFn(args[0]);

                wait = false;
            }, limit);
        }
    }
}

export function MobileMenu(props: {}) {
    // Match links to pre-existing route
    const router = useRouter();
    const { round, comp } = router.query;


    let query: { comp?: string | string[], round?: string | string[] } = {};
    if (round !== undefined) query.round = round;
    if (comp !== undefined) query.comp = comp;
    // Only show left and right arrow when on a page that is round dependent
    const roundChange = (router.pathname.split('/')[1] === 'tip' || router.pathname.split('/')[1] === 'comp');

    return (
        <div
            className={`sticky 
        bottom-0
        bg-teal-100
        flex justify-center gap-8 items-center
        p-2
        text-teal-800
        shadow-[0_-4px_6px_-1px_rgba(0_0_0_/_0.1),_0_-2px_4px_-2px_rgb(0_0_0_/_0.1)]
        `}>
            {round && roundChange && <Link href={{ pathname: router.pathname, query: { ...query, round: Number(round) - 1 } }}>
                <a><FontAwesomeIcon icon={faAngleLeft} size='1x' /></a>
            </Link>}
            <Link
                href={{ pathname: '/comp/[comp]/[round]', query }}
            >
                <a><FontAwesomeIcon icon={faUserGroup} size='1x' /></a>
            </Link>
            <Link
                href={{ pathname: '/tip/[round]', query }}
            >
                <a><FontAwesomeIcon icon={faPen} size='2x' /></a>
            </Link>
            <Link
                href={{ pathname: '/ladder', query }}
            >
                <a><FontAwesomeIcon icon={faChartSimple} size='1x' rotation={90} /></a>
            </Link>
            {round && roundChange && <Link href={{ pathname: router.pathname, query: { ...query, round: Number(round) + 1 } }}>
                <a><FontAwesomeIcon icon={faAngleRight} size='1x' /></a>
            </Link>}
            <FontAwesomeIcon icon={faEllipsisVertical} size='1x' className='absolute right-4' />
        </div>
    )
}