import { parseISO } from "date-fns";
import { SquiggleAnyResponse, SquiggleResponse, Standing as StandingSquiggle, Game as GameSquiggle, Team as TeamSquiggle, Source as SourceSquiggle, Tip as TipSquiggle } from "../../modules/squiggle/types";
import { supabase } from "../../modules/supabase/client";
import { definitions } from '../../modules/supabase/types';

type PartialList<T> = {
    [P in keyof T]?: T[P] | undefined;
};

type PartialListOptional<T> = {
    [P in keyof T]?: PartialList<T[P]>[] | undefined;
}

export class UpdateGames<T extends SquiggleResponse> implements Updateable {
    #endpoint = 'https://api.squiggle.com.au/';
    #userAgent = 'TCTippingApp/0.0.1 github.com/tuppercreed/tipping';
    dataSquiggle: T[];
    // List allows some tables to be updated before others that are dependent on them
    dataSupabase: PartialListOptional<definitions>[];

    round?: number;
    // Required by Updateable
    queryName: keyof SquiggleAnyResponse = 'games';
    arguments: { [argName: string]: any };

    constructor(round?: number) {
        this.round = round;
        this.dataSquiggle = [];
        this.dataSupabase = [];

        this.arguments = { year: new Date().getFullYear().toString(), round: this.round };
    }

    async #fetcher(args: string): Promise<SquiggleAnyResponse> {
        const headers = new Headers({
            "Accept": "application/json",
            "User-Agent": this.#userAgent,
        });
        let res = await fetch(`${this.#endpoint}?q=${args}`, { method: 'GET', mode: 'no-cors', headers });
        if (res.status === 200) return await res.json();
        else return Promise.reject(res);
    }

    #combineArgString(query: keyof SquiggleAnyResponse, args: { [arg: string]: any }) {
        let combined = `${query}`;
        for (const [arg, val] of Object.entries(args)) {
            // ; first assumes preceding query argument
            combined = combined.concat(`;${arg}=${val}`);
        }
        return combined;
    }

    async fetchData(query: keyof SquiggleAnyResponse, args: { [arg: string]: any }) {
        // Return pre-existing data first
        if (this.dataSquiggle.length > 0) return this.dataSquiggle;

        const argString = this.#combineArgString(query, args);

        // Fetch data
        const res = await this.#fetcher(argString);
        if (!(query in res)) throw new Error(`No ${query} return by Squiggle API`);

        // Cache value and return
        this.dataSquiggle = res[query] as T[];
        return res[query];
    }

    getData() {
        return this.fetchData(this.queryName, this.arguments)
    }

    async upsert() {
        for (const table of this.dataSupabase) {
            for (const [tableName, updates] of Object.entries(table)) {
                if (updates.length === 0) throw new Error('No data provided to upsert function');
                const { data, error } = await supabase.from(tableName).upsert(updates, { returning: 'minimal', ignoreDuplicates: true });
                if (error) throw error;
            }
        }
    }

    async update() {
        if (this.dataSquiggle.length === 0) {
            console.log("Getting data")
            await this.getData()
        }
        const translated = this.translate();
        for (const table of translated) {
            this.dataSupabase.push(table);
        }

        this.upsert();
    }

    // Required for Updateable
    translate(): { [tableName in keyof definitions]?: Partial<definitions[tableName]>[] }[] {
        // This should cover that 'updateGames' currently does:
        // Decompose SquiggleGame into parts, process those parts and
        // return tournament_round, game, game_team

        const rounds: definitions['tournament_round'][] = (this.dataSquiggle as GameSquiggle[]).map((game) => {
            return {
                round_year: game.year,
                round_number: game.round,
                round_name: game.roundname,
            }
        });

        const games: Omit<definitions['game'], 'created_at' | 'updated_at'>[] = (this.dataSquiggle as GameSquiggle[]).map((game) => {
            return {
                id: game.id,
                venue: game.venue,
                scheduled: parseISO(game.date.concat(game.tz)).toISOString(),
                round_year: game.year,
                round_number: game.round,
                complete: (game.complete === 100),
            }
        });

        const gameTeams: Omit<definitions['game_team'], 'created_at' | 'updated_at'>[] = (this.dataSquiggle as GameSquiggle[]).map((game) => {
            return [['hteamid', true, 'hgoals', 'hbehinds'] as const, ['ateamid', false, 'agoals', 'abehinds'] as const].map((codes) => {
                return {
                    game_id: game.id,
                    team_id: game[codes[0]],
                    home: codes[1],
                    goals: game[codes[2]],
                    behinds: game[codes[3]],
                }
            })
        }).flat(1);


        return [
            { tournament_round: rounds },
            { game: games, },
            { game_team: gameTeams }
        ];
    }

}

interface Updateable {
    queryName: keyof SquiggleAnyResponse,
    arguments: { [argName: string]: any },
    // Return an object where bulk upserts are labelled per table
    translate(): { [tableName in keyof definitions]?: Partial<definitions[tableName]>[] }[],
    //translate(): Map<[keyof definitions], Partial<definitions[keyof definitions]>,
}

export class UpdateStandings extends UpdateGames<StandingSquiggle> implements Updateable {
    tableName: 'team' = 'team';
    queryName: keyof SquiggleAnyResponse = 'standings';

    constructor(round: number) {
        super(round);
    }

    translate() {
        return [{
            [this.tableName]: this.dataSquiggle.map((standing) => {
                return { id: standing.id, team_name: standing.name, standing: JSON.stringify(standing) };
            })
        }];
    }
}

export class UpdateTeams extends UpdateGames<TeamSquiggle> implements Updateable {
    tableName: 'team' = 'team';
    queryName: keyof SquiggleAnyResponse = 'teams';

    constructor(teamid?: number) {
        super(undefined)
    }

    translate() {
        return [{
            [this.tableName]: this.dataSquiggle.map((team) => {
                return {
                    id: team.id,
                    team_name: team.name,
                    abbreviation: team.abbrev,
                }
            })
        }]
    }
}

export class UpdateSources extends UpdateGames<SourceSquiggle> implements Updateable {
    tableName: 'predictor' = 'predictor';
    queryName: keyof SquiggleAnyResponse = 'sources';

    constructor() {
        super(undefined)
        delete this.arguments.year;
    }

    translate() {
        return [{
            [this.tableName]: this.dataSquiggle.map<definitions['predictor']>((source) => {
                return {
                    id: source.id,
                    predictor_name: source.name,
                    predictor_url: source.url,
                };
            })
        }];
    }
}

export class UpdateTips extends UpdateGames<TipSquiggle> implements Updateable {
    tableName: 'prediction' = 'prediction';
    queryName: keyof SquiggleAnyResponse = 'tips';

    constructor(round: number, gameId?: number, complete?: boolean) {
        super(round)
    }

    translate() {
        return [{
            [this.tableName]: this.dataSquiggle.map<definitions['prediction'][]>((tip) => {
                const codes: { teamId: 'hteamid' | 'ateamid', confidence: (hconfidence: string) => number }[] = [
                    { teamId: 'hteamid', confidence: (hconfidence: string) => parseFloat(hconfidence) },
                    { teamId: 'ateamid', confidence: (hconfidence: string) => 100 - parseFloat(hconfidence) }
                ];
                return codes.map(({ teamId, confidence }) => {
                    return {
                        game_id: tip.gameid,
                        team_id: tip[teamId],
                        predictor_id: tip.sourceid,
                        win: (tip.tipteamid === tip[teamId]),
                        confidence: confidence(tip.hconfidence),
                    }
                })
            }).flat(1)
        }]
    }
}