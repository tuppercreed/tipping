import React from "react";
import { TeamLogo } from "../../../common/components/team";
import { supabase } from "../../../modules/supabase/client";

// Generates pages for all competitions that have at least one result in the summary table
export async function getStaticPaths() {
    const { data, error } = await supabase.from('rank_pages').select('*');

    if (data !== null) {
        let pages: { params: { competition: string, round: string } }[] = (data as {
            round_number: number,
            competition_id: number,
        }[]).map((res) => {
            return {
                params: {
                    competition: res.competition_id.toString(),
                    round: res.round_number.toString()
                }
            }
        });

        return {
            paths: pages,
            fallback: false
        }
    }

    throw new Error('No paths returned')
}

interface Performance {
    person_id: string,
    game_id: number,
    team_id: number,
    correct: boolean,
    drawn: boolean,
    username: string,
    team_name: string,
}

export async function getStaticProps({ params }: { params: { competition: string, round: string } }) {
    if (isNaN(Number(params.competition))) throw new Error('Invalid competition id');
    if (isNaN(Number(params.round))) throw new Error('Invalid round id');

    const comp_id = Math.round(Number(params.competition));
    const r_number = Math.round(Number(params.round));

    const tallyResponse = await supabase.rpc('tip_tally', { comp_id, r_year: new Date().getFullYear(), r_number });
    let tally: { [personId: string]: { score: number, username: string } } = {};
    if (tallyResponse.data !== null) {
        tally = tallyResponse.data.reduce<{ [personId: string]: { score: number, username: string } }>((scores, tally) => {
            scores[tally.person_id] = { score: tally.score, username: tally.username };
            return scores;
        }, tally);
    }
    const { data, error } = await supabase.rpc('tip_results', { comp_id, r_year: new Date().getFullYear(), r_number });

    if (data !== null) {
        const performance = (data as Performance[]).reduce<{ [personId: string]: Performance[] }>((perf, row) => {
            if (row.person_id in perf) perf[row.person_id].push(row)
            else perf[row.person_id] = [row]
            return perf
        }, {});
        return { props: { performance, round: r_number, competition: comp_id, tally } }
    }

    return { props: { competition: comp_id, tally } }
}

function Cell(props: { c: string | number | JSX.Element, className?: string }) {
    return <td className={`p-0 sm:px-1 md:p-2 text-center border-b-2 border-cyan-200 ${props.className}`}>{props.c}</td>;
}

function HCell(props: { c: string | number | JSX.Element, className?: string }) {
    return <th className={`px-0 py-1 text-[0px] first-letter:text-base sm:text-base text-center ${props.className}`}>{props.c}</th>
}

function Row(props: { round: number, username: string, score: number, performance?: Performance[] }) {
    const roundScore = props.performance?.reduce((score, perf) => perf.correct ? score + 1 : score, 0);

    return (
        <tr className='even:bg-cyan-50' key={props.username}>
            <Cell c={
                <>{props.username.split(' ').map((word) => <span key={word} className={`inline-block text-[0px] first-letter:text-base md:text-base`}>{word} </span>)}</>
            } />
            <Cell c={props.score} />
            {roundScore && <Cell c={roundScore} />}
            {roundScore && <Cell className={`hidden sm:block`} c={Math.round(roundScore / props.round * 10) / 10} />}
            {props.performance?.map((perf) => {
                return <Cell key={perf.game_id} className={`${perf.correct ? 'border-green-400' : 'border-red-400'}`} c={
                    <TeamLogo size='small' teamName={perf.team_name} />
                } />
            })}
        </tr>
    );
}

export default function Rank({ performance, tally, round, competition }: {
    performance?: { [personId: string]: Performance[] },
    tally: { [personId: string]: { score: number, username: string } },
    round: number,
    competition: number
}) {
    const gameNum = performance ? Object.values(performance)?.reduce((longest, next) => {
        if (next.length > longest) return next.length
        return longest
    }, 0) : undefined;

    return (
        <>
            <h2 className="text-xl text-center">Ranks for Round {round}</h2>

            <table className={`
                m-1 sm:m-2
                table-auto
                overflow-scroll
                w-[99vw] sm:w-[95vw] md:w-[85vw] lg:w-[75vw] 
                border-collapse
                shadow
            `}>
                <thead>
                    <tr className="font-bold border-b border-cyan-400 bg-cyan-700 text-slate-100">
                        <HCell c='Username' className='text-left' />
                        {['Wins', `Round ${round}`].map((text) => <HCell key={text} c={text} />)}
                        <HCell className='hidden sm:block' c={'Avg. per round'} />
                        {gameNum && [...Array(gameNum).keys()].map((num) => <HCell key={`game_${num + 1}`} c={num + 1} />)}
                    </tr>
                </thead>

                <tbody>
                    {Object.entries(tally).map(([personId, { username, score }]) => <Row key={username} round={round} score={score} username={username} performance={performance?.[personId]} />)}
                </tbody>
            </table>

        </>
    )
}