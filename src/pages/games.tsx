import { Session } from "@supabase/supabase-js";
import { GetStaticProps } from "next";
import React, { useEffect, useState } from "react";
import { SelectTips } from "../common/components/tipping";
import { AppConfig } from "../common/utils/app.config";
import { readGames, gameSupabaseApi, Game, GamesApiToGames } from "../common/utils/game";
import { fetchGames, fetchTeams } from "../modules/squiggle/fetch";
import { updateGames, updateTeams } from "../modules/squiggle/toSupabase";
import { supabase } from "../modules/supabase/client";
import Auth from "../modules/supabase/components/Auth";

export const getStaticProps: GetStaticProps = async () => {
    if (!AppConfig.local) {
        // Use squiggle API to update database and return values
        let teams = await fetchTeams();
        updateTeams(teams);
        let games = await fetchGames(AppConfig.round);
        updateGames(games);
    }
    const data = await readGames(AppConfig.round);
    return { props: { gamesApi: data } }

}

export default function Tips({ gamesApi }: { gamesApi: gameSupabaseApi[] }) {
    const [session, setSession] = useState<Session | null>(null);

    useEffect(() => {
        setSession(supabase.auth.session());
        supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
        })
    }, []);

    let games = GamesApiToGames(gamesApi);

    return (
        <>
            <h2 className='text-xl text-center'>Round {AppConfig.round}</h2>
            {!session ? <Auth /> : <SelectTips games={games} session={session} />}
        </>

    )
}