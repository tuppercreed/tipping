import { GetStaticProps } from "next";
import { Prisma } from '@prisma/client';
import prisma from '../common/utils/prisma';

export const getStaticProps: GetStaticProps = async () => {
    const gameSelect: Prisma.GameSelect = {
        id: true,
        venue: true,
        homeTeam: {
            select: {
                name: true
            },
        },
        awayTeam: {
            select: {
                name: true
            },
        },
    };

    const feed = await prisma.game.findMany({
        where: { roundNumber: 5 },
        select: gameSelect,
    });
    return { props: { feed } };
}

export default function Simple({ feed }: { feed: { id: string, venue: string, homeTeam: { name: string }, awayTeam: { name: string } }[] }) {
    console.log(JSON.stringify(feed))
    return (
        <>
            <ol>
                {feed.map((game) => <li key={game.id}>{game.venue} - {game.homeTeam.name} vs. {game.awayTeam.name}</li>)}
            </ol>
        </>
    )
}