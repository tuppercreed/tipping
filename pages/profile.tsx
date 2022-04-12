import React from 'react'
import { useUser } from '@auth0/nextjs-auth0'
import Image from 'next/image'

export default function Profile() {
    const { user, error, isLoading } = useUser();

    if (isLoading) return <div>Loading...</div>
    if (error) return <div>{error.message}</div>

    if (user != null) {
        return (
            <div>
                {user.picture && <Image src={user.picture} alt={user.name ? user.name : 'User profile picture'} />}
                {user.name && <h2>{user.name}</h2>}
                {user.email && <p>{user.email}</p>}
            </div>
        )
    } else {
        return (
            <div>
                No user
            </div>
        )
    }
}