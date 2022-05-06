import React, { useState } from 'react';
import { Data, Game, Team } from '../utils/objects';
import { Session } from '@supabase/supabase-js';
import Image, { StaticImageData } from 'next/image'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion';

export function Match(props: { content: Data, session: Session, round: number }) {
    const gameIds = props.content.rounds[props.round].map((match) => match.gameId);

    const [expanded, setExpanded] = useState<false | number>(0);

    return (
        <div className='bg-gradient-to-r from-cyan-500 to-blue-500'>
            {gameIds.map((gameId) => (
                <SelectTeam
                    session={props.session}
                    expanded={expanded}
                    setExpanded={setExpanded}
                    gameId={gameId}
                    content={props.content}
                    handleClick={(team, game) => 1 + 1}
                    round={props.round}
                />
            )
            )}
        </div>
    )
}

export function SelectTeam(props: { expanded: false | number, setExpanded: React.Dispatch<React.SetStateAction<number | false>>, session: Session; gameId: number, content: Data, handleClick: (team: Team, game: Game) => void, round: number, }) {
    const isOpen = (props.gameId === props.expanded);

    return (
        <div className='flex flex-col items-center m-2 p-1 md:px-2 tall:py-2 bg-clip-padding backdrop-filter backdrop-blur-xl bg-opacity-60 bg-white border border-gray-200 rounded shadow-md'>
            <div
                onClick={() => props.setExpanded(isOpen ? false : props.gameId)}
                className='grid grid-cols-6 md:grid-cols-7 tall:grid-cols-6 grid-rows-3 md:grid-rows-3 tall:grid-rows-4 gap-2'
            >
                <MatchSelector session={props.session} game={props.content.games[props.gameId]} teamClick={props.handleClick} />
            </div>

            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        key="content"
                        initial="collapsed"
                        animate="open"
                        exit="collapsed"
                        variants={{
                            open: { opacity: 1, height: 'auto', width: 'auto' },
                            collapsed: { opacity: 0, height: 0, width: 250 }
                        }}
                        transition={{ duration: 0.8 }}
                    >

                        <div className='separator p-4'>
                            history
                        </div>
                        <div className='grid grid-cols-2 md:grid-cols-7 grid-rows-3'>
                            <History gameId={props.gameId} content={props.content} />
                        </div>

                    </motion.div>
                )}
            </AnimatePresence>


        </div>
    );
}

export function MatchSelector(props: { session: Session, game: Game, teamClick: (team: Team, game: Game) => void }) {
    return (
        <>
            <TeamCard handleClick={props.teamClick} game={props.game} home={true} session={props.session} />
            <div className='row-start-3 md:row-start-2 col-start-3 md:col-start-4 col-span-2 md:col-span-1 tall:row-start-4 tall:col-start-3 tall:col-span-2'>
                <p className='text-center'>{props.game.venue}</p>
                <p className='text-center'>{format(props.game.scheduled, 'p')}</p>

            </div>
            <TeamCard handleClick={props.teamClick} game={props.game} home={false} session={props.session} />
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
        score = <p className={`col-span-1 ${props.home ? 'col-start-3 tall:col-start-2' : 'col-start-4 md:col-start-5 tall:col-start-5'} row-start-2 tall:row-start-4 m-1 tall:md:m-2 tall:m-2 text-2xl ${winner ? 'font-bold' : 'font-normal'} text-center`}>{team.score}</p>;
    }

    return (
        <>
            {score}
            <div
                onClick={(e) => {
                    e.stopPropagation();
                    props.handleClick(team, props.game)
                }}
                className={`${tipColor} row-span-3 tall:row-span-3 col-span-2 md:col-span-2 tall:col-span-3 ${props.home ? 'col-start-1' : 'col-start-5 md:col-start-6 tall:col-start-4'} flex items-center justify-around hoverable:hover:ring-4 ring-gray-200`}
            >
                <div className='w-28 h-28 relative max-w-full'>
                    <Image src={logoPath} alt={`Logo of ${team.team_name}`} className='h-auto' layout='fill' objectFit='contain' />
                </div>

            </div>
        </>
    )
}

const logoPath = (teamName: string) => {
    return `/teamLogos/${teamName.replaceAll(' ', '_')}.svg`;
}

function History(props: { gameId: number, content: Data }) {
    const game = props.content.games[props.gameId];
    const oldRounds: number[] = [];
    for (let i = game.round.number - 1; i > 0 && i >= game.round.number - 3; i--) {
        oldRounds.push(i)
    }

    const histories = [{ team: game.homeTeamObj, home: true }, { team: game.awayTeamObj, home: false }].map(({ team, home }) => {
        return (
            <div className={`row-span-3 row-start-1 col-span-1 md:col-span-3 ${home ? 'col-start-1' : 'col-start-2 md:col-start-5'}  grid grid-cols-6 grid-rows-3 gap-4 `}>
                <div className={`m-auto ${home ? 'col-start-1' : 'col-start-5'} col-span-2 row-span-3 w-20 h-20 relative max-w-full`}>
                    <Image src={logoPath(team.team_name)} alt={`Logo of ${team.team_name}`} className='h-auto' layout='fill' objectFit='contain' />

                </div>

                <TeamHistory teamId={team.team_id} rounds={oldRounds} content={props.content} left={home} />

            </div>
        );
    });

    return (
        <>
            {histories}
            {oldRounds.map((round) => <p key={round} className='hidden md:block md:col-start-4 text-center m-auto '>Round {round}</p>)}
        </>
    )
}

function TeamHistory(props: { teamId: number, rounds: number[], left: boolean, content: Data }) {
    const lines = props.rounds.filter((round) => {
        if (props.teamId in props.content.history) {
            if (round in props.content.history[props.teamId]) {
                return true;
            }
        }
        return false
    }).map((round, i) => (
        <TeamHistoryLine key={props.teamId} teamId={props.teamId} row={i} left={props.left} game={props.content.games[props.content.history[props.teamId][round].gameId]} />
    ));

    return (
        <>
            {lines}
        </>
    )
}

const getHomeOrAwayTeam = (home: boolean, game: Game) => {
    return home ? game.homeTeamObj : game.awayTeamObj
}

const getWinner = (home: boolean, game: Game) => {
    return home ? game.homeIsWinner() : game.awayIsWinner()
}

function TeamHistoryLine(props: { teamId: number, game: Game, row: number, left: boolean }) {
    const focusIsHome = (props.game.homeTeamObj.team_id === props.teamId);
    const outer = getHomeOrAwayTeam(focusIsHome, props.game);
    const inner = getHomeOrAwayTeam(!focusIsHome, props.game);

    let rowNum;
    if (props.row === 0) { rowNum = 'row-start-1' }
    else if (props.row === 1) { rowNum = 'row-start-2' }
    else { rowNum = 'row-start-3' }


    return (
        <>
            <TeamHistoryScore home={focusIsHome} winner={getWinner(focusIsHome, props.game)} left={props.left} row={rowNum} score={outer.score} />
            <TeamHistoryScore home={!focusIsHome} winner={getWinner(!focusIsHome, props.game)} left={!props.left} row={rowNum} score={inner.score} />
            <div className={`m-auto w-10 h-10 relative max-w-full ${rowNum} ${props.left ? 'col-start-5' : 'col-start-1'} col-span-2`}>
                <Image src={logoPath(inner.team_name)} alt={`Logo of ${inner.team_name}`} className='h-auto' layout='fill' objectFit='contain' />
            </div>
        </>
    )


}

function TeamHistoryScore(props: { home: boolean, winner: boolean | null | undefined, left: boolean, row: string, score: number | null | undefined }) {
    const underline = props.home ? 'underline' : 'no-underline';
    const bold = props.winner ? 'font-bold' : 'font-normal';
    const col = props.left ? 'col-start-3' : 'col-start-4';
    return (
        <span className={`m-auto ${underline} ${bold} ${col} ${props.row}`}>{props.score}</span>
    )
}
