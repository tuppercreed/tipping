import React from "react";
import { SelectTips } from "../components/tipping";

export default function Games() {
    const gamesList = [{ homeTeam: 'Brisbane', awayTeam: 'Collingwood' }, { homeTeam: 'North Melbourne', awayTeam: 'Bulldogs' }, { homeTeam: 'West Coast', awayTeam: 'Sydney' }, { homeTeam: 'St Kilda', awayTeam: 'Gold Coast' }];

    return (
        <>
            <h2 className='text-xl text-center'>Round 5</h2>
            <SelectTips games={gamesList} />
        </>

    )
}