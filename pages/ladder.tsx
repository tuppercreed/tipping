import React from 'react'

export default function Ladder() {
    const rankings = [{ 'name': 'Dave', 'score': 5 }, { 'name': 'Max', 'score': 13 }, { 'name': 'Paula', 'score': 14 }, { 'name': 'Jacinta', 'score': 11 }];

    return (
        <>
            <h2 className='text-xl text-center'>Ladder</h2>

            <ol className='m-2 list-decimal text-center'>
                {rankings.map((player) =>
                    <li key={player.name}>{player.name} - {player.score}</li>
                )}
            </ol>


        </>
    )
}