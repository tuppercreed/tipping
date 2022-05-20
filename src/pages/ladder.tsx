import React from 'react'
import { TeamLogo } from '../common/components/team';
import { Standing } from '../modules/squiggle/types';
import { supabase } from '../modules/supabase/client';

export async function getStaticProps() {
    const { data, error } = await supabase.from('team').select(`
        standing
    `);

    if (data !== null) {
        let standings = (data as { standing: string }[]).map(({ standing }) => {
            const s: Standing = JSON.parse(standing);
            s.percentage = Math.round(s.percentage);
            return s;
        });
        standings.sort((a, b) => a.rank - b.rank);
        return { props: { standings } }
    }
    throw new Error('No ladder data returned');
}

const cols: (keyof Standing)[] = ['rank', 'name', 'pts', 'played', 'percentage', 'wins', 'losses', 'draws', 'for', 'against'];
const colNames = ['Rank', '', 'Name', 'Points', 'Played', '%', 'Won', 'Lost', 'Drawn', 'For', 'Against'];

export default function Ladder({ standings }: { standings: Standing[] }) {

    let rows = standings.map((team) => {
        let row = cols.map((col) => {
            return (
                <td
                    key={`${team.id}_${col}`}
                    className={`
                    min-w-[35px]
                    border-b border-cyan-200
                    ${col === 'name' ? 'text-left' : 'text-center'}
                `}>{team[col]}</td>
            );
        });
        row.splice(1, 0,
            <td className='py-2 border-b border-cyan-200'><TeamLogo key={`${team.id}_logo`} size='small' teamName={team.name} className='' /></td>
        );
        return (
            <tr key={team.id} className='even:bg-cyan-50'>{row}</tr>
        );
    })

    return (
        <>
            <h2 className='text-xl text-center'>Ladder</h2>
            <hr />

            <table className={`
            m-1 sm:m-2 
            table-auto
            overflow-scroll
            w-[100vw] sm:w-[95vw] md:w-[85vw] lg:w-[75vw] 
            border-collapse
            shadow
            `}>
                <thead>
                    <tr className='font-bold border-b border-cyan-400 bg-cyan-700 text-slate-100'>
                        {colNames.map((name) => {
                            return (
                                <th
                                    key={name}
                                    className={`
                                text-[0px] first-letter:text-base sm:text-base
                                ${name === 'Name' ? 'text-left' : 'text-center'}
                                `}
                                >{name}</th>
                            )
                        })}
                    </tr>
                </thead>

                <tbody>
                    {rows}
                </tbody>

            </table>
        </>
    )
}