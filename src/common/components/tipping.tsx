import React, { useState, useEffect } from 'react'
import { readGames, readTips } from '../utils/game';
import { Game, gamesSupabaseToGames, Team, teamSupabase } from '../utils/objects';
import { supabase } from '../../modules/supabase/client';
import { PostgrestError, Session } from '@supabase/supabase-js';
import { format, isFuture, isPast } from 'date-fns';
import { useHistory, useRound } from '../hooks/tips';
import bg from '../../../public/background.jpg';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleLeft, faAngleRight, faArrowRight, faArrowRightLong } from '@fortawesome/free-solid-svg-icons';
import { AppConfig } from '../utils/app.config';
import { config } from 'process';
import Link from 'next/link';
import { SelectTeam } from './match';

export function ProgressElem(props: { content: string, saved: boolean, started: boolean, default: boolean, current: boolean, onClick: () => void }) {
    return (
        <>
            <li
                className={`${props.started ? 'text-gray-500' : ' '} ${props.current ? 'underline' : ' '} `}
            >
                {props.started ? <span>{props.content}{props.default && '*'}</span> : <button onClick={props.onClick} className={`${props.saved ? ' ' : 'italic'}`}>{props.content}{props.default && '*'}</button>}
            </li>
            <li><FontAwesomeIcon icon={faArrowRightLong} /></li>
        </>
    )
}

export function Progress(props: { games: { upcoming: Game[], started: Game[] }, tips: [Team, Game][], session: Session, step: number, stepHandler: (newStep: number) => void }) {
    const gather = (game: Game, tips: [Team, Game][], i: number, started: boolean, current: boolean) => {
        let [key, saved, def, content] = [game.game_id, true, false, '-'];

        if (!started && tips[i]) { saved = false; content = tips[i][0].abbreviation!; }
        else if (game.homeTeamObj.tipped(props.session!.user!.id)) content = game.homeTeamObj.abbreviation!
        else if (game.awayTeamObj.tipped(props.session!.user!.id)) content = game.awayTeamObj.abbreviation!
        else if (started) { def = true; content = game.awayTeamObj.abbreviation!; }


        return <ProgressElem key={key} content={content} saved={saved} started={started} default={def} current={current} onClick={() => props.stepHandler(i)} />

    }

    let startedElems = props.games.started.map((game, i) => {
        return gather(game, props.tips, i, true, false)
    });


    let upcomingElems = props.games.upcoming.map((game, i) => {
        return gather(game, props.tips, i, false, (i === props.step));
    });

    return (
        <ol className='my-2 mx-1 md:mx-2 list-none flex flex-row flex-wrap gap-1 md:gap-4 place-items-center content-center justify-evenly'>
            {startedElems}
            {upcomingElems}
            {/* Clickable submit button that jumps to one more than last upcoming game*/}
            <li key="submit"><button className='italic' onClick={() => props.stepHandler(props.games.upcoming.length)}>Submit</button></li>
        </ol>
    )
}

export function SelectRound(props: { round: number }) {
    const roundText = props.round ? <h2 className='text-xl text-center'>Round: {props.round}</h2> : <h2 className='text-xl text-center'>Overall</h2>;

    const cycleRound = (round: number, change: number) => {
        if (round + change < 0) return AppConfig.roundMax
        else if (round + change <= AppConfig.roundMax) return round + change
        else return 0
    };

    return (
        <div className='flex flex-row justify-center items-center gap-2 md:gap-4'>
            <Link href={`/round/${encodeURIComponent(props.round - 1)}`}><a><FontAwesomeIcon icon={faAngleLeft} /></a></Link>
            {roundText}
            <Link href={`/round/${encodeURIComponent(props.round + 1)}`}><a><FontAwesomeIcon icon={faAngleRight} /></a></Link>

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

    const allGamesDone = <h3 className='my-12 text-3xl text-center'>All games started or completed for this round.</h3>;

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
        <div className='flex flex-col flex-grow'>

            <SelectRound round={round} />


            {games.upcoming.length > 0 && <Progress games={games} tips={tips} session={props.session} step={step} stepHandler={(newStep: number) => setStep(newStep)} />}
            {games.upcoming.length === 0 && allGamesDone}


            {games.upcoming.length > 0 &&
                <form onSubmit={(e) => props.handleSubmit(e, tips)} className='flex-grow flex flex-row mtall:flex-col justify-evenly items-stretch'>
                    {step < games.upcoming.length && <SelectTeam session={props.session} homeTeam={games.upcoming[step].homeTeamObj} awayTeam={games.upcoming[step].awayTeamObj} game={games.upcoming[step]} games={games.started} handleClick={handleChoice} round={round} />}
                    {step === games.upcoming.length && <input type="submit" value="Done" className='grow bg-blue-500 hover:bg-blue-700 text-white text-4xl py-1 px-2 md:p-4 tall:p-4 rounded m-1 md:m-2 tall:m-2' />}
                    {step > 0 && <input type="button" value="Back" onClick={() => { if (step > 0) { setStep(step - 1) } }} className='grow-[0.3] bg-blue-500 hover:bg-blue-700 text-white text-3xl py-1 px-2 md:p-4 tall:p-4 rounded m-1 md:m-2 tall:m-2' />}
                    {/* Invisible button on first page so that other elements don't jump around */}
                    {step === 0 && <input type="button" value="Back" className='grow-[0.3] invisible bg-blue-500 hover:bg-blue-700 text-white text-3xl py-1 px-2 md:p-4 tall:p-4 rounded m-1 md:m-2 tall:m-2' />}
                </form>}
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
        <>
            {(submissionError === undefined) && <SelectTips session={props.session} defaultRound={props.defaultRound} handleSubmit={handleSubmit} />}
            {(submissionError !== undefined) && ((submissionError === null) ? <p>Submission success!</p> : <p>Submission failure!</p>)}
        </>
    );
}