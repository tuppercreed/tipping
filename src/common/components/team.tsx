import React from 'react';
import Image from 'next/image';

export const logoPath = (teamName: string) => {
    return `/teamLogos/${teamName.replaceAll(' ', '_')}.svg`;
}

export function TeamLogo(props: { size: 'big' | 'small'; teamName: string; className?: string }) {
    let size = '';

    switch (props.size) {
        case 'big':
            size = 'w-28 h-28';
            break;
        case 'small':
            size = 'w-6 h-6 sm:w-10 sm:h-10';
            break;
    }


    return (
        <div className={`relative max-w-full ${size} ${props.className}`}>
            <Image src={logoPath(props.teamName)} alt={`Logo of ${props.teamName}`} className='h-auto' layout='fill' objectFit='contain' />
        </div>
    );
}
