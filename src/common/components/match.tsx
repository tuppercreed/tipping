import React, { useState } from 'react';
import { Data, Game, MatchResult, Team, Tips } from '../utils/objects';
import { PostgrestError, Session } from '@supabase/supabase-js';
import Image from 'next/image'
import { format } from 'date-fns'
import { supabase } from '../../modules/supabase/client';
import { AuthDialog } from '../../modules/supabase/components/Auth';
import { useSpring, animated } from '@react-spring/web'
import { useMeasure } from '../hooks/measure';
import { faQuestion } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

function* intersperseDate<X>(a: X[], dates: Date[]) {
    if (a.length !== dates.length) {
        throw new Error('Dates and list need to be the same length to intersperse!');
    }
    let prevDate: Date = new Date(0);
    for (let i = 0; i < dates.length; i++) {
        if (dates[i].getDate() !== prevDate.getDate()) {
            prevDate = dates[i];
            yield (
                <p key={dates[i].getDate()} className='text-xl text-slate-50 m-2'>{format(dates[i], "eeee', ' do' of 'MMMM")}</p>
            );
        }
        yield a[i]

    }
}

export function MatchForm(props: { content: Data, tipsDb: Tips | null, session: Session | null, round: number }) {
    const [submissionError, setSubmissionError] = useState<PostgrestError | undefined | null>(undefined);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>, tips: { teamId: number, gameId: number }[]) {
        event.preventDefault();

        if (props.session !== null) {

            const tipsApi = tips.map(({ teamId, gameId }) => (
                {
                    person_id: props.session!.user!.id,
                    game_id: gameId,
                    team_id: teamId,
                }
            ));

            const { data, error } = await supabase.from('tip').upsert(tipsApi, { returning: 'minimal' });
            setSubmissionError(error);
        } else {
            throw new Error('Session missing from form submission')
        }
    }

    return (
        <>
            {(submissionError === undefined && <MatchFormContent content={props.content} tipsDb={props.tipsDb} session={props.session} round={props.round} handleSubmit={handleSubmit} />)}
            {(submissionError !== undefined) && ((submissionError === null) ? <p>Submission success!</p> : <p>Submission failure!</p>)}
        </>
    )

}

const zipTips = (tips: (number | null)[], games: number[]) => {
    if (tips.length !== games.length) {
        throw new Error('Tips and Games did not have the same length');
    }
    let tipsAndGames: { teamId: number, gameId: number }[] = [];
    for (let i = 0; i < tips.length; i++) {
        if (tips[i] !== null) {
            tipsAndGames.push({ gameId: games[i], teamId: tips[i]! })
        }
    }
    return tipsAndGames;
}

function MatchFormContent(props: { content: Data, tipsDb: Tips | null, session: Session | null, round: number, handleSubmit: (event: React.FormEvent<HTMLFormElement>, tips: { teamId: number, gameId: number }[]) => void }) {
    const gameIds = props.content.rounds[props.round].map((match) => match.gameId);

    const [tips, setTips] = useState<(number | null)[]>(Array(gameIds.length).fill(null));
    const [authModal, setAuthModal] = useState(false);

    const tipSelect = (i: number, teamId: number) => {
        if (props.session) {
            const newTips = tips.slice();
            newTips[i] = teamId;
            setTips(newTips);
        } else {
            setAuthModal(true);
        }
    };

    return (
        <>
            <AuthDialog active={authModal} setActive={setAuthModal} />

            <form onSubmit={(e) => props.handleSubmit(e, zipTips(tips, gameIds))}>
                <Match content={props.content} tipsDb={props.tipsDb} session={props.session} round={props.round} tips={tips} handleTip={tipSelect} />
                {props.session && <input type='submit' value='Done' className='button' />}
            </form>
        </>
    )
}

export function Match(props: { content: Data, tipsDb: Tips | null, session: Session | null, round: number, tips: (number | null)[], handleTip: (i: number, teamId: number) => void }) {
    const gameIds = props.content.rounds[props.round].map((match) => match.gameId);


    const [expanded, setExpanded] = useState<false | number>(0);

    const gameBoxes = gameIds.map((gameId, i) => {
        let tipTeamIdDb = null;
        if (props.session !== null && props.tipsDb !== null && props.session.user!.id in props.tipsDb && gameId in props.tipsDb[props.session.user!.id]) {
            tipTeamIdDb = props.tipsDb[props.session.user!.id][gameId].teamId;
        }

        return <SelectTeam
            key={gameId}
            session={props.session}
            expanded={expanded}
            setExpanded={setExpanded}
            gameId={gameId}
            tipTeamId={props.tips[i]}
            tipTeamIdDb={tipTeamIdDb}
            content={props.content}
            handleClick={(teamId: number) => props.handleTip(i, teamId)}
            round={props.round}
        />;
    })

    const boxes = [...intersperseDate(gameBoxes, gameIds.map((gameId) => props.content.games[gameId].scheduled))];

    return (
        <div className='bg-gradient-to-r from-cyan-500 to-blue-500 py-2 md:p-2 shadow-md rounded'>
            {boxes}
        </div>
    )
}

export function SelectTeam(props: { expanded: false | number, setExpanded: React.Dispatch<React.SetStateAction<number | false>>, session: Session | null, gameId: number, tipTeamId: number | null, tipTeamIdDb: number | null, content: Data, handleClick: (teamId: number) => void, round: number, }) {
    const isOpen = (props.gameId === props.expanded);
    const [ref, height] = useMeasure<HTMLDivElement>();

    const styles = useSpring({
        from: { height: 0, opacity: 0, transform: 'translateY(20px)' },
        to: { height: isOpen ? height : 0, opacity: isOpen ? 1 : 0, transform: `translateY(${isOpen ? 0 : 20}px)` }
    });


    return (
        <div className=' flex flex-col items-stretch m-2 p-1 md:px-2 tall:py-2 bg-clip-padding backdrop-filter backdrop-blur-xl bg-opacity-40 bg-white rounded shadow-md'>
            <div
                onClick={() => props.setExpanded(isOpen ? false : props.gameId)}
                className='grid grid-cols-6 tall:grid-cols-6 md:grid-cols-7 grid-rows-3 tall:grid-rows-4 md:grid-rows-3 gap-1 md:gap-2 h-32 md:h-40 tall:h-52'
            >
                <MatchSelector session={props.session} game={props.content.games[props.gameId]} tipTeamId={props.tipTeamId} tipTeamIdDb={props.tipTeamIdDb} teamClick={props.handleClick} />
            </div>

            <animated.div style={styles}>
                <div ref={ref}>
                    <div className='separator p-4'>
                        history
                    </div>
                    <div className='grid grid-cols-2 md:grid-cols-7 grid-rows-3'>
                        <History gameId={props.gameId} content={props.content} />
                    </div>
                </div>
            </animated.div>

        </div>



    );
}

export function MatchSelector(props: { session: Session | null, game: Game, tipTeamId: number | null, tipTeamIdDb: number | null, teamClick: (teamId: number) => void }) {
    return (
        <>
            <TeamCard handleClick={props.teamClick} game={props.game} tipId={props.tipTeamId} tipDbId={props.tipTeamIdDb} home={true} session={props.session} />
            <div className='contents tall:col-start-3 tall:col-span-2 tall:row-start-4 tall:flex tall:flex-col flex-wrap'>
                <p className='text-center row-start-3 self-end tall:self-center md:self-start col-start-3 col-span-2 md:row-start-3 md:col-start-4 md:col-span-1'>
                    {props.game.venue}
                </p>

                <p className='text-center row-start-1 self-start tall:self-center md:self-end col-start-3 col-span-2 md:row-start-2 md:col-start-4 md:col-span-1'>
                    {format(props.game.scheduled, 'p')}
                </p>
            </div>

            <TeamCard handleClick={props.teamClick} game={props.game} tipId={props.tipTeamId} tipDbId={props.tipTeamIdDb} home={false} session={props.session} />
        </>
    )
}

function TeamCard(props: {
    session: Session | null, game: Game, tipId: number | null, tipDbId: number | null, home: boolean, handleClick: (teamId: number) => void
}) {
    const team = props.home ? props.game.homeTeamObj : props.game.awayTeamObj;


    if (props.game.started()) {
        const winner = props.home ? props.game.homeIsWinner() : props.game.awayIsWinner();

        return (
            <>
                {team.score && <p className={`col-span-1 ${props.home ? 'tall:col-start-2 col-start-3' : 'col-start-4 tall:col-start-5 md:col-start-5'} row-start-2 tall:row-start-4 md:row-start-2 m-1 tall:m-2 text-2xl ${winner ? 'font-bold' : 'font-normal'} text-center m-auto`}>{team.score}</p>}
                <TeamTile team={team} home={props.home} result={props.game.isWinner(props.home)} tipDbId={props.tipDbId} />
            </>
        )
    }

    return (
        <>
            <TeamTile team={team} home={props.home} tipId={props.tipId} tipDbId={props.tipDbId} handleClick={props.handleClick} />
        </>
    )
}

function TeamTile(props: {
    team: Team,
    home: boolean,
    result?: MatchResult,
    tipId?: number | null,
    tipDbId?: number | null,
    handleClick?: (teamId: number) => void
}) {
    let tipColor = '';

    // handleClick being undefined means tile should not be clickable (i.e. when a game has already started)
    if (props.handleClick === undefined) {
        if (props.tipDbId === props.team.team_id) {
            if (props.result === MatchResult.Won) tipColor = 'border-green-500'
            else if (props.result === MatchResult.Lost) tipColor = 'border-red-500'
            else if (props.result === MatchResult.Drew) tipColor = 'border-yellow-500'
            else if (props.result === MatchResult.Unknown) tipColor = 'border-indigo-600'
        }
        return (
            <div
                className={`
                    bg-clip-padding backdrop-filter backdrop-blur-xl bg-opacity-40 bg-white
                    shadow-md border-2 rounded-xl ${props.home ? 'border-r-8' : 'border-l-8'} ${tipColor}
                    row-span-3 tall:row-span-3
                    col-span-2 tall:col-span-3 md:col-span-2 
                    ${props.home ? 'col-start-1' : 'col-start-5 tall:col-start-4 md:col-start-6'}
                    p-1
                    flex items-center justify-around
                `}
            >
                <TeamLogo size='big' teamName={props.team.team_name} />
            </div>
        )
    }

    if (props.tipId === props.team.team_id) tipColor = 'border-indigo-800'
    else if (props.tipId === null && props.tipDbId === props.team.team_id) tipColor = 'border-indigo-600'

    return (
        <div
            onClick={(e) => {
                e.stopPropagation();
                props.handleClick!(props.team.team_id)
            }}
            className={`
                bg-clip-padding backdrop-filter backdrop-blur-xl bg-opacity-40 bg-white
                shadow-md border-2 rounded-xl ${props.home ? 'border-r-8' : 'border-l-8'} ${tipColor}
                row-span-3 tall:row-span-3
                col-span-2 tall:col-span-3 md:col-span-2 
                ${props.home ? 'col-start-1' : 'col-start-5 tall:col-start-4 md:col-start-6'}
                p-1
                flex items-center justify-around
                hoverable:hover:border-indigo-800
            `}
        >
            <TeamLogo size='big' teamName={props.team.team_name} />
        </div>
    )
}

function TeamLogo(props: { size: 'big' | 'small', teamName: string }) {
    let size = '';

    switch (props.size) {
        case 'big':
            size = 'w-28 h-28'
            break;
        case 'small':
            size = 'w-10 h-10'
            break;
    }


    return (
        <div className={`relative max-w-full ${size}`}>
            <Image src={logoPath(props.teamName)} alt={`Logo of ${props.teamName}`} className='h-auto' layout='fill' objectFit='contain' />
        </div>
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
            <div key={team.team_id} className={`row-span-3 row-start-1 col-span-1 md:col-span-3 ${home ? 'col-start-1' : 'col-start-2 md:col-start-5'}  grid grid-cols-6 grid-rows-3 gap-4 `}>
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
            {oldRounds.map((round) => <p key={`r${round}`} className='hidden md:block md:col-start-4 text-center m-auto '>Round {round}</p>)}
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
        <TeamHistoryLine key={round} teamId={props.teamId} row={i} left={props.left} game={props.content.games[props.content.history[props.teamId][round].gameId]} />
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
        <span className={`m-auto ${underline} ${bold} ${col} ${props.row}`}>{props.score ? props.score : <FontAwesomeIcon icon={faQuestion} className='text-rose-600' />}</span>
    )
}
