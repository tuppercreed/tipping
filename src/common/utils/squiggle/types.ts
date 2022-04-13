export type Team = {
    debut: number,
    name: string,
    id: number,
    abbrev: string,
    logo: string,
    retirement: number,
}

export type Game = {
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
    roundname: string,
    tz: string,
    updated: string,
    venue: string,
    winner: string,
    winnerteamid: number,
    year: number,
}

export type Standing = {
    played: number,
    name: string,
    for: number,
    behinds_for: number,
    goals_against: number,
    behinds_against: number,
    percentage: number,
    draws: number,
    wins: number,
    against: number,
    goals_for: number,
    id: number,
    pts: number,
    losses: number,
    rank: number,
}

export type PlayerApproximateValue = {
    mPAV_mid: string,
    PAV_def: string,
    PAV_total_rank: string,
    firstname: string,
    PAV_total: string,
    team: number,
    PAV_def_rank: number,
    mPAV_rank: number,
    PAV_mid_rank: number,
    mPAV_total: string,
    year: number,
    games: number,
    // actual name is %_of_team_games
    percent_of_team_games: number,
    name: string,
    pavid: string,
    PAV_off: string,
    surname: string,
}

export type SquiggleResponse = {
    teams?: Team[];
    games?: Game[];
    standings?: Standing[];
    pav?: PlayerApproximateValue[];
}