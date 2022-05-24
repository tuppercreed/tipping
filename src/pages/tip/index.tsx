import React from 'react';
import { supabase } from '../../modules/supabase/client';

export async function getStaticProps() {
    const { data, error } = await supabase.from('next_round').select('round_number');
    if (data !== null) {
        return { redirect: { destination: `/tip/${data[0]['round_number']}`, permanent: false } }
    }


}

export default function Tip() {
    return (
        <h1 className='text-4xl'>No round selected</h1>
    )
}