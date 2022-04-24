import React, { useState, useEffect } from 'react'
import Image, { StaticImageData } from 'next/image'
import { readGames, readTips } from '../utils/game';
import { Game, gamesSupabaseToGames, Team } from '../utils/objects';
import { supabase } from '../../modules/supabase/client';
import { PostgrestError, Session } from '@supabase/supabase-js';
import { isFuture, isPast } from 'date-fns';
import { useRound } from '../hooks/tips';


function TeamCard(props: {
    session: Session, team: Team, game: Game, handleClick: (team: Team, game: Game) => void
}) {
    const logoPath = `/teamLogos/${props.team.team_name.replaceAll(' ', '_')}.svg`;


    return (
        <div onClick={() => props.handleClick(props.team, props.game)} className='m-1 mtall:md:m-2 tall:m-2 rounded-3xl hoverable:hover:ring-4 ring-lime-500 border-2 mtall:md:border-4 border-fuchsia-200 shadow-md flex-grow flex flex-col justify-center'>
            <div className='m-1 mtall:md:m-2 tall:m-2 min-w-[30vw] min-h-[10vh] relative max-w-full flex-grow'>
                <Image src={logoPath} alt={`Logo of ${props.team.team_name}`} className='h-auto' layout='fill' objectFit='contain' />
            </div>
            <h2 className='text-xl mtall:md:text-2xl tall:text-2xl text-center my-1 md:my-2 tall:my-2'>{props.team.team_name}</h2>
            {props.team.tipped(props.session!.user!.id) && <p>Tipped</p>}

        </div>
    )
}

export function SelectTeam(props: { session: Session, homeTeam: Team, awayTeam: Team, game: Game, handleClick: (team: Team, game: Game) => void }) {

    function handleClick(team: Team, game: Game) {
        console.log(`Clicked Team: ${team.team_name}`)
        props.handleClick(team, game)
    }

    return (
        <div className='flex flex-col md:flex-row tall:flex-col gap-1 items-stretch justify-center min-h-[10vh] grow-[4]'>
            <TeamCard handleClick={handleClick} team={props.homeTeam} game={props.game} session={props.session} />
            <TeamCard handleClick={handleClick} team={props.awayTeam} game={props.game} session={props.session} />
        </div>
    )
}

export function SelectTips(props: { session: Session, defaultRound: number, handleSubmit: (event: React.FormEvent<HTMLFormElement>, tips: [Team, Game][]) => void }) {
    const [round, setRound] = useState<number>(props.defaultRound);
    // const [games, setGames] = useState<Game[]>([]);
    // Query database when round selection is changed
    const games = useRound(round);
    const [step, setStep] = useState<number>(0);
    const [tips, setTips] = useState<[Team, Game][]>([]);

    const allGamesDone = <p>All games started or completed for this round.</p>;
    const someGamesDone = <div><p>Games already started or complete:</p><ul>{games.started.map((game) => <li key={game.game_id}>{game.homeTeam} vs. {game.awayTeam}</li>)}</ul></div>;

    // When the list of games changes, reset tips
    useEffect(() => {
        readTips(round);
        setStep(0);
        setTips([]);
    }, [games]);

    function handleChoice(team: Team, game: Game) {
        const oldTips = tips.slice();
        oldTips[step] = [team, game];
        setTips(oldTips);
        setStep(step + 1);
    }

    return (
        <div>
            <div>
                <button onClick={() => setRound(round - 1)}>Previous</button>
                <h2 className='text-xl text-center'>Round: {round}</h2>
                <button onClick={() => setRound(round + 1)}>Next</button>
            </div>
            {games.started.length > 0 && (games.upcoming.length > 0 ? someGamesDone : allGamesDone)}
            <form onSubmit={(e) => props.handleSubmit(e, tips)} className='flex-grow flex flex-row mtall:flex-col justify-evenly items-stretch'>
                {step < games.upcoming.length && <SelectTeam session={props.session} homeTeam={games.upcoming[step].homeTeamObj} awayTeam={games.upcoming[step].awayTeamObj} game={games.upcoming[step]} handleClick={handleChoice} />}
                {step > 0 && <input type="button" value="Back" onClick={() => { if (step > 0) { setStep(step - 1) } }} className='grow-[0.3] bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 md:p-4 tall:p-4 rounded m-1 md:m-2 tall:m-2' />}
                {/* Invisible button on first page so that other elements don't jump around */}
                {step === 0 && <input type="button" value="Back" className='grow-[0.3] invisible bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 md:p-4 tall:p-4 rounded m-1 md:m-2 tall:m-2' />}
                {step === games.upcoming.length && <input type="submit" value="Done" className='grow bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 md:p-4 tall:p-4 rounded m-1 md:m-2 tall:m-2' />}
            </form>
        </div>
    )
}


export function Tips(props: { defaultRound: number, session: Session }) {
    const [submissionError, setSubmissionError] = useState<PostgrestError | undefined | null>(undefined);


    async function handleSubmit(event: React.FormEvent<HTMLFormElement>, tips: [Team, Game][]) {
        event.preventDefault();

        const tipsApi = tips.map((tip) => {
            return {
                person_id: props.session.user!.id,
                game_id: tip[1].game_id,
                team_id: tip[0].team_id,
            };
        });

        const { data, error } = await supabase.from('tip').upsert(tipsApi, { returning: 'minimal' });
        setSubmissionError(error);
    }

    return (
        <div>
            {(submissionError === undefined) && <SelectTips session={props.session} defaultRound={props.defaultRound} handleSubmit={handleSubmit} />}
            {(submissionError !== undefined) && ((submissionError === null) ? <p>Submission success!</p> : <p>Submission failure!</p>)}
        </div>
    );
}