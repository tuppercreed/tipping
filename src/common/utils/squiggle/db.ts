import { Game } from './types'
import { fetchGames } from './fetch'
import parseISO from 'date-fns/parseISO'
import prisma from '../prisma'
import { Prisma } from '@prisma/client'
import { AppConfig } from '../app.config'


class SquiggleTranslation {
    readonly game: Game;

    constructor(game: Game) {
        this.game = game;
    }

    async toTeam() {
        for (const [teamId, teamName] of [[this.game.ateamid, this.game.ateam], [this.game.hteamid, this.game.hteam]]) {
            let teamInput = { name: teamName as string, id: teamId as number };
            await prisma.team.upsert({
                where: { id: teamInput.id },
                create: teamInput,
                // Do not update if exists
                update: {},
            });

        }
        return [this.game.ateamid, this.game.hteamid];
    }

    async toRound() {
        const roundInput = { year: this.game.year, round: this.game.round, name: this.game.roundname };
        await prisma.round.upsert({
            where: { year_round: { year: roundInput.year, round: roundInput.round } },
            create: roundInput,
            // Do not update if exists
            update: {}
        });
        return { year_round: { year: this.game.year, round: this.game.round } };
    }

    async createGame() {
        const [homeTeamId, awayTeamId] = await this.toTeam();
        const year_round = await this.toRound();


        let date = this.game.date;
        date.replace(' ', 'T');
        date += this.game.tz;

        const createGame = await prisma.game.upsert({
            where: { id: this.game.id },
            create: {
                id: this.game.id,
                venue: this.game.venue,
                date: parseISO(date),
                round: { connect: year_round },
                homeTeam: { connect: { id: homeTeamId } },
                awayTeam: { connect: { id: awayTeamId } },

            },
            update: {},
        })
        return createGame;
    }
}

const translate = async (game: Game) => {
    let translator = new SquiggleTranslation(game);
    let translation = translator.createGame();
    return await translation;
}

export async function Round(round: number) {
    let games = await fetchGames(round);
    let translatedGames = await Promise.all(games.map((game) => translate(game)));
    return translatedGames;

}
