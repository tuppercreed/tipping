import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleLeft, faAngleRight, faArrowRight, faArrowRightLong } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';

export function SelectRound(props: { round: number }) {
    const roundText = props.round ? <h2 className='text-xl text-center'>Round: {props.round}</h2> : <h2 className='text-xl text-center'>Overall</h2>;

    return (
        <div className='sticky z-50 top-0 p-1 bg-teal-100 text-teal-800 flex flex-row justify-center items-center gap-2 md:gap-4'>
            <Link href={`/round/${encodeURIComponent(props.round - 1)}`}><a><FontAwesomeIcon icon={faAngleLeft} size='2x' /></a></Link>
            {roundText}
            <Link href={`/round/${encodeURIComponent(props.round + 1)}`}><a><FontAwesomeIcon icon={faAngleRight} size='2x' /></a></Link>

        </div>
    )
}

