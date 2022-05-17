import { formatISO, isAfter, isBefore, parseISO } from "date-fns";

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
    prediction?: { win: boolean, confidence: number, predictor: { id: number, predictor_name: string, predictor_url: string } }[],
    [index: string]: any,
}

export interface tipSupabase {
    person_id: string,
    game_id: number,
    team_id: number,
    [index: string]: any,
}



export class Team {
    team_id: number;
    team_name: string;
    goals?: number;
    behinds?: number;
    tips: tipSupabase[];
    abbreviation?: string;
    confidence?: number;

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

        this.confidence = gameTeam.confidence;
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

interface History {
    history: { [teamId: number]: { [roundNumber: number]: { gameId: number } } },
}

export interface GamesApi extends History {
    games: { [gameId: number]: gameSupabase }
}

export interface UserTips {
    [gameId: number]: { teamId: number }
}

export interface Tips {
    [personId: string]: UserTips
}

export function TipToObject(tipsDb: tipSupabase[]) {
    return tipsDb.reduce<Tips>((tips, tipDb) => {
        if (tipDb.person_id in tips) tips[tipDb.person_id][tipDb.game_id] = { teamId: tipDb.team_id }
        else tips[tipDb.person_id] = { [tipDb.game_id]: { teamId: tipDb.team_id } }
        return tips;
    }, {});
}

export function TipObjectToTipApi(tips: Tips) {
    let tipsList: tipSupabase[] = [];
    for (const [personId, games] of Object.entries(tips)) {
        for (const [gameId, team] of Object.entries(games)) {
            tipsList.push({ person_id: personId, game_id: Number(gameId), team_id: team.teamId })
        }
    }
    return tipsList;
}

export interface Data extends History {
    games: { [gameId: number]: Game },
    rounds: { [roundNumber: number]: { gameId: number }[] },
    tips?: Tips,
}

export function teamsApiToGamesApi(teamsApi: teamSupabase[]): GamesApi {
    let history: { [roundNumber: number]: { [teamId: number]: { gameId: number } } } = {};
    let games: { [gameId: number]: gameSupabase } = {};

    for (const team of teamsApi) {
        if (team.game_team !== undefined) {
            let teamNoGameTeam = { ...team };
            delete teamNoGameTeam.game_team;
            for (const gameTeam of team.game_team) {
                if (gameTeam.game !== undefined) {
                    let gameTeamNoGame = { ...gameTeam };
                    delete gameTeamNoGame.game;
                    gameTeamNoGame.team = teamNoGameTeam;
                    if (gameTeamNoGame !== undefined && 'prediction' in gameTeamNoGame) {
                        gameTeamNoGame.confidence = Math.round(gameTeamNoGame.prediction!.reduce((sum, prediction) => sum + prediction.confidence, 0) / gameTeamNoGame.prediction!.length);
                        delete gameTeamNoGame.prediction;
                    }
                    if (gameTeam.game.id in games) {
                        if (games[gameTeam.game.id].game_team === undefined) {
                            games[gameTeam.game.id].game_team = [gameTeamNoGame]
                        } else {
                            games[gameTeam.game.id].game_team?.push(gameTeamNoGame)
                        }
                    } else {
                        games[gameTeam.game.id] = gameTeam.game;
                        games[gameTeam.game.id].game_team = [gameTeamNoGame]
                    }
                    if (team.id in history) {
                        history[team.id][gameTeam.game.round_number] = { gameId: gameTeam.game.id }
                    } else {
                        history[team.id] = { [gameTeam.game.round_number]: { gameId: gameTeam.game.id } }
                    }
                }
            }
        }
    }
    return { history, games };
}

export function ApiToObject(api: GamesApi) {
    let data: Data = { history: api.history, games: {}, rounds: {} };
    for (const [gameId, game] of Object.entries(api.games)) {
        data.games[Number(gameId)] = new Game(game)
        if (game.round_number in data.rounds) {
            data.rounds[game.round_number].push({ gameId: Number(gameId) })
        } else {
            data.rounds[game.round_number] = [{ gameId: Number(gameId) }]
        }
    }

    for (const [roundNumber, games] of Object.entries(data.rounds)) {
        data.rounds[Number(roundNumber)] = games.sort((a, b) => {
            if (isAfter(data.games[a.gameId].scheduled, data.games[b.gameId].scheduled)) return 1
            else if (isBefore(data.games[a.gameId].scheduled, data.games[b.gameId].scheduled)) return -1
            else if (a.gameId > b.gameId) return 1 // If games are at the same time, order by gameId
            else return -1
        });
    }
    return data;
}



export enum MatchResult {
    Won,
    Drew,
    Lost,
    Unknown,
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

    isWinner(home: boolean) {
        if (this.homeTeamObj.score === undefined || this.awayTeamObj.score === undefined || this.homeTeamObj.score === null || this.awayTeamObj.score === null) {
            return MatchResult.Unknown
        }
        let [one, two]: (number | null)[] = [null, null]
        if (home) [one, two] = [this.homeTeamObj.score, this.awayTeamObj.score]
        else[two, one] = [this.homeTeamObj.score, this.awayTeamObj.score]

        if (one > two) return MatchResult.Won
        else if (one < two) return MatchResult.Lost
        else if (one === two) return MatchResult.Drew
        else throw new Error('Result unclear')

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

    started() {
        return isAfter(new Date(), this.scheduled)
    }
}