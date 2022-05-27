import React, { ReactElement } from "react";
import { Layout } from "../../../common/components/layout";
import { Cell, HCell, Heading, Row, Table } from "../../../common/components/table";
import { TeamLogo } from "../../../common/components/team";
import { supabase } from "../../../modules/supabase/client";

// Generates pages for all competitions that have at least one result in the summary table
export async function getStaticPaths() {
    const { data, error } = await supabase.from('rank_pages').select('*');

    if (data !== null) {
        let pages: { params: { comp: string, round: string } }[] = (data as {
            round_number: number,
            competition_id: number,
        }[]).map((res) => {
            return {
                params: {
                    comp: res.competition_id.toString(),
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

export async function getStaticProps({ params }: { params: { comp: string, round: string } }) {
    if (isNaN(Number(params.comp))) throw new Error('Invalid competition id');
    if (isNaN(Number(params.round))) throw new Error('Invalid round id');

    const comp_id = Math.round(Number(params.comp));
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


export default function Rank({ performance, tally, round, competition }: {
    performance?: { [personId: string]: Performance[] },
    tally: { [personId: string]: { score: number, username: string } },
    round: number,
    competition: number
}) {
    let gameNum = performance ? Object.values(performance)?.reduce((longest, next) => {
        if (next.length > longest) return next.length
        return longest
    }, 0) : undefined;
    if (gameNum === 0) gameNum = undefined;

    const headings: { c: string, className?: string }[] = [
        { c: 'Username', className: 'text-left' },
        { c: 'Wins' },
        { c: `Round ${round}` },
        { c: 'Avg. per round', className: 'hidden sm:table-cell' },
    ];

    return (
        <Layout {...{ round, comp: competition, title: `Ranks - Round ${round}` }}>
            <Table heading={
                <Heading>
                    {headings.map(({ c, className }) => {
                        return <HCell key={c} className={className}>{c}</HCell>;
                    })}
                    {gameNum && [...Array(gameNum).keys()].map((num) => <HCell key={`game_${num + 1}`}>{num + 1}</HCell>)}
                </Heading>
            }>
                {Object.entries(tally).map(([personId, { username, score }]) => {
                    const roundScore = performance?.[personId]?.reduce((score, perf) => perf.correct ? score + 1 : score, 0);
                    const avgScore = roundScore ? Math.round(roundScore / round * 10) / 10 : undefined;
                    return (
                        <Row key={personId}>
                            {[
                                <>{username.split(' ').map((word) => <span key={word} className={`inline-block text-[0px] first-letter:text-base md:text-base`}>{word}</span>)}</>,
                                score,
                                roundScore
                            ].map((elem) => <Cell key={elem?.toString()}>{elem}</Cell>)}

                            <Cell className="hidden sm:table-cell">{avgScore}</Cell>

                            {performance?.[personId]?.map((perf) => {
                                return (
                                    <Cell
                                        key={perf.game_id}
                                        className={`${perf.correct ? 'border-green-400' : 'border-red-400'}`}
                                    >
                                        <TeamLogo size='small' teamName={perf.team_name} className='mx-auto' />
                                    </Cell>
                                )
                            })}
                        </Row>
                    );
                })}
            </Table>
        </Layout>
    )
}

// Do not render the default layout
Rank.getLayout = ((page: ReactElement) => page);