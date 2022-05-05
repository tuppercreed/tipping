import React, { useState } from 'react';
import { Game, Team } from '../utils/objects';
import { Session } from '@supabase/supabase-js';
import { useSpring, animated, useTransition } from '@react-spring/web';
import Image, { StaticImageData } from 'next/image'
import { format } from 'date-fns'

export function Match(props: { game: Game, games: { [index: number]: Game }, session: Session, round: number }) {
    return (
        <div className='relative flex-grow'>
            <SelectTeam session={props.session} homeTeam={props.game.homeTeamObj} awayTeam={props.game.awayTeamObj} game={props.game} games={props.games} handleClick={(team, game) => 1 + 1} round={props.round} />
        </div>
    )
}

export function SelectTeam(props: { session: Session; homeTeam: Team; awayTeam: Team; game: Game; games: { [index: number]: Game; }; handleClick: (team: Team, game: Game) => void; round: number; }) {
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
        console.log(`Clicked Team: ${team.team_name}`);
        props.handleClick(team, game);
    }

    return (

        <>
            {transitions(({ opacity }, item) => item ? (
                <animated.div
                    className='flex-grow'
                    style={{ opacity: opacity.to({ range: [0.0, 1.0], output: [0, 1] }) }}
                >
                    <div
                        onClick={() => setHistory(!history)}
                        className='bg-gradient-to-r from-indigo-500 to-pink-500 flex flex-col items-center justify-around p-1 md:px-2 tall:py-2'>
                        <MatchSelector session={props.session} game={props.game} teamClick={props.handleClick} />
                    </div>

                </animated.div>
            ) : (
                <animated.div
                    className='top-0 left-0 absolute w-full h-full'
                    style={{ opacity: opacity.to({ range: [1.0, 0.0], output: [1, 0] }) }}
                >
                    <div
                        onClick={() => setHistory(!history)}
                        className='bg-gradient-to-r from-indigo-500 to-pink-500 flex flex-row items-center justify-around h-full'>
                        <CardHistory game={props.game} home={true} games={props.games} historyClick={() => setHistory(!history)} />
                        <CardHistory game={props.game} home={false} games={props.games} historyClick={() => setHistory(!history)} />
                    </div>

                </animated.div>
            ))}


        </>
    );
}

export function MatchSelector(props: { session: Session, game: Game, teamClick: (team: Team, game: Game) => void }) {
    return (
        <>
            <div className="flex flex-row flex-wrap gap-4 justify-center items-center m-2">
                <TeamCard handleClick={props.teamClick} game={props.game} home={true} session={props.session} />
                <div className='tall:order-3 tall:w-full flex-grow-0'>
                    <p className='text-neutral-100 text-center'>{props.game.venue}</p>
                    <p className='text-neutral-100 text-center'>{format(props.game.scheduled, 'p')}</p>

                </div>
                <TeamCard handleClick={props.teamClick} game={props.game} home={false} session={props.session} />
            </div>
        </>
    )
}

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
        score = <p className={`m-1 basis-10 mtall:md:m-2 tall:m-2 text-2xl ${winner ? 'font-bold' : 'font-normal'}`}>{team.score}</p>;
    }

    return (
        <div
            onClick={(e) => {
                e.stopPropagation();
                props.handleClick(team, props.game)
            }}
            className={`flex-grow ${tipColor}  rounded-xl bg-white bg-clip-padding backdrop-filter backdrop-blur-xl bg-opacity-60 hoverable:hover:ring-4 ring-gray-200  border-2 mtall:md:border-4 shadow-lg flex flex-row justify-center items-center`}
        >
            {!props.home && score}
            <div className='m-1 w-40 h-40 relative max-w-full flex-grow'>
                <Image src={logoPath} alt={`Logo of ${team.team_name}`} className='h-auto' layout='fill' objectFit='contain' />
            </div>
            {props.home && score}

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
        <div onClick={props.historyClick} className="flex flex-row items-center rounded-xl bg-white bg-clip-padding backdrop-filter backdrop-blur-xl bg-opacity-60">
            <div className='m-1 min-w-[10vw] min-h-[15vh] relative max-w-full'>
                <Image src={logoPath} alt={`Logo of ${focusTeam.team_name}`} className='h-auto' layout='fill' objectFit='contain' />
            </div>
            <div className='flex-wrap flex flex-col gap-1 m-3'>

                {games.slice(0, 3).map((game) => {
                    const focusHome = (game[1].homeTeamObj.team_id === focusTeam.team_id);
                    return <MatchHistory game={game[1]} focusHome={focusHome} />;
                })}
            </div>
        </div>
    )
}

export function MatchHistory(props: { game: Game, focusHome: boolean }) {
    // focusHome flips the order so that the focus team is always first
    return (
        <div className='flex flex-row gap-1 items-stretch'>
            <TeamCardHistory game={props.game} focus={true} home={props.focusHome} />
            <TeamCardHistory game={props.game} focus={false} home={!props.focusHome} />
        </div>
    )
}

export function TeamCardHistory(props: { game: Game, focus: boolean, home: boolean }) {
    const team = props.home ? props.game.homeTeamObj : props.game.awayTeamObj;
    const winner = props.home ? props.game.homeIsWinner() : props.game.awayIsWinner();

    const logoPath = `/teamLogos/${team.team_name.replaceAll(' ', '_')}.svg`;

    let stripeDir = props.focus ? 'border-l-4' : 'border-r-4';
    let stripeCol = winner ? 'border-green-500' : 'border-red-500';

    return (
        <div className={`${props.focus ? 'grow' : 'grow-[2]'} ${stripeDir} ${stripeCol} flex flex-row items-center gap-1 py-4 px-2 basis-10`}>
            {!props.home && <span className={`basis-8 ${winner ? 'font-bold' : 'font-normal'}`}>{props.game.awayTeamObj.score}</span>}
            {props.home && <span className={`basis-8 ${winner ? 'font-bold' : 'font-normal'} underline`}>{props.game.homeTeamObj.score}</span>}
            {!props.focus && <div className='min-w-[5vw] min-h-[5vh] relative max-w-full'>
                <Image src={logoPath} alt={`Logo of ${team.team_name}`} className='h-auto' layout='fill' objectFit='contain' />
            </div>}
        </div>
    )
}