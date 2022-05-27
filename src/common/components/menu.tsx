import React, { useEffect, useRef, useState } from 'react';
import { Listbox, Menu } from '@headlessui/react';
import { faUserGroup, faPen, faChartSimple, faEllipsisVertical, faAngleLeft, faAngleRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon, FontAwesomeIconProps } from '@fortawesome/react-fontawesome';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { animated, useSpring } from '@react-spring/web';
import { IconProp } from '@fortawesome/fontawesome-svg-core';

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

function MyListBox(props: { round: number }) {
    const rounds = Array.from({ length: 23 }, (_, i) => i + 1);
    const [selectedRound, setSelectedRound] = useState(props.round);

    return (
        <Listbox value={selectedRound} onChange={setSelectedRound}>
            <Listbox.Button><span className='truncate'>{selectedRound ? `Round ${selectedRound}` : 'Select Round'}</span></Listbox.Button>
            <Listbox.Options
                className='absolute mb-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm'
            >{rounds.map((round) => <Listbox.Option key={round} value={round}>Round {round}</Listbox.Option>)}</Listbox.Options>
        </Listbox>
    )
}

function MenuButton({ pathname, query, ...rest }: {
    pathname: string,
    query: {
        round?: number,
        comp?: number,
    },
    icon: IconProp,
} & FontAwesomeIconProps) {
    // Remove query parameters that have an undefined value
    (Object.keys(query) as Array<keyof typeof query>).forEach(key => query[key] === undefined ? delete query[key] : {});
    return (
        <Link href={{ pathname, query }}>
            <a>
                <FontAwesomeIcon {...rest} />
            </a>
        </Link>
    )
}

export function MobileMenu({ round: stateRound }: {
    round?: number,
}) {
    // Match links to pre-existing route
    const router = useRouter();
    const { round: routerRound, comp: routerComp } = router.query;

    const round = Number(routerRound) || stateRound;
    const comp = Number(routerComp) || undefined;

    return (
        <div className={`sticky bottom-0 
        bg-teal-100 py-2 px-4 text-teal-800 
        shadow-[0_-4px_6px_-1px_rgba(0_0_0_/_0.1),_0_-2px_4px_-2px_rgb(0_0_0_/_0.1)]
        flex justify-between items-center
        `}>
            <div aria-hidden='true'></div>
            <div
                className={` 
        flex justify-center gap-8 items-center
        `}>
                {round && <MenuButton pathname={router.pathname} query={{ comp, round: round - 1 }} icon={faAngleLeft} size='1x' />}
                <MenuButton pathname={comp ? '/comp/[comp]/[round]' : '/comp'} query={{ round, comp }} icon={faUserGroup} size='1x' />
                <MenuButton pathname={round ? '/tip/[round]' : '/tip'} query={{ round }} icon={faPen} size='2x' />
                <MenuButton pathname='/ladder' query={{}} icon={faChartSimple} size='1x' rotation={90} />
                {round && <MenuButton pathname={router.pathname} query={{ comp, round: round + 1 }} icon={faAngleRight} size='1x' />}

            </div>

            <Menu as='div' className=''>
                <Menu.Button><FontAwesomeIcon icon={faEllipsisVertical} size='1x' className='' /></Menu.Button>
                <Menu.Items className='absolute right-0 bottom-8 m-2 p-2 w-56 origin-bottom-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus: outline-none'>
                    <Menu.Item>
                        <input type='button' value='Login or SignUp' />
                    </Menu.Item>
                    <Menu.Item>
                        <MyListBox round={Number(round)} />
                    </Menu.Item>
                    <Menu.Item>
                        <p>Other Thing</p>
                    </Menu.Item>
                </Menu.Items>
            </Menu>
        </div>
    )
}