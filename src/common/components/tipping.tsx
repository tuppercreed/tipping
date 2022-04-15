import React, { useState } from 'react'
import Image, { StaticImageData } from 'next/image'
import { Game, Team } from '../utils/game';
import { supabase } from '../../modules/supabase/client';
import { Session } from '@supabase/supabase-js';


function Team(props: {
    team: Team, game: Game, handleClick: (team: Team, game: Game) => void
}) {
    const logoPath = `/teamLogos/${props.team.team_name.replaceAll(' ', '_')}.svg`;


    return (
        <div onClick={() => props.handleClick(props.team, props.game)} className='m-1 mtall:md:m-2 tall:m-2 rounded-3xl hoverable:hover:ring-4 ring-lime-500 border-2 mtall:md:border-4 border-fuchsia-200 shadow-md flex-grow flex flex-col justify-center'>
            <div className='m-1 mtall:md:m-2 tall:m-2 min-w-[30vw] min-h-[10vh] relative max-w-full flex-grow'>
                <Image src={logoPath} alt={`Logo of ${props.team.team_name}`} className='h-auto' layout='fill' objectFit='contain' />
            </div>
            <h2 className='text-xl mtall:md:text-2xl tall:text-2xl text-center my-1 md:my-2 tall:my-2'>{props.team.team_name}</h2>

        </div>
    )
}

export function SelectTeam(props: { homeTeam: Team, awayTeam: Team, game: Game, handleClick: (team: Team, game: Game) => void }) {

    function handleClick(team: Team, game: Game) {
        console.log(`Clicked Team: ${team.team_name}`)
        props.handleClick(team, game)
    }

    return (
        <div className='flex flex-col md:flex-row tall:flex-col gap-1 items-stretch justify-center min-h-[10vh] grow-[4]'>
            <Team handleClick={handleClick} team={props.homeTeam} game={props.game} />
            <Team handleClick={handleClick} team={props.awayTeam} game={props.game} />
        </div>
    )
}

export function SelectTips(props: { games: Game[], session: Session }) {
    const [step, setStep] = useState<number>(0);
    const [tips, setTips] = useState<[Team, Game][]>(Array(props.games.length).fill(null));

    function handleClick(team: Team, game: Game) {
        console.log(`Big boss for ${team.team_name}`)
        const oldTips = tips.slice();
        oldTips[step] = [team, game];
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

        const tipsApi = tips.map((tip) => {
            return {
                person_id: props.session.user!.id,
                game_id: tip[1].game_id,
                team_id: tip[0].team_id
            }
        });

        console.log("Request: ", JSON.stringify(tipsApi));

        const { data, error } = await supabase.from('tip').upsert(tipsApi, { returning: 'minimal' });

        console.log("Data: ", JSON.stringify(data));
        console.log("Error: ", JSON.stringify(error));



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
                {step < props.games.length && <SelectTeam homeTeam={props.games[step].homeTeamObj} awayTeam={props.games[step].awayTeamObj} game={props.games[step]} handleClick={handleClick} />}
                {step > 0 && <input type="button" value="Back" onClick={handleBack} className='grow-[0.3] bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 md:p-4 tall:p-4 rounded m-1 md:m-2 tall:m-2' />}
                {/* Invisible button on first page so that other elements don't jump around */}
                {step === 0 && <input type="button" value="Back" className='grow-[0.3] invisible bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 md:p-4 tall:p-4 rounded m-1 md:m-2 tall:m-2' />}
                {step === props.games.length && <input type="submit" value="Done" className='grow bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 md:p-4 tall:p-4 rounded m-1 md:m-2 tall:m-2' />}
            </form>
        </>
    )
}