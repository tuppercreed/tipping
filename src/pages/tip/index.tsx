import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import React, { useEffect } from 'react';
import { supabase } from '../../modules/supabase/client';

export const getServerSideProps: GetServerSideProps = async () => {
    const { data, error } = await supabase.from('next_round').select('round_number');
    if (data !== null) {
        return {
            redirect: {
                destination: `/tip/${data[0]['round_number']}`,
                permanent: false,
            }
        }
    }
    return {
        props: {}
    }
}


export default function Tip() {
    return (
        <h1 className='text-2xl'>No round found</h1>
    );
}