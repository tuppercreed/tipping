import { AppConfig } from '../../common/utils/app.config'

import { SquiggleAnyResponse } from './types';

const fetcher = async (args: string): Promise<SquiggleAnyResponse> => {
    const url = `${AppConfig.aflEndpoint}?q=${args}`;
    const headers = new Headers({
        "Accept": "application/json",
        "User-Agent": "TCTippingApp/0.0.1 github.com/tuppercreed/tipping",
    });
    let res = await fetch(url, { method: 'GET', mode: 'no-cors', headers: headers });
    if (res.status == 200) {
        let json = await res.json();
        return json;
    }
    return Promise.reject(res)
}

type Query = 'teams' | 'games' | 'sources' | 'tips' | 'standings' | 'pav';

export const fetchConstructor = async (q: Query, args: { [arg: string]: any }) => {
    let combined = `${q}`;
    for (const [arg, val] of Object.entries(args)) {
        combined.concat(`;${arg}=${val}`);
    }
    const res = await fetcher(combined);
    if (q in res) return res[q]
    else throw new Error(`No ${q} returned by Squiggle API`);
}

export async function fetchTeams() {
    const res = await fetcher(`teams;year=${new Date().getFullYear().toString()}`);
    if (res.teams !== undefined) {
        return res.teams
    }
    throw new Error('No teams returned');
}

export async function fetchGames(round: number) {
    const res = await fetcher(`games;year=${new Date().getFullYear().toString()};round=${round}`);
    if (res.games !== undefined) {
        return res.games;
    }
    throw new Error('No games returned');
}

export async function fetchStandings(round: number) {
    const res = await fetcher(`standings;year=${new Date().getFullYear().toString()};round=${round}`);
    if (res.standings !== undefined) {
        return res.standings;
    }
    throw new Error('No standings returned');
}

export async function fetchPlayerApproximateValue(teamId: number) {
    const res = await fetcher(`pav;year=${new Date().getFullYear().toString()};team=${teamId}`)
    if (res.pav !== undefined) {
        return res.pav;
    }
    throw new Error('No PlayerApproximateValues returned');
}
