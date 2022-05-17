import { Session } from '@supabase/supabase-js';
import React, { useEffect, useState } from 'react';
import { SelectRound } from '../../common/components/tipping';
import { MatchForm } from "../../common/components/match";
import { useTips } from '../../common/hooks/tips';
import { ApiToObject, GamesApi, teamsApiToGamesApi, teamSupabase } from '../../common/utils/objects';
import { supabase } from '../../modules/supabase/client';

export async function getStaticPaths() {
    return {
        paths: [
            { params: { round: '1' } },
            { params: { round: '2' } },
            { params: { round: '3' } },
            { params: { round: '4' } },
            { params: { round: '5' } },
            { params: { round: '6' } },
            { params: { round: '7' } },
            { params: { round: '8' } },
            { params: { round: '9' } },
            { params: { round: '10' } },
            { params: { round: '11' } },
            { params: { round: '12' } },
            { params: { round: '13' } },
            { params: { round: '14' } },
            { params: { round: '15' } },
            { params: { round: '16' } },
            { params: { round: '17' } },
            { params: { round: '18' } },
            { params: { round: '19' } },
            { params: { round: '20' } },
            { params: { round: '21' } },
            { params: { round: '22' } },
            { params: { round: '23' } },
        ],
        fallback: false
    }
}

export async function getStaticProps({ params }: { params: { round: string } }) {

    const round = Number(params.round);

    const read = async (round: number) => {
        const { data, error } = await supabase.from('team').select(`
            id, team_name, abbreviation, game_team!inner(home, goals, behinds, prediction ( confidence), game!inner(id, venue, scheduled, round_year, round_number, complete)) 
        `).eq('game_team.game.round_year', new Date().getFullYear().toString()).gte('game_team.game.round_number', round - 3).lte('game_team.game.round_number', round);

        if (data !== null) {
            return data as teamSupabase[];
        } else {
            throw new Error('No data!');
        }
    }

    const teamsData = await read(round);



    return {
        props: {
            gamesApi: teamsApiToGamesApi(teamsData),
            round: round
        }
    }
}


export default function Round({ gamesApi, round }: { gamesApi: GamesApi, round: number }) {
    const data = ApiToObject(gamesApi);

    const [session, setSession] = useState<Session | null>(null);


    useEffect(() => {
        setSession(supabase.auth.session());
        supabase.auth.onAuthStateChange((_event, session) => setSession(session))
    }, []);

    return (
        <>
            <div className='mb-2 flex flex-col flex-grow gap-2 items-stretch w-full sm:w-[90vw] md:w-[80vw] lg:w-[70vw] xl:w-[60vw]'>
                <SelectRound round={round} />

                {round in data.rounds && <MatchForm content={data} session={session} round={round} />}
                {!(round in data.rounds) && <h2 className='text-3xl'>Round Data Missing</h2>}


            </div>
        </>
    )
}