import path from 'path'
import fs from 'fs'
import useSWR from 'swr'
import { AppConfig } from './app.config'

export type GamesResponse = {
    games?: {
        abehinds: number,
        agoals: number,
        ascore: number,
        ateam: string,
        ateamid: number,
        complete: number,
        date: string,
        hbehinds: number,
        hgoals: number,
        hteam: string,
        hteamid: number,
        id: number,
        is_final: number,
        is_grand_final: number,
        localtime: string,
        round: number,
        roundname: number,
        tz: string,
        updated: string,
        venue: string,
        winner: string,
        winnerteamid: number,
        year: number,
    }[]
}

export const fetcher = async (url: string): Promise<GamesResponse> => {
    const url_more = `${AppConfig.aflEndpoint}?q=${url}`;
    const r = await fetch(url_more)
    return await r.json()
}

export async function getGames(key: string) {
    const url = `${AppConfig.aflEndpoint}?q=${key}`;
    let headers = new Headers({
        "Accept": "application/json",
        "Content-Type": "application/json",
        "User-Agent": "TCTippingApp/0.0.1 github.com/tuppercreed/tipping",
    });
    let response = await fetch(url, { method: 'GET', mode: 'no-cors', headers: headers });
    let data: GamesResponse = await response.json()
    return data;
}

export function useGames(round: number) {
    const { data, error } = useSWR(`games;year=${new Date().getFullYear().toString()};round=${round}`, getGames, { shouldRetryOnError: false });


    // use as const { games, isLoading, isError } = useGames(round)
    // if (isLoading) return <Spinner />
    // if (isError) return <Error />
    // return Successful return here
    return {
        games: data,
        isLoading: !error && !data,
        isError: error
    }
}
