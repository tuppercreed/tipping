import React, { useState } from 'react'
import Image, { StaticImageData } from 'next/image'


function Team(props: {
    teamName: string, handleClick: (teamName: string) => void
}) {
    const logoPath = `/teamLogos/${props.teamName.replaceAll(' ', '_')}.svg`;


    return (
        <div onClick={() => props.handleClick(props.teamName)} className='m-1 mtall:md:m-2 tall:m-2 rounded-3xl hoverable:hover:ring-4 ring-lime-500 border-2 mtall:md:border-4 border-fuchsia-200 shadow-md flex-grow flex flex-col justify-center'>
            <div className='m-1 mtall:md:m-2 tall:m-2 min-w-[30vw] min-h-[10vh] relative max-w-full flex-grow'>
                <Image src={logoPath} alt={`Logo of ${props.teamName}`} className='h-auto' layout='fill' objectFit='contain' />
            </div>
            <h2 className='text-xl mtall:md:text-2xl tall:text-2xl text-center my-1 md:my-2 tall:my-2'>{props.teamName}</h2>

        </div>
    )
}

export function SelectTeam(props: { homeTeam: string, awayTeam: string, handleClick: (teamName: string) => void }) {

    function handleClick(teamName: string) {
        console.log(`Clicked Team: ${teamName}`)
        props.handleClick(teamName)
    }

    return (
        <div className='flex flex-col md:flex-row tall:flex-col gap-1 items-stretch justify-center min-h-[10vh] grow-[4]'>
            <Team handleClick={handleClick} teamName={props.homeTeam} />
            <Team handleClick={handleClick} teamName={props.awayTeam} />
        </div>
    )
}

export function SelectTips(props: { games: { homeTeam: string, awayTeam: string }[] }) {
    const [step, setStep] = useState<number>(0);
    const [tips, setTips] = useState<string[]>(Array(props.games.length).fill(null));

    function handleClick(teamName: string) {
        console.log(`Big boss for ${teamName}`)
        const oldTips = tips.slice();
        oldTips[step] = teamName;
        setTips(oldTips);
        setStep(step + 1);
    }

    function handleBack() {
        if (step > 0) {
            setStep(step - 1)
        }
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const JSONdata = JSON.stringify({ tips: tips });
        const endpoint = '/api/form';

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSONdata,
        }

        const response = await fetch(endpoint, options);

        const result: { data: string } = await response.json();

        if (response.ok) {
            alert(result.data)
        }


    }

    return (
        <>
            <form onSubmit={handleSubmit} className='flex-grow flex flex-row mtall:flex-col justify-evenly items-stretch'>
                {step < props.games.length && <SelectTeam homeTeam={props.games[step].homeTeam} awayTeam={props.games[step].awayTeam} handleClick={handleClick} />}
                {step > 0 && <input type="button" value="Back" onClick={handleBack} className='grow-[0.3] bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 md:p-4 tall:p-4 rounded m-1 md:m-2 tall:m-2' />}
                {/* Invisible button on first page so that other elements don't jump around */}
                {step === 0 && <input type="button" value="Back" className='grow-[0.3] invisible bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 md:p-4 tall:p-4 rounded m-1 md:m-2 tall:m-2' />}
                {step === props.games.length && <input type="submit" value="Done" className='grow bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 md:p-4 tall:p-4 rounded m-1 md:m-2 tall:m-2' />}
            </form>
        </>
    )
}