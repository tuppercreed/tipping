import React, { useState, useEffect } from 'react'
import Auth from '../modules/supabase/components/Auth'
import Account from '../modules/supabase/components/Account'
import { supabase } from '../modules/supabase/client'
import { Session } from '@supabase/supabase-js'

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    setSession(supabase.auth.session());
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])

  return (
    <>
      {!session ? <Auth /> : <Account key={session!.user!.id} session={session} />}
    </>
  )
}

