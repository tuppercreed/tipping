import { SquiggleAnyResponse, SquiggleResponse, Standing as StandingSquiggle } from "../../modules/squiggle/types";
import { supabase } from "../../modules/supabase/client";
import { definitions } from '../../modules/supabase/types';

type PartialList<T> = {
    [P in keyof T]?: T[P] | undefined;
};

type PartialListOptional<T> = {
    [P in keyof T]?: PartialList<T[P]>[] | undefined;
}

class Update<T extends SquiggleResponse> implements Updateable {
    #endpoint = 'https://api.squiggle.com.au/';
    #userAgent = 'TCTippingApp/0.0.1 github.com/tuppercreed/tipping';
    dataSquiggle: T[];
    // List allows some tables to be updated before others that are dependent on them
    dataSupabase: PartialListOptional<definitions>[];

    round: number;
    // Required by Updateable
    queryName: keyof SquiggleAnyResponse = 'games';
    arguments: { [argName: string]: any };

    constructor(round: number) {
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
                const { data, error } = await supabase.from(tableName).upsert(updates, { returning: 'minimal' });
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
        return [{
            tournament_round: [{
                round_year: 2022,
                round_number: 9,
            }],
        }]
    }

}

interface Updateable {
    queryName: keyof SquiggleAnyResponse,
    arguments: { [argName: string]: any },
    // Return an object where bulk upserts are labelled per table
    translate(): { [tableName in keyof definitions]?: Partial<definitions[tableName]>[] }[],
    //translate(): Map<[keyof definitions], Partial<definitions[keyof definitions]>,
}

export class Standing extends Update<StandingSquiggle> implements Updateable {
    tableName: 'team' = 'team';
    queryName: keyof SquiggleAnyResponse = 'standings';

    constructor(round: number) {
        super(round);
    }

    translate() {
        return [{ [this.tableName]: this.dataSquiggle.map((standing) => { return { id: standing.id, team_name: standing.name, standing: JSON.stringify(standing) }; }) }];
    }
}
