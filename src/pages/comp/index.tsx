import { Session } from '@supabase/supabase-js';
import { RecordWithTtl } from 'dns';
import { useRouter } from 'next/router';
import React, { ReactElement, useEffect, useState } from 'react'
import { Layout } from '../../common/components/layout';
import { supabase } from '../../modules/supabase/client'
import Auth from '../../modules/supabase/components/Auth';

export async function getStaticProps() {
    const { data, error } = await supabase.from('next_round').select('round_number');
    if (data != null) {
        return { props: { round: data[0]['round_number'] } }
    }
}

export default function Comp({ round }: { round: number }) {
    const [session, setSession] = useState<Session | null>(null);
    const [authModal, setAuthModal] = useState(false);
    const [comp, setComp] = useState('');
    const [compResponse, setCompResponse] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        setSession(supabase.auth.session());
        supabase.auth.onAuthStateChange((_event, session) => setSession(session))
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const getId = async (name: string) => {
            const { data, error } = await supabase.from('competition').select('id').eq('competition_name', name);
            if (data !== null) {
                return (data as { id: number }[]).map((item) => item.id)
            }
        }
        const ids = await getId(comp);

        if (ids !== undefined && ids.length > 0) {
            setCompResponse(null);
            router.push({ pathname: '/comp/[comp]/[round]', query: { comp: ids[0], round } });
        } else {
            setCompResponse('Failed to find competition!');
        }
    }


    return (
        <Layout {...{ round, title: 'Competition Table', className: '!items-center' }}>
            <h2 className='text-2xl'>Enter a competition&aposs name</h2>
            <div>
                <form onSubmit={handleSubmit}>
                    <label>Competition:
                        <input className='mx-2 text-black' type='text' value={comp} onChange={(e) => setComp(e.target.value)} />
                    </label>
                    <input className='button' type='submit' value='Enter' />
                </form>

                {compResponse && <p>{compResponse}</p>}


                <div className='separator text-xl'>or</div>

                <h2 className='text-2xl'>Login to choose from your own competitions</h2>
            </div>
            <Auth />
        </Layout>
    )
}

Comp.getLayout = ((page: ReactElement) => page);