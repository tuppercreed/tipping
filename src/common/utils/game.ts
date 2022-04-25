import { parseISO } from "date-fns";
import { supabase } from "../../modules/supabase/client";
import { groupBy } from "./functions";
import { gameSupabase } from "./objects";

export async function readGames(round: number) {
    const { data, error } = await supabase.from('game').select(`
    id, round_number, round_year, venue, scheduled, game_team!inner(home, goals, behinds, team!inner( id, team_name, abbreviation), tip ( person_id ))
    `).eq('round_number', round).eq('round_year', new Date().getFullYear().toString());

    if (data !== null) {
        return data as gameSupabase[];
    } else {
        throw new Error('No data!');
    }
}

export async function readTips(round: number) {
    const { data, error } = await supabase.from('game').select(`
    id, round_number, round_year, venue, scheduled, game_team!inner(home, goals, behinds, team!inner( id, team_name ), tip ( person_id )) 
    `).eq('round_number', round).eq('round_year', new Date().getFullYear().toString());

    if (data !== null) {
        return data as gameSupabase[];
    } else {
        throw new Error('No data!');
    }
}

export async function readRankings(round: number) {
    if (round > 0) {
        const { data, error } = await supabase.from('competition_rankings_summary').select(`
        person!inner(username), wins
        `).eq('round_number', round).eq('round_year', new Date().getFullYear().toString());
        if (data !== null) {
            return (data as { person: { username: string }, wins: number }[]).map((d) => { return { username: d.person.username, wins: d.wins }; });
        }
    } else {
        const { data, error } = await supabase.rpc('all_rankings', { r_year: new Date().getFullYear().toString() });
        if (data !== null) {
            return data as { username: string, wins: number }[]
        }
    }

}