import { parseISO } from "date-fns";

export interface teamSupabase {
    id: number,
    team_name: string,
    abbreviation: string,
    game_team?: gameTeamSupabase[],
    [index: string]: any,
}

export interface gameSupabase {
    id: number,
    scheduled: string,
    venue: string,
    round_number: number,
    round_year: number,
    game_team?: gameTeamSupabase[],
    [index: string]: any,
}

interface gameTeamSupabase {
    home: boolean,
    goals: number,
    behinds: number,
    team?: teamSupabase,
    tip?: tipSupabase[],
    game?: gameSupabase,
    [index: string]: any,
}

interface tipSupabase {
    person_id: string,
    [index: string]: any,
}



export class Team {
    team_id: number;
    team_name: string;
    goals?: number;
    behinds?: number;
    tips: tipSupabase[];
    abbreviation?: string;

    constructor(gameTeam: gameTeamSupabase) {
        if (gameTeam.team === undefined) {
            throw new Error('Need team in gameTeam to construct Team');
        }
        this.team_id = gameTeam.team!.id;
        this.team_name = gameTeam.team!.team_name;
        [this.goals, this.behinds] = [gameTeam.goals, gameTeam.behinds]
        if (gameTeam.tip === undefined) {
            this.tips = []
        } else {
            this.tips = gameTeam.tip!
        }
        if ("abbreviation" in gameTeam.team!) {
            this.abbreviation = gameTeam.team.abbreviation;
        }
    }

    tipped(person_id: string) {
        return (this.tips.filter(tip => tip.person_id === person_id).length > 0);
    }

    get score() {
        if (this.goals === undefined || this.behinds === undefined) {
            return undefined
        }
        if (this.goals === null || this.behinds === null) {
            return null
        }
        return this.goals * 6 + this.behinds
    }
}

export function gamesSupabaseToGames(gamesApi: gameSupabase[]) {
    let objs = gamesApi.map((game) => new Game(game));
    let objsSorted = objs.sort((a, b) => (a.scheduled > b.scheduled) ? 1 : -1);
    return objsSorted;
}

export function teamsSupabaseToGames(teamsApi: teamSupabase[]) {

    const reducer = (prev: { [index: number]: gameSupabase }, curr: teamSupabase) => {
        const teamSimple: teamSupabase = { id: curr.id, team_name: curr.team_name, abbreviation: curr.abbreviation };
        if (curr.game_team !== undefined) {
            for (const gameTeamApi of curr.game_team) {
                let gameTeamSimple = gameTeamApi;
                gameTeamSimple.team = teamSimple;
                if (gameTeamSimple.game !== undefined) {
                    let newGameTeam = { ...gameTeamSimple };
                    delete newGameTeam.game;
                    if (gameTeamSimple.game.id in prev) {
                        prev[gameTeamSimple.game.id].game_team?.push(newGameTeam)
                    } else {
                        const gameSimple = gameTeamSimple.game;
                        if (gameSimple.game_team === undefined) {
                            gameSimple.game_team = [newGameTeam]
                        }
                        else {
                            gameSimple.game_team.push(newGameTeam);
                        }
                        prev[gameSimple.id] = gameSimple
                    }

                }
            }
        }

        return prev;

    }


    let gameSupabases = teamsApi.reduce<{ [index: number]: gameSupabase }>(reducer, {});


    let games = [];
    for (const key in gameSupabases) {
        games.push(new Game(gameSupabases[key]));
    }
    let objSorted = games.sort((a, b) => (a.scheduled > b.scheduled) ? 1 : -1);

    return objSorted;
}


export class Game {
    game_id: number;
    round: { number: number, year: number };
    homeTeamObj: Team;
    awayTeamObj: Team;
    scheduled: Date;
    venue: string;

    constructor(v: gameSupabase) {
        if (v.game_team === undefined) {
            throw new Error('Need gameTeam to construct game but didn\'t receive it');
        }
        this.game_id = v.id;
        this.round = { number: v.round_number, year: v.round_year };
        this.venue = v.venue;

        if (v.game_team.length < 2) {
            throw new Error(`Didn\'t receive two gameTeams for game but need two: ${v.id}`);
        }
        if (v.game_team![0].home) {
            [this.homeTeamObj, this.awayTeamObj] = [new Team(v.game_team![0]), new Team(v.game_team![1])];
        } else if (v.game_team![1].home) {
            [this.awayTeamObj, this.homeTeamObj] = [new Team(v.game_team![0]), new Team(v.game_team![1])];
        } else {
            throw new Error("Failed to parse game that didn't have both a home and away team");
        }

        this.scheduled = parseISO(v.scheduled + 'Z');
    }

    get homeTeam() {
        return this.homeTeamObj.team_name;
    }

    get awayTeam() {
        return this.awayTeamObj.team_name;
    }

    homeIsWinner() {
        if (this.homeTeamObj.score === undefined || this.awayTeamObj.score === undefined) {
            return undefined
        }
        if (this.homeTeamObj.score === null || this.awayTeamObj.score == null) {
            return null
        }
        return this.homeTeamObj.score > this.awayTeamObj.score
    }

    awayIsWinner() {
        if (this.homeTeamObj.score === undefined || this.awayTeamObj.score === undefined) {
            return undefined
        }
        if (this.homeTeamObj.score === null || this.awayTeamObj.score == null) {
            return null
        }
        return this.awayTeamObj.score > this.homeTeamObj.score
    }
}