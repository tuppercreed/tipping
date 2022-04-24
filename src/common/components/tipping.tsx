import React, { useState, useEffect } from 'react'
import Image, { StaticImageData } from 'next/image'
import { Game, GamesApiToGames, readGames, Team } from '../utils/game';
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

export function SelectTips(props: { games: Game[], step: number, tips: [Team, Game][], handleChoice: (team: Team, game: Game) => void, handleBack: () => void, handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void }) {
    return (
        <>
            <form onSubmit={props.handleSubmit} className='flex-grow flex flex-row mtall:flex-col justify-evenly items-stretch'>
                {props.step < props.games.length && <SelectTeam homeTeam={props.games[props.step].homeTeamObj} awayTeam={props.games[props.step].awayTeamObj} game={props.games[props.step]} handleClick={props.handleChoice} />}
                {props.step > 0 && <input type="button" value="Back" onClick={props.handleBack} className='grow-[0.3] bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 md:p-4 tall:p-4 rounded m-1 md:m-2 tall:m-2' />}
                {/* Invisible button on first page so that other elements don't jump around */}
                {props.step === 0 && <input type="button" value="Back" className='grow-[0.3] invisible bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 md:p-4 tall:p-4 rounded m-1 md:m-2 tall:m-2' />}
                {props.step === props.games.length && <input type="submit" value="Done" className='grow bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 md:p-4 tall:p-4 rounded m-1 md:m-2 tall:m-2' />}
            </form>
        </>
    )
}

export function Tips(props: { defaultRound: number, session: Session }) {
    const [round, setRound] = useState<number>(props.defaultRound);
    const [games, setGames] = useState<Game[] | null>(null);
    const [step, setStep] = useState<number>(0);
    const [tips, setTips] = useState<[Team, Game][]>([]);

    // Query database when round selection is changed
    useEffect(() => {
        async function handleRoundChange() {
            const data = await readGames(round);
            setGames(GamesApiToGames(data));
        }

        handleRoundChange()

    }, [round]);

    // When the list of games changes, reset tips
    useEffect(() => {
        setStep(0);
        setTips(Array(games?.length).fill(null));
    }, [games]);

    function handleChoice(team: Team, game: Game) {
        const oldTips = tips.slice();
        oldTips[step] = [team, game];
        setTips(oldTips);
        setStep(step + 1);
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const tipsApi = tips.map((tip) => {
            return {
                person_id: props.session.user!.id,
                game_id: tip[1].game_id,
                team_id: tip[0].team_id,
            };
        });

        const { data, error } = await supabase.from('tip').upsert(tipsApi, { returning: 'minimal' });
    }

    return (
        <div>
            <button onClick={() => setRound(round - 1)}>Previous</button>
            <h2 className='text-xl text-center'>Round: {round}</h2>
            <button onClick={() => setRound(round + 1)}>Next</button>

            {!games ? <p>No games</p> : <SelectTips games={games} step={step} tips={tips} handleChoice={handleChoice} handleBack={() => { if (step > 0) { setStep(step - 1) } }} handleSubmit={handleSubmit} />}
        </div>
    );
}