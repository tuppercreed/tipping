import { Session } from '@supabase/supabase-js';
import { isFuture, isPast } from 'date-fns';
import { useState, useEffect } from 'react';
import { supabase } from '../../modules/supabase/client';
import { readGames, readHistory, readRankings } from '../utils/game';
import { Game, gamesSupabaseToGames, Tips, tipSupabase, TipToObject } from '../utils/objects'

export function useRound(round: number) {
    const [games, setGames] = useState<{ upcoming: Game[], started: Game[] }>({ upcoming: [], started: [] });

    useEffect(() => {
        async function handleRoundChange() {
            const data = await readGames(round);
            const newGames = gamesSupabaseToGames(data);
            const upcoming = newGames.filter(game => isFuture(game.scheduled));
            const started = newGames.filter(game => isPast(game.scheduled));
            setGames({ upcoming: upcoming, started: started });
        }
        handleRoundChange()
    }, [round]);

    return games;
}

export function useRanking(round: number) {
    const [rankings, setRankings] = useState<{ username: string, wins: number }[]>([]);

    useEffect(() => {
        async function handleRoundChange() {
            const data = await readRankings(round);
            if (data !== undefined) {
                setRankings(data);
            }
        }
        handleRoundChange()
    }, [round]);

    return rankings;
}

export function useHistory(teamId: number, round: number) {
    const [games, setGames] = useState<Game[]>([]);

    useEffect(() => {
        async function handleHistory() {
            const data = await readHistory(teamId, round);
            const newGames = gamesSupabaseToGames(data);
            setGames(newGames);
        }
        handleHistory();
    }, [teamId, round]);

    return games
}

export function useTips(round: number, session: Session | null) {
    const [tips, setTips] = useState<Tips | null>(null);

    useEffect(() => {
        async function getTips() {
            const { data, error } = await supabase.from('tip').select(`
                person_id, game_id, team_id, game_team!inner(game!inner(round_year, round_number))
            `).eq('person_id', session?.user!.id).eq('game_team.game.round_year', new Date().getFullYear().toString()).gte('game_team.game.round_number', round - 3).lte('game_team.game.round_number', round);

            if (data !== null) {
                setTips(TipToObject(data));
            } else {
                throw new Error('No tips returned.');
            }
        }
        if (session !== null) {
            getTips();
        }
    }, [round, session]);

    return tips
}