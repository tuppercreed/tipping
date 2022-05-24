import { Session } from '@supabase/supabase-js';
import React, { useEffect, useState } from 'react';
import { SelectRound } from '../../common/components/selectRound';
import { MatchForm } from "../../common/components/match";
import { useTips } from '../../common/hooks/tips';
import { ApiToObject, GamesApi, teamsApiToGamesApi, teamSupabase } from '../../common/utils/objects';
import { supabase } from '../../modules/supabase/client';

export async function getStaticPaths() {
    const rounds = Array.from({ length: 23 }, (_, i) => i + 1);
    return {
        paths: rounds.map((round) => { return { params: { round: round.toString() } } }),
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
            <div className='mb-2 flex flex-col flex-grow items-stretch w-full sm:w-[90vw] md:w-[80vw] lg:w-[70vw] xl:w-[60vw]'>
                <h2 className='text-white text-3xl mt-2 mx-2 px-1'>Round {round}</h2>

                {round in data.rounds && <MatchForm content={data} session={session} round={round} />}
                {!(round in data.rounds) && <h2 className='text-3xl'>Round Data Missing</h2>}


            </div>
        </>
    )
}