import { GetStaticProps } from 'next';
import React from 'react';
import { AppConfig } from '../common/utils/app.config';
import { Standing } from '../common/utils/data';
import { gamesSupabaseToGames } from '../common/utils/objects';
import { fetchGames, fetchTeams } from '../modules/squiggle/fetch';
import { updateGames, updateTeams } from '../modules/squiggle/toSupabase';
import { Game } from '../modules/squiggle/types';

export const getStaticProps: GetStaticProps = async () => {
    if (!AppConfig.local) {
        // Use squiggle API to update database and return values
        let teams = await fetchTeams();
        updateTeams(teams);
        let games = await fetchGames(AppConfig.round);
        updateGames(games);

        let standings = new Standing(AppConfig.round);
        standings.update();

        return { props: { games: games } }
    }
    return { props: { games: [] } }

}

export default function UpdateData(props: { games: Game[] }) {
    return (
        <>
            <p>Hello</p>
            {props.games.map((game) => <li key={game.id}>{game.hteam} vs. {game.ateam}</li>)}
        </>
    )
}