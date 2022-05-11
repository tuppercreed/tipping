import { Session } from '@supabase/supabase-js';
import React, { useEffect, useState } from 'react';
import { SelectRound } from '../common/components/tipping';
import { useRanking } from '../common/hooks/tips';
import { AppConfig } from '../common/utils/app.config';
import { supabase } from '../modules/supabase/client';
import Auth from '../modules/supabase/components/Auth';

function Rankings(props: { defaultRound: number, session: Session }) {
    const rankings = useRanking(props.defaultRound);

    return (
        <div className='flex flex-col flex-grow'>
            <SelectRound round={props.defaultRound} />

            <ul className='m-2 text-center'>
                {rankings.map((ranking) => <li key={ranking.username}>{ranking.username} has {ranking.wins} points</li>)}
            </ul>

        </div>
    )
}

export default function Competition() {
    const [session, setSession] = useState<Session | null>(null);

    useEffect(() => {
        setSession(supabase.auth.session());
        supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
        })
    }, [])

    return (
        <>
            {!session ? <Auth /> : <Rankings defaultRound={AppConfig.round} session={session} />}
        </>
    )
}