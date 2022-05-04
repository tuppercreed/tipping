import { isFuture, isPast } from 'date-fns';
import { useState, useEffect } from 'react';
import { readGames, readHistory, readRankings } from '../utils/game';
import { Game, gamesSupabaseToGames } from '../utils/objects'

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