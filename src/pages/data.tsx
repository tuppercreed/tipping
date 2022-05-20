import { GetStaticProps } from 'next';
import React from 'react';
import { AppConfig } from '../common/utils/app.config';
import { UpdateGames, UpdateSources, UpdateStandings, UpdateTeams, UpdateTips } from '../common/utils/data';

export const getStaticProps: GetStaticProps = async () => {
    if (!AppConfig.local) {
        // Use squiggle API to update database and return values
        //let teams = await fetchTeams();
        //updateTeams(teams);
        await new UpdateTeams().update();
        // let games = await fetchGames(AppConfig.round);
        // updateGames(games);
        let games = new UpdateGames(AppConfig.round);
        games.update();

        let standings = new UpdateStandings(AppConfig.round);
        standings.update();

        await new UpdateSources().update();
        await new UpdateTips(AppConfig.round).update();

        return { props: {} }
    }
    return { props: {} }

}

export default function UpdateData(props: {}) {
    return (
        <>
            <p>Hello</p>
        </>
    )
}