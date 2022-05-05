import { Session } from '@supabase/supabase-js';
import React, { useEffect, useState } from 'react';
import { SelectRound } from '../../common/components/tipping';
import { Match } from "../../common/components/match";
import { useRound } from '../../common/hooks/tips';
import { AppConfig } from '../../common/utils/app.config';
import { Game, gamesSupabaseToGames, teamsSupabaseToGames, teamSupabase } from '../../common/utils/objects';
import { supabase } from '../../modules/supabase/client';
import Auth from '../../modules/supabase/components/Auth';
import { useRouter } from 'next/router';
import { readGames } from '../../common/utils/game';




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
    console.log("Prerendered: ", params.round);

    const round = Number(params.round);

    const read = async (round: number) => {
        console.log("Round: ", round);
        const { data, error } = await supabase.from('team').select(`
            id, team_name, abbreviation, 
            game_team!inner(home, goals, behinds, 
            game!inner(id, venue, scheduled, round_year, round_number, complete)) 
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
            teamsSupabase: teamsData,
            round: round
        }
    }
}


export default function Round({ teamsSupabase, round }: { teamsSupabase: teamSupabase[], round: number }) {
    let games: Game[] = [];
    let roundGames: Game[] = [];
    if (teamsSupabase !== undefined) {
        games = teamsSupabaseToGames(teamsSupabase);
        roundGames = games.filter(game => game.round.number === round);
    } else {
        throw new Error("No data received!");
    }

    const [session, setSession] = useState<Session | null>(null);

    useEffect(() => {
        setSession(supabase.auth.session());
        supabase.auth.onAuthStateChange((_event, session) => setSession(session))
    }, []);

    return (
        <div className='flex flex-col flex-grow gap-2 items-stretch'>
            <SelectRound round={round} />

            {!session ? <Auth /> : roundGames.map((game) => <Match key={game.game_id} game={game} games={games} session={session} round={round} />)}

            <hr />

        </div>
    )
}