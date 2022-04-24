import { Session } from "@supabase/supabase-js";
import React, { useEffect, useState } from "react";
import { Tips } from "../common/components/tipping";
import { AppConfig } from "../common/utils/app.config";
import { supabase } from "../modules/supabase/client";
import Auth from "../modules/supabase/components/Auth";

export default function AddTips() {
    const [session, setSession] = useState<Session | null>(null);

    useEffect(() => {
        setSession(supabase.auth.session());
        supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
        })
    }, []);


    return (
        <>
            <h2 className='text-xl text-center'>Round {AppConfig.round}</h2>
            {!session ? <Auth /> : <Tips defaultRound={AppConfig.round} session={session} />}
        </>

    )
}