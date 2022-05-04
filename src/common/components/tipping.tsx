import React, { useState, useEffect } from 'react'
import Image, { StaticImageData } from 'next/image'
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
import { useSpring, animated, useTransition } from '@react-spring/web';
import { config } from 'process';
import Link from 'next/link';


function TeamCard(props: {
    session: Session, game: Game, home: boolean, handleClick: (team: Team, game: Game) => void
}) {
    const team = props.home ? props.game.homeTeamObj : props.game.awayTeamObj;
    const winner = props.home ? props.game.homeIsWinner() : props.game.awayIsWinner();


    const logoPath = `/teamLogos/${team.team_name.replaceAll(' ', '_')}.svg`;

    const tipResultColor = () => {
        if (team.tipped(props.session.user!.id)) {
            if (winner === undefined || winner === null) return 'border-indigo-600'
            else if (winner) return 'border-green-500'
            else return 'border-red-500'
        } else return 'border-gray-200'
    };

    const tipColor = tipResultColor();

    let score;
    if (team.score !== undefined && team.score !== null) {
        score = <p className={`m-1 mtall:md:m-2 tall:m-2 text-2xl ${winner ? 'font-bold' : 'font-normal'}`}>{team.score}</p>;
    }

    return (
        <div
            onClick={(e) => {
                e.stopPropagation();
                props.handleClick(team, props.game)
            }}
            className={`${tipColor}  rounded-2xl bg-white bg-clip-padding backdrop-filter backdrop-blur-xl bg-opacity-60 hoverable:hover:ring-4 ring-gray-200  border-4 mtall:md:border-8 shadow-lg flex-grow flex flex-row justify-center items-center`}
        >
            {!props.home && score}
            <div className='m-1 mtall:md:m-2 tall:m-2 min-w-[20vw] min-h-[10vh] relative max-w-full flex-grow'>
                <Image src={logoPath} alt={`Logo of ${team.team_name}`} className='h-auto' layout='fill' objectFit='contain' />
            </div>
            {props.home && score}

        </div>
    )
}

export function MatchSelector(props: { session: Session, game: Game, teamClick: (team: Team, game: Game) => void }) {
    return (
        <>
            <div className="m-1 flex flex-row gap-4 items-stretch justify-center min-h-[10vh]">
                <TeamCard handleClick={props.teamClick} game={props.game} home={true} session={props.session} />
                <TeamCard handleClick={props.teamClick} game={props.game} home={false} session={props.session} />
            </div>
            <p className='text-neutral-100'>{props.game.venue}</p>
            <p className='text-neutral-100'>{format(props.game.scheduled, 'p')}</p>
        </>
    )
}

export function TeamCardHistory(props: { game: Game, focus: boolean, home: boolean }) {
    const team = props.home ? props.game.homeTeamObj : props.game.awayTeamObj;
    const winner = props.home ? props.game.homeIsWinner() : props.game.awayIsWinner();

    const logoPath = `/teamLogos/${team.team_name.replaceAll(' ', '_')}.svg`;

    let stripeDir = props.focus ? 'border-l-4' : 'border-r-4';
    let stripeCol = winner ? 'border-green-500' : 'border-red-500';

    return (
        <div className={`${props.focus ? 'grow' : 'grow-[2]'} ${stripeDir} ${stripeCol} flex flex-row items-center gap-2 p-2`}>
            {!props.home && <span className={`basis-8 ${winner ? 'font-bold' : 'font-normal'}`}>{props.game.awayTeamObj.score}</span>}
            {props.home && <span className={`basis-8 ${winner ? 'font-bold' : 'font-normal'} underline`}>{props.game.homeTeamObj.score}</span>}
            {!props.focus && <div className='min-w-[5vw] min-h-[5vh] relative max-w-full'>
                <Image src={logoPath} alt={`Logo of ${team.team_name}`} className='h-auto' layout='fill' objectFit='contain' />
            </div>}
        </div>
    )
}

export function MatchHistory(props: { game: Game, focusHome: boolean }) {
    // focusHome flips the order so that the focus team is always first
    return (
        <div className='flex flex-row gap-2 items-stretch m-1'>
            <TeamCardHistory game={props.game} focus={true} home={props.focusHome} />
            <TeamCardHistory game={props.game} focus={false} home={!props.focusHome} />
        </div>
    )
}

export function CardHistory(props: { game: Game, games: { [index: number]: Game }, home: boolean, historyClick: () => void }) {
    const focusTeam = props.home ? props.game.homeTeamObj : props.game.awayTeamObj;

    const logoPath = `/teamLogos/${focusTeam.team_name.replaceAll(' ', '_')}.svg`;

    // Get the previous games filtered by this games team_id
    //const games = useHistory(focusTeam.team_id, props.game.round.number);

    const games = Object.values(Object.entries(props.games).filter(([gameId, game]) => (game.homeTeamObj.team_id === focusTeam.team_id || game.awayTeamObj.team_id === focusTeam.team_id)));


    return (
        <div onClick={props.historyClick} className="flex flex-row items-center m-1 rounded-xl bg-white bg-clip-padding backdrop-filter backdrop-blur-xl bg-opacity-60">
            <div className='m-1 min-w-[10vw] min-h-[15vh] relative max-w-full'>
                <Image src={logoPath} alt={`Logo of ${focusTeam.team_name}`} className='h-auto' layout='fill' objectFit='contain' />
            </div>
            <div className='flex-grow flex flex-col gap-2'>

                {games.map((game) => {
                    const focusHome = (game[1].homeTeamObj.team_id === focusTeam.team_id);
                    return <MatchHistory game={game[1]} focusHome={focusHome} />;
                })}
            </div>
        </div>
    )
}

export function SelectTeam(props: { session: Session, homeTeam: Team, awayTeam: Team, game: Game, games: { [index: number]: Game }, handleClick: (team: Team, game: Game) => void, round: number }) {
    const [history, setHistory] = useState(true);

    const transitions = useTransition(history, {
        from: { opacity: 1, transform: 'translate3d(100%,0,0)' },
        enter: { opacity: 1, transform: 'translate3d(0%,0,0)' },
        leave: { opacity: 0, transform: 'translate3d(-50%,0,0)' },
    });

    const { transform, opacity } = useSpring({
        opacity: history ? 1 : 0,
        transform: `perspective(600px) rotateX(${history ? 180 : 0} deg)`,
        config: { mass: 5, tension: 500, friction: 80 },
    });

    function handleClick(team: Team, game: Game) {
        console.log(`Clicked Team: ${team.team_name}`)
        props.handleClick(team, game)
    }

    return (

        <div className='relative '>
            {transitions(({ opacity }, item) =>
                item ? (
                    <animated.div
                        className=''
                        style={{ opacity: opacity.to({ range: [0.0, 1.0], output: [0, 1] }) }}
                    >
                        <div
                            onClick={() => setHistory(!history)}
                            className='bg-gradient-to-r from-indigo-500 to-pink-500 flex flex-col items-center justify-around p-2'>
                            <MatchSelector session={props.session} game={props.game} teamClick={props.handleClick} />
                        </div>

                    </animated.div>
                ) : (
                    <animated.div
                        className='top-0 left-0 absolute'
                        style={{ opacity: opacity.to({ range: [1.0, 0.0], output: [1, 0] }) }}
                    >
                        <div
                            onClick={() => setHistory(!history)}
                            className='bg-gradient-to-r from-indigo-500 to-pink-500 flex flex-row items-center justify-around'>
                            <CardHistory game={props.game} home={true} games={props.games} historyClick={() => setHistory(!history)} />
                            <CardHistory game={props.game} home={false} games={props.games} historyClick={() => setHistory(!history)} />
                        </div>

                    </animated.div >
                )
            )
            }
        </div>
    )
}

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
            <Link href={`/round/${encodeURIComponent(props.round - 1)}`}><FontAwesomeIcon icon={faAngleLeft} /></Link>
            {roundText}
            <Link href={`/round/${encodeURIComponent(props.round + 1)}`}><FontAwesomeIcon icon={faAngleRight} /></Link>

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