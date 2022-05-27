import React, { ReactElement } from 'react'
import { Layout } from '../common/components/layout';
import { HCell, Cell, Row, Table, Heading } from '../common/components/table';
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
            if (col === 'for' || col === 'against' || col === 'percentage') return <Cell key={`${team.id}_${col}`} className='hidden sm:table-cell'>{team[col]}</Cell>
            return (
                <Cell key={`${team.id}_${col}`} className={col === 'name' ? 'text-left' : 'text-center'}>{team[col]}</Cell>
            );
        });
        row.splice(1, 0,
            <Cell key={`${team.id}_logo`} className='py-2'><TeamLogo size='small' teamName={team.name} /></Cell>
        );
        return (
            <Row key={team.id}>{row}</Row>
        );
    })

    return (
        <Layout title='Ladder'>
            <Table
                heading={
                    <Heading>
                        {colNames.map((name) => {
                            if (name === 'Name') return <HCell key={name} className='text-left'>{name}</HCell>
                            else if (name === 'For' || name === 'Against' || name === '%') return <HCell key={name} className='hidden sm:table-cell'>{name}</HCell>
                            return <HCell key={name}>{name}</HCell>
                        })}
                    </Heading>
                }
            >
                {rows}
            </Table>
        </Layout>
    )
}

Ladder.getLayout = ((page: ReactElement) => page);