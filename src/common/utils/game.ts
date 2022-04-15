import { parseISO } from "date-fns";
import { supabase } from "../../modules/supabase/client";
import { groupBy } from "./functions";

export type gameSupabaseApi = {
    game_id: number,
    home: boolean,
    team: {
        id: number,
        team_name: string,
        [index: string]: any,
    },
    game: {
        scheduled: string,
        venue: string,
        round_number: number,
        round_year: number,
        [index: string]: any,
    },
    [index: string]: any,
}

export type Team = {
    team_id: number,
    team_name: string,
}

export async function readGames(round: number) {
    const { data, error } = await supabase.from('game_team').select(`
    game_id, home, team!inner( id, team_name ), game!inner( round_number, round_year, scheduled, venue )
    `).eq('game.round_number', round).eq('game.round_year', new Date().getFullYear().toString());

    if (data !== null) {
        return data as gameSupabaseApi[];
    } else {
        throw new Error('No data!');
    }
}

export function GamesApiToGames(games: gameSupabaseApi[]) {
    let grouped = Object.values(groupBy(games, ((v) => v.game_id.toString())));
    let gamesObj = grouped.map(([one, two]) => new Game(one, two));
    let gamesObjSorted = gamesObj.sort((a, b) => (a.scheduled! > b.scheduled!) ? 1 : -1);
    return gamesObjSorted;
}

export class Game {
    game_id: number;
    round: { number: number, year: number };
    homeTeamObj: Team;
    awayTeamObj: Team;
    scheduled: Date;
    venue: string;

    constructor(gameApi: gameSupabaseApi, secondTeam: gameSupabaseApi) {
        this.game_id = gameApi.game_id;
        this.round = { number: gameApi.round_number, year: gameApi.round_year };

        const formatter = (one: gameSupabaseApi, two: gameSupabaseApi) => {
            return [
                {
                    team_id: one.team.id,
                    team_name: one.team.team_name,
                },
                {
                    team_id: two.team.id,
                    team_name: two.team.team_name,
                },
            ];
        };
        if (gameApi.home && !secondTeam.home) {
            [this.homeTeamObj, this.awayTeamObj] = formatter(gameApi, secondTeam)
        }
        else if (!gameApi.home && secondTeam.home) {
            [this.awayTeamObj, this.homeTeamObj] = formatter(gameApi, secondTeam)
        } else {
            throw new Error("Failed to parse game that didn't have both a home and away team");
        }

        this.scheduled = parseISO(gameApi.game.scheduled);
        this.venue = gameApi.game.venue;


    }

    get homeTeam() {
        return this.homeTeamObj.team_name;
    }

    get awayTeam() {
        return this.awayTeamObj.team_name;
    }
}
