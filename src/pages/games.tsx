import { Prisma } from "@prisma/client";
import { GetStaticProps } from "next";
import React from "react";
import { SelectTips } from "../common/components/tipping";
import { AppConfig } from "../common/utils/app.config";
import prisma from "../common/utils/prisma";

export const getStaticProps: GetStaticProps = async () => {
    const gameSelect: Prisma.GameSelect = {
        homeTeam: {
            select: {
                name: true
            }
        },
        awayTeam: {
            select: {
                name: true
            }
        }
    };

    const games = await prisma.game.findMany({
        where: { round: { year: new Date().getFullYear(), round: AppConfig.round } },
        select: gameSelect,
    });
    return { props: { games } };
}

export default function Games({ games }: { games: { homeTeam: { name: string }, awayTeam: { name: string } }[] }) {
    let gamesList = games.map((game => { let simplifiedGame = { homeTeam: game.homeTeam.name, awayTeam: game.awayTeam.name }; return simplifiedGame; }));

    return (
        <>
            <h2 className='text-xl text-center'>Round 5</h2>
            <SelectTips games={gamesList} />
        </>

    )
}