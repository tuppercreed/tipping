import { Team, Game, Standing, PlayerApproximateValue, SquiggleResponse } from './types';
import { definitions } from '../supabase/types';
import { parseISO } from 'date-fns';
import { supabase } from '../supabase/client'

type CompetitionSupabase = definitions['competition'];
type TeamSupabase = definitions['team'];
type GameSupabase = definitions['game'];
type GameTeamSupabase = definitions['game_team'];
type TournamentRoundSupaBase = definitions['tournament_round'];

type GameTeamSupabaseNoCreationTime = {
    game_id: number,
    team_id: number,
    home: boolean,
    goals?: number,
    behinds?: number,
}

type GameSupabaseNoCreationTime = {
    id: number,
    venue: string,
    scheduled: string,
    round_year: number,
    round_number: number,
    complete: boolean,
}

function toTeam(team: Team): TeamSupabase {
    return {
        id: team.id,
        team_name: team.name,
        abbreviation: team.abbrev,
    }
}

async function upsertTeams(teams: TeamSupabase[]) {
    const { data, error } = await supabase.from('team').upsert(
        teams, { returning: "minimal", ignoreDuplicates: true }
    )
}


function toGame(game: Game): GameSupabaseNoCreationTime {
    let date = game.date;
    date.replace(' ', 'T');
    date += game.tz;
    date = parseISO(date).toISOString();
    return {
        id: game.id,
        venue: game.venue,
        scheduled: date,
        round_year: game.year,
        round_number: game.round,
        complete: (game.complete === 100),
    }
}

async function upsertGames(games: GameSupabaseNoCreationTime[]) {
    const { data, error } = await supabase.from('game').upsert(games, { returning: "minimal" });
}

function toGameTeam(game: Game, home: boolean): GameTeamSupabaseNoCreationTime {
    if (home) {
        return {
            game_id: game.id,
            team_id: game.hteamid,
            home: home,
            goals: game.hgoals,
            behinds: game.hbehinds,
        }
    } else {
        return {
            game_id: game.id,
            team_id: game.ateamid,
            home: home,
            goals: game.agoals,
            behinds: game.hbehinds,
        }
    }
}

async function upsertGameTeams(gameTeams: GameTeamSupabaseNoCreationTime[]) {
    const { data, error } = await supabase.from('game_team').upsert(gameTeams, { returning: "minimal" });
}

function toGameTeamHomeAway(game: Game): GameTeamSupabaseNoCreationTime[] {
    return [toGameTeam(game, true), toGameTeam(game, false)]
}

function toTournamentRound(game: Game): TournamentRoundSupaBase {
    return {
        round_year: game.year,
        round_number: game.round,
        round_name: game.roundname,
    }
}

async function upsertTournamentRounds(rounds: TournamentRoundSupaBase[]) {
    const { data, error } = await supabase.from('tournament_round').upsert(rounds, { returning: 'minimal', ignoreDuplicates: true })
}

export function updateTeams(teams: Team[]) {
    upsertTeams(teams.map((team) => toTeam(team)));
}

export function updateGames(games: Game[]) {
    upsertTournamentRounds(games.map((game) => toTournamentRound(game)));

    upsertGames(games.map((game) => toGame(game)));

    let game_teams = games.map((game) => toGameTeamHomeAway(game));
    let game_teams_flat = game_teams.reduce((acc, val) => acc.concat(val), []);

    console.log("game_teams:", JSON.stringify(game_teams));
    console.log("game_teams_flat: ", JSON.stringify(game_teams_flat));

    upsertGameTeams(game_teams_flat);
}
