import React, { useState } from 'react';
import { supabase } from '../client';
import { ApiError, Provider } from '@supabase/supabase-js';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faGoogle, faGithub, faFacebook } from '@fortawesome/free-brands-svg-icons';

library.add(faGoogle, faGithub, faFacebook);

function MagicLink() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');

    const handleLogin = async (email: string) => {
        try {
            setLoading(true);
            const { error } = await supabase.auth.signIn({ email });
            if (error) throw error
            alert('Check your email for the login link!');
        } catch (error) {
            let e = error as { message: string, status: number };
            alert(e.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <form onSubmit={(e) => { e.preventDefault(); handleLogin(email) }} className=''>
                <label>Email: <input className='' type='email' placeholder='john.smith@gmail.com' value={email} onChange={(e) => setEmail(e.target.value)} /></label>
                <input className='button' type='submit' value={loading ? 'Loading' : 'Send magic link'} disabled={loading} />
            </form>
        </>
    )
}

function Email(props: { signUp: boolean }) {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (email: string, password: string) => {
        try {
            setLoading(true);
            if (props.signUp) {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error
                alert('Signing Up')
            } else {
                const { error } = await supabase.auth.signIn({ email, password });
                if (error) throw error
                alert('Signing in');
            }
        } catch (error) {
            let e = error as { message: string, status: number };
            alert(e.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className=''>
            <h3 className='text-xl'>Sign In Directly</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleLogin(email, password) }} className='mt-2 flex flex-col'>
                <label htmlFor='email_input' className='text-gray-800'>Email</label>
                <input id='email_input' required className='rounded-sm border border-gray-100 p-2 mt-0.5 mb-2 shadow focus:invalid:outline-red-600 focus:invalid:outline-2 focus:invalid:outline' type='email' placeholder='john.smith@gmail.com' value={email} onChange={(e) => setEmail(e.target.value)} />
                <label htmlFor='password_input' className='text-gray-800'>Password</label>
                <input id='password_input' className='rounded-sm border border-gray-100 p-2 mt-0.5 mb-2 shadow focus:invalid:outline-red-600 focus-invalid:outline-2 focus:invalid:outline' type='password' placeholder='password' value={password} onChange={(e) => setPassword(e.target.value)} />
                <input className='button' required type='submit' value={loading ? 'Loading' : (props.signUp ? 'Sign Up' : 'Sign In')} disabled={loading} />
            </form>
            <span className='text-gray-800'>No account?</span> <a>Sign Up</a>
        </div>
    )

}

type SupportedProvider = 'google' | 'github' | 'facebook';

async function signInWith(provider: Provider) {
    const { user, session, error } = await supabase.auth.signIn({
        provider: provider,
    })
}

function SignInButton(props: { provider: SupportedProvider }) {
    const providerTitle = props.provider.charAt(0).toUpperCase() + props.provider.slice(1);
    return (
        <button className='button pl-0 pr-2 py-0 text-lg flex items-stretch gap-2 bg-blue-500 text-white' onClick={() => signInWith(props.provider)}>
            <span className='rounded-l bg-blue-700 p-2'><FontAwesomeIcon icon={['fab', props.provider]} size='lg' color='white' title={`${providerTitle} Logo`} /></span>
            <span className='py-2 box-border'>Sign in with {providerTitle}</span>
        </button>
    )
}



export default function Auth() {
    const loginMenu = (
        <div className='flex flex-col'>
            <SignInButton provider='google' />
            <SignInButton provider='github' />
        </div>
    )

    return (
        <div className="flex flex-col justify-center items-stretch m-2 shadow-md border-2 p-4">

            {loginMenu}

            <div className='separator'>or</div>

            <Email signUp={false} />

        </div>
    )

}