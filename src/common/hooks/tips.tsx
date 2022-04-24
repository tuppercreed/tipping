import { isFuture, isPast } from 'date-fns';
import { useState, useEffect } from 'react';
import { Game, GamesApiToGames, readGames } from '../utils/game';

export function useRound(round: number) {
    const [games, setGames] = useState<{ upcoming: Game[], started: Game[] }>({ upcoming: [], started: [] });

    useEffect(() => {
        async function handleRoundChange() {
            const data = await readGames(round);
            const newGames = GamesApiToGames(data);
            const upcoming = newGames.filter(game => isFuture(game.scheduled));
            const started = newGames.filter(game => isPast(game.scheduled));
            setGames({ upcoming: upcoming, started: started });
        }
        handleRoundChange()
    }, [round]);

    return games;
}